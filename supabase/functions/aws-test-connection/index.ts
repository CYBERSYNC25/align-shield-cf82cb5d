import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pure Web Crypto API implementation for AWS Sig V4
async function hmacSha256(key: ArrayBuffer, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return await hmacSha256(kService, 'aws4_request');
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(message: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
  return toHex(hashBuffer);
}

async function signAwsRequest(params: {
  method: string; service: string; region: string; host: string; path: string;
  queryString: string; body: string; accessKeyId: string; secretAccessKey: string;
}): Promise<Record<string, string>> {
  const { method, service, region, host, path, queryString, body, accessKeyId, secretAccessKey } = params;
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256(body);
  
  const headers: Record<string, string> = { 'host': host, 'x-amz-date': amzDate, 'x-amz-content-sha256': payloadHash };
  const headerNames = Object.keys(headers).sort();
  const canonicalHeaders = headerNames.map(n => `${n}:${headers[n]}\n`).join('');
  const signedHeadersStr = headerNames.join(';');
  
  const canonicalRequest = [method, path, queryString, canonicalHeaders, signedHeadersStr, payloadHash].join('\n');
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = ['AWS4-HMAC-SHA256', amzDate, credentialScope, await sha256(canonicalRequest)].join('\n');
  
  const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, service);
  const signature = toHex(await crypto.subtle.sign('HMAC', 
    await crypto.subtle.importKey('raw', signingKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
    new TextEncoder().encode(stringToSign)));
  
  return { ...headers, 'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}` };
}

async function assumeRole(roleArn: string, sessionName: string, accessKeyId: string, secretAccessKey: string, region: string) {
  const host = `sts.${region}.amazonaws.com`;
  const qs = new URLSearchParams({ Action: 'AssumeRole', Version: '2011-06-15', RoleArn: roleArn, RoleSessionName: sessionName, DurationSeconds: '900' }).toString();
  const headers = await signAwsRequest({ method: 'GET', service: 'sts', region, host, path: '/', queryString: qs, body: '', accessKeyId, secretAccessKey });
  
  const res = await fetch(`https://${host}/?${qs}`, { method: 'GET', headers });
  const text = await res.text();
  
  if (!res.ok) {
    return { success: false, error: { code: text.match(/<Code>([^<]+)/)?.[1] || 'UnknownError', message: text.match(/<Message>([^<]+)/)?.[1] || 'Unknown error', requestId: text.match(/<RequestId>([^<]+)/)?.[1] }};
  }
  return { success: true, credentials: { accessKeyId: text.match(/<AccessKeyId>([^<]+)/)?.[1], secretAccessKey: text.match(/<SecretAccessKey>([^<]+)/)?.[1], sessionToken: text.match(/<SessionToken>([^<]+)/)?.[1] }};
}

function getRecommendation(code: string, msg: string): string {
  if (msg.includes('not authorized to perform: sts:AssumeRole')) return 'Adicione o ARN do sistema APOC na Trust Policy da role.';
  if (code === 'AccessDenied') return 'Verifique a Trust Policy da role AWS.';
  if (code === 'InvalidClientTokenId') return 'Credenciais AWS do sistema inválidas. Contate o admin.';
  return 'Verifique as configurações da role AWS.';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { integration_id } = await req.json();
    if (!integration_id) return new Response(JSON.stringify({ success: false, error: 'integration_id obrigatório', error_code: 'MISSING_ID', step: 'validation' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: integration, error: fetchErr } = await supabase.from('integrations').select('*').eq('id', integration_id).single();
    
    if (fetchErr || !integration) return new Response(JSON.stringify({ success: false, error: 'Integração não encontrada', error_code: 'NOT_FOUND', step: 'fetch' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const roleArn = integration.configuration?.role_arn;
    if (!roleArn) return new Response(JSON.stringify({ success: false, error: 'Role ARN não configurado', error_code: 'MISSING_ARN', step: 'config' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const AWS_KEY = Deno.env.get('AWS_ACCESS_KEY_ID'), AWS_SECRET = Deno.env.get('AWS_SECRET_ACCESS_KEY'), AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';
    if (!AWS_KEY || !AWS_SECRET) return new Response(JSON.stringify({ success: false, error: 'Credenciais AWS do sistema não configuradas', error_code: 'MISSING_CREDS', step: 'system_creds', recommendation: 'Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY nas secrets' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    console.log('[AWS-TEST] Assumindo role:', roleArn);
    const result = await assumeRole(roleArn, `apoc-${Date.now()}`, AWS_KEY, AWS_SECRET, AWS_REGION);

    if (!result.success) {
      await supabase.from('integrations').update({ status: 'error' }).eq('id', integration_id);
      return new Response(JSON.stringify({ success: false, error: result.error.message, error_code: result.error.code, step: 'assume_role', recommendation: getRecommendation(result.error.code, result.error.message), aws_request_id: result.error.requestId, role_arn: roleArn }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const accountId = roleArn.split(':')[4];
    await supabase.from('integrations').update({ status: 'active', last_sync_at: new Date().toISOString() }).eq('id', integration_id);
    
    console.log('[AWS-TEST] Sucesso! Account:', accountId);
    return new Response(JSON.stringify({ success: true, message: 'Conexão AWS validada!', accountId, role_name: roleArn.split('/').pop() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (e: any) {
    console.error('[AWS-TEST] Erro:', e);
    return new Response(JSON.stringify({ success: false, error: e.message, error_code: 'INTERNAL_ERROR', step: 'server' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
