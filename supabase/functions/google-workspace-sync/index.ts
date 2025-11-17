/**
 * Google Workspace API Integration
 * 
 * This edge function consumes Google Workspace Admin SDK APIs to fetch:
 * - Users list with details
 * - Groups and members
 * - Admin audit logs
 * 
 * @requires GOOGLE_CLIENT_ID - OAuth 2.0 Client ID
 * @requires GOOGLE_CLIENT_SECRET - OAuth 2.0 Client Secret
 * 
 * @endpoint POST /google-workspace-sync
 * @auth Required - Uses stored OAuth tokens from integration_oauth_tokens table
 * 
 * @request_body
 * {
 *   "action": "list_users" | "list_groups" | "get_audit_logs",
 *   "params": {
 *     "maxResults": number,
 *     "domain": string,
 *     "startTime": string (ISO 8601)
 *   }
 * }
 * 
 * @response_success
 * {
 *   "success": true,
 *   "data": {
 *     "users": Array<User> | undefined,
 *     "groups": Array<Group> | undefined,
 *     "auditLogs": Array<AuditLog> | undefined,
 *     "metadata": {
 *       "totalCount": number,
 *       "syncedAt": string,
 *       "nextPageToken": string | null
 *     }
 *   }
 * }
 * 
 * @response_error
 * {
 *   "success": false,
 *   "error": string,
 *   "code": "TOKEN_EXPIRED" | "INVALID_TOKEN" | "API_ERROR" | "MISSING_PARAMS"
 * }
 * 
 * @example
 * ```typescript
 * const { data, error } = await supabase.functions.invoke('google-workspace-sync', {
 *   body: { 
 *     action: 'list_users',
 *     params: { maxResults: 100, domain: 'example.com' }
 *   }
 * });
 * ```
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface User {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  isAdmin: boolean;
  suspended: boolean;
  orgUnitPath: string;
  lastLoginTime?: string;
  creationTime: string;
}

interface Group {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
}

interface AuditLog {
  id: {
    time: string;
    uniqueQualifier: string;
  };
  actor: {
    email: string;
    profileId: string;
  };
  events: Array<{
    type: string;
    name: string;
    parameters?: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header', code: 'UNAUTHORIZED' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token', code: 'INVALID_TOKEN' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { action, params } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action parameter', code: 'MISSING_PARAMS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch OAuth token from database
    const { data: tokenData, error: tokenError } = await supabase
      .from('integration_oauth_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .eq('integration_name', 'google_workspace')
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Google Workspace not connected. Please authorize first.', 
          code: 'TOKEN_NOT_FOUND' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now >= expiresAt) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token expired. Please refresh your connection.', 
          code: 'TOKEN_EXPIRED' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = tokenData.access_token;

    // Execute action based on request
    let result;
    switch (action) {
      case 'list_users':
        result = await listUsers(accessToken, params);
        break;
      case 'list_groups':
        result = await listGroups(accessToken, params);
        break;
      case 'get_audit_logs':
        result = await getAuditLogs(accessToken, params);
        break;
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action', code: 'INVALID_ACTION' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google Workspace sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'API_ERROR'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * List users from Google Workspace
 * 
 * @param accessToken - Valid OAuth 2.0 access token
 * @param params - Query parameters (maxResults, domain, pageToken)
 * @returns Users list with metadata
 * 
 * @throws Error if API request fails
 * 
 * @example
 * const users = await listUsers(token, { maxResults: 100, domain: 'example.com' });
 */
async function listUsers(
  accessToken: string, 
  params: { maxResults?: number; domain?: string; pageToken?: string }
) {
  const maxResults = params.maxResults || 100;
  const domain = params.domain || 'primary';
  
  let url = `https://admin.googleapis.com/admin/directory/v1/users?domain=${domain}&maxResults=${maxResults}`;
  if (params.pageToken) {
    url += `&pageToken=${params.pageToken}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google API Error (list_users):', error);
    throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    users: data.users as User[],
    metadata: {
      totalCount: data.users?.length || 0,
      syncedAt: new Date().toISOString(),
      nextPageToken: data.nextPageToken || null,
    },
  };
}

/**
 * List groups from Google Workspace
 * 
 * @param accessToken - Valid OAuth 2.0 access token
 * @param params - Query parameters (maxResults, domain, pageToken)
 * @returns Groups list with metadata
 * 
 * @throws Error if API request fails
 * 
 * @example
 * const groups = await listGroups(token, { maxResults: 50 });
 */
async function listGroups(
  accessToken: string,
  params: { maxResults?: number; domain?: string; pageToken?: string }
) {
  const maxResults = params.maxResults || 100;
  const domain = params.domain || 'primary';
  
  let url = `https://admin.googleapis.com/admin/directory/v1/groups?domain=${domain}&maxResults=${maxResults}`;
  if (params.pageToken) {
    url += `&pageToken=${params.pageToken}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google API Error (list_groups):', error);
    throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    groups: data.groups as Group[],
    metadata: {
      totalCount: data.groups?.length || 0,
      syncedAt: new Date().toISOString(),
      nextPageToken: data.nextPageToken || null,
    },
  };
}

/**
 * Get admin audit logs from Google Workspace
 * 
 * @param accessToken - Valid OAuth 2.0 access token
 * @param params - Query parameters (maxResults, startTime, endTime, applicationName)
 * @returns Audit logs with metadata
 * 
 * @throws Error if API request fails
 * 
 * @example
 * const logs = await getAuditLogs(token, { 
 *   maxResults: 50, 
 *   startTime: '2024-01-01T00:00:00Z',
 *   applicationName: 'admin'
 * });
 */
async function getAuditLogs(
  accessToken: string,
  params: { maxResults?: number; startTime?: string; endTime?: string; applicationName?: string }
) {
  const maxResults = params.maxResults || 100;
  const applicationName = params.applicationName || 'admin';
  
  let url = `https://admin.googleapis.com/admin/reports/v1/activity/users/all/applications/${applicationName}?maxResults=${maxResults}`;
  
  if (params.startTime) {
    url += `&startTime=${params.startTime}`;
  }
  if (params.endTime) {
    url += `&endTime=${params.endTime}`;
  }

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Google API Error (get_audit_logs):', error);
    throw new Error(`Failed to fetch audit logs: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    auditLogs: data.items as AuditLog[],
    metadata: {
      totalCount: data.items?.length || 0,
      syncedAt: new Date().toISOString(),
      nextPageToken: data.nextPageToken || null,
    },
  };
}
