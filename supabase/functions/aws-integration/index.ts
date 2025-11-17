/**
 * AWS Integration Edge Function
 * 
 * Esta função demonstra o uso correto de Supabase Secrets para integração com AWS.
 * 
 * SECRETS NECESSÁRIAS (configurar no Supabase Dashboard):
 * - AWS_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY
 * - AWS_REGION (opcional, default: us-east-1)
 * 
 * IMPORTANTE:
 * - NUNCA exponha credenciais no frontend
 * - Todas as chamadas AWS devem passar por esta edge function
 * - Sempre valide a existência das secrets antes de usar
 * - Logue erros mas NUNCA logue os valores das secrets
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { S3Client, ListBucketsCommand, GetBucketEncryptionCommand } from 'npm:@aws-sdk/client-s3';
import { IAMClient, ListUsersCommand } from 'npm:@aws-sdk/client-iam';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('AWS Integration: Starting request');

    // ✅ CORRETO: Buscar credenciais dos Supabase Secrets
    const accessKeyId = Deno.env.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const region = Deno.env.get('AWS_REGION') || 'us-east-1';

    // Validar que todas as credenciais obrigatórias existem
    if (!accessKeyId || !secretAccessKey) {
      console.error('AWS Integration: Missing required credentials');
      console.error('Required secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
      return new Response(
        JSON.stringify({ 
          error: 'AWS credentials not configured',
          message: 'Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to Supabase Secrets.',
          instructions: 'Go to Supabase Dashboard > Settings > Edge Functions > Secrets'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('AWS Integration: Credentials loaded successfully');
    console.log(`AWS Integration: Using region ${region}`);

    // Configurar cliente AWS de forma segura
    const awsConfig = {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    // Coletar evidências do S3
    console.log('AWS Integration: Collecting S3 evidence...');
    const s3Client = new S3Client(awsConfig);
    const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
    
    const bucketEvidences = await Promise.all(
      (bucketsResponse.Buckets || []).map(async (bucket) => {
        try {
          const encryption = await s3Client.send(
            new GetBucketEncryptionCommand({ Bucket: bucket.Name })
          );
          return {
            bucket: bucket.Name,
            encrypted: true,
            algorithm: encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
              ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm || 'Unknown',
            createdAt: bucket.CreationDate,
          };
        } catch (error) {
          // Bucket não tem criptografia configurada
          return {
            bucket: bucket.Name,
            encrypted: false,
            algorithm: 'None',
            createdAt: bucket.CreationDate,
          };
        }
      })
    );

    console.log(`AWS Integration: Found ${bucketEvidences.length} S3 buckets`);

    // Coletar evidências do IAM
    console.log('AWS Integration: Collecting IAM evidence...');
    const iamClient = new IAMClient(awsConfig);
    const usersResponse = await iamClient.send(new ListUsersCommand({}));

    console.log(`AWS Integration: Found ${usersResponse.Users?.length || 0} IAM users`);

    // Compilar evidências
    const evidence = {
      timestamp: new Date().toISOString(),
      region,
      s3: {
        totalBuckets: bucketEvidences.length,
        encryptedBuckets: bucketEvidences.filter(b => b.encrypted).length,
        unencryptedBuckets: bucketEvidences.filter(b => !b.encrypted).length,
        buckets: bucketEvidences,
      },
      iam: {
        totalUsers: usersResponse.Users?.length || 0,
        users: usersResponse.Users?.map(u => ({
          userName: u.UserName,
          userId: u.UserId,
          createdAt: u.CreateDate,
        })) || [],
      },
    };

    console.log('AWS Integration: Evidence collected successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: evidence 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('AWS Integration Error:', error);
    
    // Não exponha detalhes sensíveis no erro
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to AWS',
        message: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
