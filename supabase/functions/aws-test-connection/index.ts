import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { STSClient, AssumeRoleCommand } from 'https://esm.sh/@aws-sdk/client-sts@3.682.0';
import { IAMClient, ListUsersCommand } from 'https://esm.sh/@aws-sdk/client-iam@3.682.0';

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
    const { integration_id } = await req.json();

    if (!integration_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'integration_id é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter token do usuário autenticado
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar integração no banco
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single();

    if (fetchError || !integration) {
      console.error('Erro ao buscar integração:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Integração não encontrada',
          step: 'fetch_integration'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar provider
    if (integration.provider !== 'AWS') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Esta função só funciona com integrações AWS',
          step: 'validate_provider'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair Role ARN da configuração
    const roleArn = integration.configuration?.role_arn;
    if (!roleArn) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Role ARN não encontrado na configuração',
          step: 'extract_role_arn'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Testando Role ARN:', roleArn);

    // Configurar credenciais AWS (você precisa ter credenciais base configuradas)
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');

    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais AWS base não configuradas no servidor',
          step: 'check_base_credentials',
          recommendation: 'Configure AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY nas secrets do Supabase'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente STS para assumir a role
    const stsClient = new STSClient({
      region: 'us-east-1',
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Assumir a role do cliente
    let assumedCredentials;
    try {
      const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: `compliance-sync-test-${Date.now()}`,
        DurationSeconds: 900, // 15 minutos
      });

      const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
      assumedCredentials = assumeRoleResponse.Credentials;

      if (!assumedCredentials) {
        throw new Error('Credenciais temporárias não foram retornadas');
      }

      console.log('Role assumida com sucesso');
    } catch (error: any) {
      console.error('Erro ao assumir role:', error);
      
      let errorMessage = error.message || 'Erro desconhecido';
      let recommendation = '';

      if (error.name === 'AccessDenied' || errorMessage.includes('AccessDenied')) {
        errorMessage = 'Acesso negado ao assumir a role';
        recommendation = 'Verifique se a role tem uma política de confiança (Trust Policy) que permite que sua conta AWS assuma essa role.';
      } else if (errorMessage.includes('InvalidClientTokenId')) {
        errorMessage = 'Credenciais AWS inválidas';
        recommendation = 'Verifique se as credenciais AWS_ACCESS_KEY_ID e AWS_SECRET_ACCESS_KEY estão corretas.';
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          step: 'assume_role',
          recommendation,
          details: error.toString()
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar credenciais temporárias para listar usuários IAM
    try {
      const iamClient = new IAMClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: assumedCredentials.AccessKeyId!,
          secretAccessKey: assumedCredentials.SecretAccessKey!,
          sessionToken: assumedCredentials.SessionToken!,
        },
      });

      const listUsersCommand = new ListUsersCommand({
        MaxItems: 10,
      });

      const listUsersResponse = await iamClient.send(listUsersCommand);
      const userCount = listUsersResponse.Users?.length || 0;

      console.log(`Listados ${userCount} usuários IAM com sucesso`);

      // Atualizar status da integração
      await supabase
        .from('integrations')
        .update({ 
          status: 'active',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', integration_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Conexão validada com sucesso! Acesso IAM confirmado.',
          user_count: userCount,
          test_summary: {
            role_assumed: true,
            iam_access: true,
            users_listed: userCount
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error: any) {
      console.error('Erro ao listar usuários IAM:', error);

      let errorMessage = error.message || 'Erro desconhecido';
      let recommendation = '';

      if (error.name === 'AccessDenied' || errorMessage.includes('AccessDenied')) {
        errorMessage = 'Permissão negada para listar usuários IAM';
        recommendation = 'Verifique se a role possui a permissão "iam:ListUsers" na política IAM.';
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage,
          step: 'list_users',
          recommendation,
          details: error.toString()
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Erro geral na função:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
