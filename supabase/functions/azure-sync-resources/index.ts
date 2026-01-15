/**
 * Azure AD / Microsoft Entra ID - Resource Sync
 * 
 * Collects users, groups, and conditional access policies from Microsoft Graph API
 * and stores them in integration_collected_data for compliance monitoring.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { checkRateLimit, isServiceRole, rateLimitExceededResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inline crypto utilities for token decryption
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const salt = encoder.encode('apoc-token-encryption-salt-v1');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function decryptToken(encryptedText: string, encryptionKey: string): Promise<string> {
  const [ivHex, ciphertextHex] = encryptedText.split(':');
  if (!ivHex || !ciphertextHex) {
    throw new Error('Invalid encrypted token format');
  }

  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);
  const key = await deriveKey(encryptionKey);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}

function isEncrypted(token: string): boolean {
  const parts = token.split(':');
  if (parts.length !== 2) return false;
  return /^[0-9a-f]+$/i.test(parts[0]) && /^[0-9a-f]+$/i.test(parts[1]);
}

interface GraphUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string | null;
  jobTitle: string | null;
  department: string | null;
  accountEnabled: boolean;
  userType: string;
  createdDateTime: string;
  lastSignInDateTime?: string;
  mfaEnabled?: boolean;
}

interface GraphGroup {
  id: string;
  displayName: string;
  description: string | null;
  membershipType: string;
  securityEnabled: boolean;
  mailEnabled: boolean;
  memberCount?: number;
}

interface ConditionalAccessPolicy {
  id: string;
  displayName: string;
  state: string;
  conditions: Record<string, any>;
  grantControls: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeaderRaw = req.headers.get('Authorization');
    const authHeader = authHeaderRaw?.replace('Bearer ', '');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Rate limiting - bypass for service_role (internal calls)
    if (!isServiceRole(authHeaderRaw)) {
      const { data: { user: tempUser } } = await supabaseClient.auth.getUser(authHeader);
      const rateLimitId = tempUser?.id || req.headers.get('x-forwarded-for') || 'anonymous';

      const rateLimit = await checkRateLimit(rateLimitId, 'azure-sync-resources', 10, 60);
      if (!rateLimit.allowed) {
        return rateLimitExceededResponse(rateLimit, corsHeaders);
      }
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get Azure AD tokens
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('integration_oauth_tokens')
      .select('*')
      .eq('user_id', user.id)
      .eq('integration_name', 'azure_ad')
      .single();

    if (tokenError || !tokenData) {
      throw new Error('Azure AD not connected. Please connect first.');
    }

    // Check token expiration
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt <= new Date()) {
      // Token expired - need to refresh
      throw new Error('Azure AD token expired. Please reconnect.');
    }

    // Decrypt access token
    const tokenEncryptionKey = Deno.env.get('TOKEN_ENCRYPTION_KEY');
    let accessToken = tokenData.access_token;

    if (tokenEncryptionKey && isEncrypted(accessToken)) {
      accessToken = await decryptToken(accessToken, tokenEncryptionKey);
    }

    // Collect resources from Microsoft Graph
    const graphBaseUrl = 'https://graph.microsoft.com/v1.0';
    const collectedResources: Array<{
      resource_type: string;
      resource_id: string;
      resource_data: Record<string, any>;
    }> = [];

    // 1. Collect Users
    console.log('Fetching Azure AD users...');
    try {
      const usersResponse = await fetch(
        `${graphBaseUrl}/users?$select=id,displayName,userPrincipalName,mail,jobTitle,department,accountEnabled,userType,createdDateTime&$top=999`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const users: GraphUser[] = usersData.value || [];

        // For each user, try to get their authentication methods (MFA status)
        for (const graphUser of users) {
          let mfaEnabled = false;

          try {
            const authMethodsResponse = await fetch(
              `${graphBaseUrl}/users/${graphUser.id}/authentication/methods`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );

            if (authMethodsResponse.ok) {
              const authMethods = await authMethodsResponse.json();
              // Check if user has any MFA methods beyond password
              mfaEnabled = (authMethods.value || []).some((method: any) => 
                method['@odata.type'] !== '#microsoft.graph.passwordAuthenticationMethod'
              );
            }
          } catch (e) {
            // MFA check failed, assume false
            console.log(`Could not fetch MFA status for ${graphUser.userPrincipalName}`);
          }

          collectedResources.push({
            resource_type: 'user',
            resource_id: graphUser.id,
            resource_data: {
              ...graphUser,
              mfaEnabled,
            },
          });
        }

        console.log(`Collected ${users.length} Azure AD users`);
      } else {
        const errorText = await usersResponse.text();
        console.error('Failed to fetch users:', errorText);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }

    // 2. Collect Groups
    console.log('Fetching Azure AD groups...');
    try {
      const groupsResponse = await fetch(
        `${graphBaseUrl}/groups?$select=id,displayName,description,groupTypes,securityEnabled,mailEnabled&$top=999`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const groups: GraphGroup[] = groupsData.value || [];

        for (const group of groups) {
          // Get member count
          let memberCount = 0;
          try {
            const membersResponse = await fetch(
              `${graphBaseUrl}/groups/${group.id}/members/$count`,
              {
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'ConsistencyLevel': 'eventual',
                },
              }
            );
            if (membersResponse.ok) {
              memberCount = parseInt(await membersResponse.text()) || 0;
            }
          } catch (e) {
            console.log(`Could not get member count for group ${group.displayName}`);
          }

          collectedResources.push({
            resource_type: 'group',
            resource_id: group.id,
            resource_data: {
              ...group,
              memberCount,
            },
          });
        }

        console.log(`Collected ${groups.length} Azure AD groups`);
      } else {
        const errorText = await groupsResponse.text();
        console.error('Failed to fetch groups:', errorText);
      }
    } catch (e) {
      console.error('Error fetching groups:', e);
    }

    // 3. Collect Conditional Access Policies
    console.log('Fetching Conditional Access Policies...');
    try {
      const policiesResponse = await fetch(
        `${graphBaseUrl}/identity/conditionalAccess/policies`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (policiesResponse.ok) {
        const policiesData = await policiesResponse.json();
        const policies: ConditionalAccessPolicy[] = policiesData.value || [];

        for (const policy of policies) {
          collectedResources.push({
            resource_type: 'conditional_access_policy',
            resource_id: policy.id,
            resource_data: policy,
          });
        }

        console.log(`Collected ${policies.length} Conditional Access Policies`);
      } else {
        const status = policiesResponse.status;
        if (status === 403) {
          console.log('No permission to read Conditional Access Policies (requires Policy.Read.All)');
        } else {
          const errorText = await policiesResponse.text();
          console.error('Failed to fetch policies:', errorText);
        }
      }
    } catch (e) {
      console.error('Error fetching policies:', e);
    }

    // 4. Store collected resources
    const now = new Date().toISOString();
    const expiresAtData = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Delete old data for this integration
    await supabaseClient
      .from('integration_collected_data')
      .delete()
      .eq('user_id', user.id)
      .eq('integration_name', 'azure_ad');

    // Insert new data
    if (collectedResources.length > 0) {
      const insertData = collectedResources.map(resource => ({
        user_id: user.id,
        integration_name: 'azure_ad',
        resource_type: resource.resource_type,
        resource_id: resource.resource_id,
        resource_data: resource.resource_data,
        collected_at: now,
        expires_at: expiresAtData,
      }));

      const { error: insertError } = await supabaseClient
        .from('integration_collected_data')
        .insert(insertData);

      if (insertError) {
        console.error('Error inserting collected data:', insertError);
        throw new Error('Failed to store collected resources');
      }
    }

    // Update integration status
    await supabaseClient
      .from('integration_status')
      .upsert({
        user_id: user.id,
        integration_name: 'azure_ad',
        status: 'connected',
        last_sync_at: now,
        health_score: 100,
        metadata: {
          users_count: collectedResources.filter(r => r.resource_type === 'user').length,
          groups_count: collectedResources.filter(r => r.resource_type === 'group').length,
          policies_count: collectedResources.filter(r => r.resource_type === 'conditional_access_policy').length,
        },
      }, {
        onConflict: 'user_id,integration_name',
      });

    // Log the sync
    await supabaseClient
      .from('system_audit_logs')
      .insert({
        user_id: user.id,
        action_type: 'integration_sync_completed',
        action_category: 'integration',
        description: `Azure AD sync completed: ${collectedResources.length} resources collected`,
        resource_type: 'integration',
        resource_id: 'azure_ad',
        metadata: {
          users: collectedResources.filter(r => r.resource_type === 'user').length,
          groups: collectedResources.filter(r => r.resource_type === 'group').length,
          policies: collectedResources.filter(r => r.resource_type === 'conditional_access_policy').length,
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Azure AD resources synced successfully',
        summary: {
          users: collectedResources.filter(r => r.resource_type === 'user').length,
          groups: collectedResources.filter(r => r.resource_type === 'group').length,
          conditional_access_policies: collectedResources.filter(r => r.resource_type === 'conditional_access_policy').length,
          total: collectedResources.length,
        },
        synced_at: now,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in azure-sync-resources:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
