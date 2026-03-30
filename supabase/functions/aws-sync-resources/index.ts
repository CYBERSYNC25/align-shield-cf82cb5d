import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, isServiceRole, rateLimitExceededResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 helpers
async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const kDate = await hmacSha256(encoder.encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return await hmacSha256(kService, 'aws4_request');
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function signAwsRequest(params: {
  method: string;
  host: string;
  region: string;
  service: string;
  path: string;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}): Promise<Record<string, string>> {
  const { method, host, region, service, path, body, accessKeyId, secretAccessKey, sessionToken } = params;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.substring(0, 8);
  const payloadHash = await sha256(body);
  const canonicalHeaders = `host:${host}\nx-amz-date:${amzDate}\n${sessionToken ? `x-amz-security-token:${sessionToken}\n` : ''}`;
  const signedHeaders = sessionToken ? 'host;x-amz-date;x-amz-security-token' : 'host;x-amz-date';
  const canonicalRequest = `${method}\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signatureBytes = await hmacSha256(signingKey, stringToSign);
  const signature = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('');

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Host': host,
    'X-Amz-Date': amzDate,
    'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (sessionToken) headers['X-Amz-Security-Token'] = sessionToken;
  return headers;
}

async function assumeRole(roleArn: string, sessionName: string, accessKeyId: string, secretAccessKey: string, region: string) {
  const host = 'sts.amazonaws.com';
  const body = `Action=AssumeRole&Version=2011-06-15&RoleArn=${encodeURIComponent(roleArn)}&RoleSessionName=${encodeURIComponent(sessionName)}&DurationSeconds=900`;
  const headers = await signAwsRequest({ method: 'POST', host, region, service: 'sts', path: '/', body, accessKeyId, secretAccessKey });
  const response = await fetch(`https://${host}/`, { method: 'POST', headers, body });
  const text = await response.text();
  
  if (!response.ok) {
    console.error('STS AssumeRole error:', text);
    const codeMatch = text.match(/<Code>([^<]+)<\/Code>/);
    const msgMatch = text.match(/<Message>([^<]+)<\/Message>/);
    throw new Error(`AssumeRole failed: ${codeMatch?.[1] || 'Unknown'} - ${msgMatch?.[1] || text}`);
  }

  const accessKeyMatch = text.match(/<AccessKeyId>([^<]+)<\/AccessKeyId>/);
  const secretMatch = text.match(/<SecretAccessKey>([^<]+)<\/SecretAccessKey>/);
  const tokenMatch = text.match(/<SessionToken>([^<]+)<\/SessionToken>/);
  
  return {
    accessKeyId: accessKeyMatch?.[1] || '',
    secretAccessKey: secretMatch?.[1] || '',
    sessionToken: tokenMatch?.[1] || '',
  };
}

async function callAwsApi(params: {
  service: string;
  action: string;
  version: string;
  region: string;
  credentials: { accessKeyId: string; secretAccessKey: string; sessionToken: string };
  extraParams?: Record<string, string>;
}) {
  const { service, action, version, region, credentials, extraParams = {} } = params;
  const host = service === 'iam' ? 'iam.amazonaws.com' : `${service}.${region}.amazonaws.com`;
  const bodyParams = new URLSearchParams({ Action: action, Version: version, ...extraParams });
  const body = bodyParams.toString();
  const headers = await signAwsRequest({
    method: 'POST',
    host,
    region,
    service,
    path: '/',
    body,
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
  });
  
  const response = await fetch(`https://${host}/`, { method: 'POST', headers, body });
  const text = await response.text();
  
  if (!response.ok) {
    console.error(`AWS ${service}:${action} error:`, text);
    throw new Error(`${action} failed: ${text.substring(0, 200)}`);
  }
  
  return text;
}

function parseIamUsers(xml: string): Array<{ userName: string; userId: string; createdAt: string; arn: string }> {
  const users: Array<{ userName: string; userId: string; createdAt: string; arn: string }> = [];
  const memberRegex = /<member>([\s\S]*?)<\/member>/g;
  let match;
  
  while ((match = memberRegex.exec(xml)) !== null) {
    const memberXml = match[1];
    const userName = memberXml.match(/<UserName>([^<]+)<\/UserName>/)?.[1] || '';
    const userId = memberXml.match(/<UserId>([^<]+)<\/UserId>/)?.[1] || '';
    const createdAt = memberXml.match(/<CreateDate>([^<]+)<\/CreateDate>/)?.[1] || '';
    const arn = memberXml.match(/<Arn>([^<]+)<\/Arn>/)?.[1] || '';
    
    if (userName) {
      users.push({ userName, userId, createdAt, arn });
    }
  }
  
  return users;
}

function parseS3Buckets(xml: string): Array<{ name: string; createdAt: string }> {
  const buckets: Array<{ name: string; createdAt: string }> = [];
  const bucketRegex = /<Bucket>([\s\S]*?)<\/Bucket>/g;
  let match;
  
  while ((match = bucketRegex.exec(xml)) !== null) {
    const bucketXml = match[1];
    const name = bucketXml.match(/<Name>([^<]+)<\/Name>/)?.[1] || '';
    const createdAt = bucketXml.match(/<CreationDate>([^<]+)<\/CreationDate>/)?.[1] || '';
    
    if (name) {
      buckets.push({ name, createdAt });
    }
  }
  
  return buckets;
}

function parseCloudTrails(xml: string): Array<{ name: string; isMultiRegion: boolean; s3BucketName: string }> {
  const trails: Array<{ name: string; isMultiRegion: boolean; s3BucketName: string }> = [];
  const memberRegex = /<member>([\s\S]*?)<\/member>/g;
  let match;
  
  while ((match = memberRegex.exec(xml)) !== null) {
    const memberXml = match[1];
    const name = memberXml.match(/<Name>([^<]+)<\/Name>/)?.[1] || '';
    const isMultiRegion = memberXml.includes('<IsMultiRegionTrail>true</IsMultiRegionTrail>');
    const s3BucketName = memberXml.match(/<S3BucketName>([^<]+)<\/S3BucketName>/)?.[1] || '';
    
    if (name) {
      trails.push({ name, isMultiRegion, s3BucketName });
    }
  }
  
  return trails;
}

async function listS3Buckets(credentials: { accessKeyId: string; secretAccessKey: string; sessionToken: string }, region: string) {
  const host = 's3.amazonaws.com';
  const headers = await signAwsRequest({
    method: 'GET',
    host,
    region: 'us-east-1',
    service: 's3',
    path: '/',
    body: '',
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: credentials.secretAccessKey,
    sessionToken: credentials.sessionToken,
  });
  
  const response = await fetch(`https://${host}/`, { method: 'GET', headers });
  const text = await response.text();
  
  if (!response.ok) {
    console.error('S3 ListBuckets error:', text);
    throw new Error(`ListBuckets failed: ${text.substring(0, 200)}`);
  }
  
  return text;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting - bypass for service_role (internal calls)
    if (!isServiceRole(authHeader)) {
      const { data: { user: tempUser } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      const rateLimitId = tempUser?.id || req.headers.get('x-forwarded-for') || 'anonymous';

      const rateLimit = await checkRateLimit(rateLimitId, 'aws-sync-resources', 10, 60);
      if (!rateLimit.allowed) {
        return rateLimitExceededResponse(rateLimit, corsHeaders);
      }
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { integration_id } = await req.json();
    console.log('AWS Sync Resources: Starting for integration', integration_id);

    // Get integration config
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .single();

    if (integrationError || !integration) {
      console.error('Integration not found:', integrationError);
      return new Response(JSON.stringify({ success: false, error: 'Integration not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const config = integration.configuration as { roleArn?: string; role_arn?: string; externalId?: string; region?: string };
    const roleArn = config?.roleArn || config?.role_arn;
    const region = config?.region || 'us-east-1';

    if (!roleArn) {
      return new Response(JSON.stringify({ success: false, error: 'No Role ARN configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get SaaS credentials
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS credentials not configured');
      return new Response(JSON.stringify({ success: false, error: 'AWS credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Assume role to get temporary credentials
    console.log('AWS Sync: Assuming role', roleArn);
    const tempCredentials = await assumeRole(roleArn, 'ComplianceSyncResourceSync', accessKeyId, secretAccessKey, region);
    console.log('AWS Sync: Got temporary credentials');

    // Extract account ID from role ARN
    const accountId = roleArn.match(/arn:aws:iam::(\d+):role/)?.[1] || 'Unknown';

    // Fetch resources in parallel
    const [iamUsersXml, s3BucketsXml, cloudTrailXml] = await Promise.all([
      callAwsApi({
        service: 'iam',
        action: 'ListUsers',
        version: '2010-05-08',
        region,
        credentials: tempCredentials,
      }).catch(err => { console.error('IAM ListUsers error:', err); return null; }),
      
      listS3Buckets(tempCredentials, region).catch(err => { console.error('S3 ListBuckets error:', err); return null; }),
      
      callAwsApi({
        service: 'cloudtrail',
        action: 'DescribeTrails',
        version: '2013-11-01',
        region,
        credentials: tempCredentials,
      }).catch(err => { console.error('CloudTrail DescribeTrails error:', err); return null; }),
    ]);

    // Parse responses
    const users = iamUsersXml ? parseIamUsers(iamUsersXml) : [];
    const buckets = s3BucketsXml ? parseS3Buckets(s3BucketsXml) : [];
    const trails = cloudTrailXml ? parseCloudTrails(cloudTrailXml) : [];

    // Try to get MFA status for each user
    const usersWithMfa = await Promise.all(
      users.map(async (iamUser) => {
        try {
          const mfaXml = await callAwsApi({
            service: 'iam',
            action: 'ListMFADevices',
            version: '2010-05-08',
            region,
            credentials: tempCredentials,
            extraParams: { UserName: iamUser.userName },
          });
          const hasMfa = mfaXml.includes('<MFADevice>') || mfaXml.includes('<member>');
          return { ...iamUser, mfaEnabled: hasMfa };
        } catch {
          return { ...iamUser, mfaEnabled: null };
        }
      })
    );

    // Persistir dados no banco
    console.log('AWS Sync: Persisting collected data...');

    // Salvar usuários IAM
    for (const iamUser of usersWithMfa) {
      await supabase.from('integration_collected_data').upsert({
        user_id: user.id,
        integration_name: 'aws',
        resource_type: 'iam_users',
        resource_id: iamUser.userId,
        resource_data: {
          userName: iamUser.userName,
          arn: iamUser.arn,
          createdAt: iamUser.createdAt,
          mfaEnabled: iamUser.mfaEnabled,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Salvar buckets S3
    for (const bucket of buckets) {
      await supabase.from('integration_collected_data').upsert({
        user_id: user.id,
        integration_name: 'aws',
        resource_type: 's3_buckets',
        resource_id: bucket.name,
        resource_data: {
          name: bucket.name,
          createdAt: bucket.createdAt,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Salvar trails CloudTrail
    for (const trail of trails) {
      await supabase.from('integration_collected_data').upsert({
        user_id: user.id,
        integration_name: 'aws',
        resource_type: 'cloudtrail_trails',
        resource_id: trail.name,
        resource_data: {
          name: trail.name,
          isMultiRegion: trail.isMultiRegion,
          s3BucketName: trail.s3BucketName,
        },
        collected_at: new Date().toISOString(),
      }, { onConflict: 'user_id,integration_name,resource_type,resource_id' });
    }

    // Atualizar status da integração
    await supabase.from('integration_status').upsert({
      user_id: user.id,
      integration_name: 'aws',
      status: 'healthy',
      health_score: 100,
      last_sync_at: new Date().toISOString(),
      metadata: {
        accountId,
        region,
        iam_users_count: usersWithMfa.length,
        s3_buckets_count: buckets.length,
        cloudtrail_trails_count: trails.length,
      },
    }, { onConflict: 'user_id,integration_name' });

    // Update last sync time on integrations table
    await supabase
      .from('integrations')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', integration_id);

    console.log('AWS Sync: Data persisted successfully');

    const response = {
      success: true,
      persisted: true,
      data: {
        timestamp: new Date().toISOString(),
        accountId,
        iam: {
          totalUsers: usersWithMfa.length,
          users: usersWithMfa.map(u => ({
            userName: u.userName,
            userId: u.userId,
            createdAt: u.createdAt,
            mfaEnabled: u.mfaEnabled,
          })),
        },
        s3: {
          totalBuckets: buckets.length,
          buckets: buckets.map(b => ({
            name: b.name,
            createdAt: b.createdAt,
          })),
        },
        cloudtrail: {
          enabled: trails.length > 0,
          totalTrails: trails.length,
          trails: trails.map(t => ({
            name: t.name,
            isMultiRegion: t.isMultiRegion,
            s3BucketName: t.s3BucketName,
          })),
        },
      },
    };

    console.log('AWS Sync Resources: Complete', {
      users: usersWithMfa.length,
      buckets: buckets.length,
      trails: trails.length,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AWS Sync Resources error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
