import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { STSClient, AssumeRoleCommand } from 'https://esm.sh/@aws-sdk/client-sts@3.682.0';
import { IAMClient, ListUsersCommand } from 'https://esm.sh/@aws-sdk/client-iam@3.682.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Extrai informações detalhadas de erros da AWS SDK
 */
function extractAwsError(error: any): { code: string; message: string; requestId?: string } {
  // AWS SDK v3 error structure
  const code = error.name || error.Code || error.$metadata?.httpStatusCode?.toString() || 'UnknownError';
  const message = error.message || error.Message || 'Erro desconhecido da AWS';
  const requestId = error.$metadata?.requestId;
  
  return { code, message, requestId };
}

/**
 * Gera recomendação baseada no código de erro da AWS
 */
function getErrorRecommendation(errorCode: string, errorMessage: string): string {
  const recommendations: Record<string, string> = {
    'AccessDenied': 'Verifique se a role tem uma Trust Policy que permite que a conta AWS do sistema assuma essa role. A Trust Policy deve incluir o ARN do usuário IAM do sistema.',
    'AccessDeniedException': 'Verifique se a role tem uma Trust Policy que permite que a conta AWS do sistema assuma essa role.',
    'InvalidClientTokenId': 'As credenciais AWS do sistema (AWS_ACCESS_KEY_ID) são inválidas ou foram revogadas. Contate o administrador.',
    'SignatureDoesNotMatch': 'A chave secreta AWS (AWS_SECRET_ACCESS_KEY) está incorreta. Contate o administrador.',
    'MalformedPolicyDocument': 'A role possui uma política mal formada. Verifique a sintaxe JSON da Trust Policy.',
    'NoSuchEntity': 'A role especificada não existe. Verifique se o ARN está correto e se a role foi criada.',
    'ExpiredTokenException': 'O token de sessão expirou. Tente novamente.',
    'RegionDisabledException': 'A região AWS está desabilitada para esta conta.',
    'ValidationError': 'O ARN fornecido é inválido. Verifique o formato: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME',
  };

  // Check for partial matches in error message
  if (errorMessage.includes('is not authorized to perform: sts:AssumeRole')) {
    return 'O usuário IAM do sistema não tem permissão para assumir esta role. Verifique a Trust Policy da role e adicione o ARN do sistema como principal confiável.';
  }
  
  if (errorMessage.includes('Role does not exist')) {
    return 'A role especificada não existe na conta AWS de destino. Verifique se o ARN está correto.';
  }

  if (errorMessage.includes('not authorized to perform: iam:ListUsers')) {
    return 'A role não tem permissão para listar usuários IAM. Adicione a permissão "iam:ListUsers" na política da role.';
  }

  return recommendations[errorCode] || 'Verifique as configurações da role AWS e tente novamente.';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const { integration_id } = body;

    console.log('[AWS-TEST] Iniciando teste de conexão', { integration_id, timestamp: new Date().toISOString() });

    if (!integration_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'integration_id é obrigatório',
          error_code: 'MISSING_INTEGRATION_ID',
          step: 'validation'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar autorização
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Token de autorização não fornecido',
          error_code: 'UNAUTHORIZED',
          step: 'auth'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[AWS-TEST] Configuração Supabase ausente');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Configuração do servidor incompleta',
          error_code: 'SERVER_CONFIG_ERROR',
          step: 'server_config'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar integração no banco
    console.log('[AWS-TEST] Buscando integração:', integration_id);
    const { data: integration, error: fetchError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .single();

    if (fetchError || !integration) {
      console.error('[AWS-TEST] Integração não encontrada:', fetchError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Integração não encontrada no sistema',
          error_code: 'INTEGRATION_NOT_FOUND',
          step: 'fetch_integration',
          details: fetchError?.message
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar provider
    if (integration.provider !== 'AWS') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Provider inválido: ${integration.provider}. Esta função só funciona com integrações AWS.`,
          error_code: 'INVALID_PROVIDER',
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
          error: 'Role ARN não encontrado na configuração da integração',
          error_code: 'MISSING_ROLE_ARN',
          step: 'extract_role_arn'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar formato do ARN
    const arnPattern = /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/;
    if (!arnPattern.test(roleArn)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Formato de ARN inválido: ${roleArn}`,
          error_code: 'INVALID_ARN_FORMAT',
          step: 'validate_arn',
          recommendation: 'O ARN deve seguir o formato: arn:aws:iam::123456789012:role/NomeDaRole'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AWS-TEST] Role ARN válido:', roleArn);

    // Verificar credenciais AWS do sistema
    const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
    const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');
    const AWS_REGION = Deno.env.get('AWS_REGION') || 'us-east-1';

    if (!AWS_ACCESS_KEY_ID) {
      console.error('[AWS-TEST] AWS_ACCESS_KEY_ID não configurada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais AWS do sistema não configuradas (ACCESS_KEY_ID)',
          error_code: 'MISSING_AWS_ACCESS_KEY',
          step: 'check_system_credentials',
          recommendation: 'Configure AWS_ACCESS_KEY_ID nas secrets do Supabase Edge Functions'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!AWS_SECRET_ACCESS_KEY) {
      console.error('[AWS-TEST] AWS_SECRET_ACCESS_KEY não configurada');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Credenciais AWS do sistema não configuradas (SECRET_ACCESS_KEY)',
          error_code: 'MISSING_AWS_SECRET_KEY',
          step: 'check_system_credentials',
          recommendation: 'Configure AWS_SECRET_ACCESS_KEY nas secrets do Supabase Edge Functions'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[AWS-TEST] Credenciais do sistema verificadas. Região:', AWS_REGION);

    // Criar cliente STS para assumir a role
    const stsClient = new STSClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });

    // Gerar nome de sessão único
    const sessionName = `apoc-compliance-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Assumir a role do cliente
    let assumedCredentials;
    try {
      console.log('[AWS-TEST] Tentando assumir role com sessão:', sessionName);
      
      const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: sessionName,
        DurationSeconds: 900, // 15 minutos
      });

      const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
      assumedCredentials = assumeRoleResponse.Credentials;

      if (!assumedCredentials || !assumedCredentials.AccessKeyId) {
        throw new Error('AWS não retornou credenciais temporárias válidas');
      }

      console.log('[AWS-TEST] Role assumida com sucesso!');
      
    } catch (error: any) {
      const awsError = extractAwsError(error);
      console.error('[AWS-TEST] Erro ao assumir role:', {
        code: awsError.code,
        message: awsError.message,
        requestId: awsError.requestId,
        roleArn
      });

      const recommendation = getErrorRecommendation(awsError.code, awsError.message);

      // Atualizar status para erro
      await supabase
        .from('integrations')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', integration_id);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: awsError.message,
          error_code: awsError.code,
          step: 'assume_role',
          recommendation,
          aws_request_id: awsError.requestId,
          role_arn: roleArn,
          details: `Código AWS: ${awsError.code}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar credenciais temporárias para listar usuários IAM (teste de permissões)
    let userCount = 0;
    try {
      console.log('[AWS-TEST] Testando permissões IAM com credenciais temporárias...');
      
      const iamClient = new IAMClient({
        region: AWS_REGION,
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
      userCount = listUsersResponse.Users?.length || 0;

      console.log('[AWS-TEST] Listados', userCount, 'usuários IAM com sucesso');

    } catch (error: any) {
      const awsError = extractAwsError(error);
      console.error('[AWS-TEST] Erro ao listar usuários IAM:', {
        code: awsError.code,
        message: awsError.message
      });

      const recommendation = getErrorRecommendation(awsError.code, awsError.message);

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: awsError.message,
          error_code: awsError.code,
          step: 'iam_list_users',
          recommendation,
          aws_request_id: awsError.requestId,
          details: `A role foi assumida com sucesso, mas falhou ao testar permissões IAM. Código AWS: ${awsError.code}`
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair Account ID do ARN (formato: arn:aws:iam::123456789012:role/RoleName)
    const accountId = roleArn.split(':')[4];
    const roleName = roleArn.split('/').pop();

    // Atualizar status da integração para ativo
    const { error: updateError } = await supabase
      .from('integrations')
      .update({ 
        status: 'active',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', integration_id);

    if (updateError) {
      console.warn('[AWS-TEST] Aviso: não foi possível atualizar status:', updateError);
    }

    const duration = Date.now() - startTime;
    console.log('[AWS-TEST] Teste concluído com sucesso em', duration, 'ms');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Conexão AWS validada com sucesso!',
        accountId,
        role_name: roleName,
        user_count: userCount,
        region: AWS_REGION,
        test_duration_ms: duration,
        test_summary: {
          role_assumed: true,
          iam_access: true,
          users_listed: userCount,
          account_id: accountId,
          role_name: roleName
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[AWS-TEST] Erro geral na função:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Erro interno do servidor ao processar a requisição',
        error_code: 'INTERNAL_ERROR',
        step: 'server',
        details: error.message || error.toString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
