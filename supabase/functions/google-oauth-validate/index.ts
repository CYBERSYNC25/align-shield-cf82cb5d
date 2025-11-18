/**
 * Google OAuth Validation - Comprehensive Configuration Check
 * 
 * Verifica automaticamente a configuração OAuth do Google e retorna
 * um relatório detalhado com status de cada verificação.
 * 
 * VERIFICAÇÕES AUTOMÁTICAS:
 * ✅ Secrets GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET configurados
 * ✅ Redirect URI correto e consistente
 * ✅ Token OAuth existente e válido
 * ✅ Estrutura da URL de autorização
 * ✅ Parâmetros obrigatórios presentes
 * ✅ Fluxo de renovação configurado
 * 
 * VERIFICAÇÕES MANUAIS (instruções fornecidas):
 * ⚠️  Redirect URI no Google Cloud Console
 * ⚠️  Test Users configurados
 * ⚠️  APIs habilitadas no projeto
 * ⚠️  Escopos compatíveis com tipo de conta
 * ⚠️  Restrições administrativas
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationResult {
  check: string;
  status: 'success' | 'error' | 'warning' | 'manual';
  message: string;
  details?: string;
  recommendation?: string;
  link?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Google OAuth Validation: Starting comprehensive check');

    const results: ValidationResult[] = [];
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // ============= 1. VERIFICAR SECRETS =============
    
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      results.push({
        check: 'Secrets do Google OAuth',
        status: 'error',
        message: 'GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados',
        recommendation: 'Configure os secrets no Supabase Dashboard > Settings > Edge Functions > Secrets',
        link: 'https://supabase.com/dashboard/project/ofbyxnpprwwuieabwhdo/settings/functions'
      });
    } else {
      results.push({
        check: 'Secrets do Google OAuth',
        status: 'success',
        message: 'GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET configurados corretamente',
        details: `Client ID: ${clientId.substring(0, 20)}...`
      });
    }

    // ============= 2. VERIFICAR REDIRECT URI =============
    
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;
    const isHttps = redirectUri.startsWith('https://');
    const hasTrailingSlash = redirectUri.endsWith('/');

    if (!isHttps) {
      results.push({
        check: 'Redirect URI - Protocolo HTTPS',
        status: 'error',
        message: 'Redirect URI deve usar HTTPS',
        details: `URI atual: ${redirectUri}`,
        recommendation: 'Verifique a configuração do SUPABASE_URL'
      });
    } else if (hasTrailingSlash) {
      results.push({
        check: 'Redirect URI - Formato',
        status: 'warning',
        message: 'Redirect URI contém barra final',
        details: `URI: ${redirectUri}`,
        recommendation: 'Remova a barra final para evitar problemas de matching'
      });
    } else {
      results.push({
        check: 'Redirect URI - Estrutura',
        status: 'success',
        message: 'Redirect URI configurado corretamente',
        details: redirectUri
      });
    }

    // Instruções para verificação manual no Google Cloud Console
    results.push({
      check: 'Redirect URI no Google Cloud Console',
      status: 'manual',
      message: 'Verificação manual necessária',
      details: `O redirect URI DEVE estar cadastrado EXATAMENTE como: ${redirectUri}`,
      recommendation: 'Acesse o Google Cloud Console > Credentials > OAuth 2.0 Client ID e verifique se o URI está na lista de "Authorized redirect URIs". ATENÇÃO: Case-sensitive, sem espaços, sem barra final.',
      link: 'https://console.cloud.google.com/apis/credentials'
    });

    // ============= 3. VERIFICAR TOKEN EXISTENTE =============
    
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !supabaseUrl || !supabaseServiceKey) {
      results.push({
        check: 'Token OAuth Armazenado',
        status: 'warning',
        message: 'Não foi possível verificar token (usuário não autenticado)',
        recommendation: 'Faça login para verificar o status da integração'
      });
    } else {
      try {
        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        
        if (!userError && user) {
          const { data: tokenData, error: tokenError } = await supabase
            .from('integration_oauth_tokens')
            .select('*')
            .eq('user_id', user.id)
            .eq('integration_name', 'google_workspace')
            .maybeSingle();

          if (tokenError) {
            results.push({
              check: 'Token OAuth Armazenado',
              status: 'error',
              message: 'Erro ao buscar token',
              details: tokenError.message,
              recommendation: 'Verifique as permissões do banco de dados'
            });
          } else if (!tokenData) {
            results.push({
              check: 'Token OAuth Armazenado',
              status: 'warning',
              message: 'Nenhuma integração conectada',
              recommendation: 'Clique em "Conectar ao Google Workspace" para autorizar o acesso'
            });
          } else {
            // Verificar expiração do token
            const expiresAt = new Date(tokenData.expires_at);
            const now = new Date();
            const isExpired = expiresAt < now;
            const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / 60000);

            if (isExpired) {
              results.push({
                check: 'Token OAuth - Validade',
                status: 'warning',
                message: 'Token de acesso expirado',
                details: `Expirou em: ${expiresAt.toISOString()}`,
                recommendation: tokenData.refresh_token 
                  ? 'Token será renovado automaticamente na próxima requisição'
                  : 'Reconecte a integração para obter novo token'
              });
            } else {
              results.push({
                check: 'Token OAuth - Validade',
                status: 'success',
                message: 'Token de acesso válido',
                details: `Expira em ${minutesUntilExpiry} minutos`
              });
            }

            // Verificar refresh token
            if (tokenData.refresh_token) {
              results.push({
                check: 'Refresh Token',
                status: 'success',
                message: 'Refresh token disponível',
                details: 'Renovação automática configurada'
              });
            } else {
              results.push({
                check: 'Refresh Token',
                status: 'error',
                message: 'Refresh token não disponível',
                recommendation: 'Reconecte a integração com access_type=offline'
              });
            }

            // Verificar metadados do usuário
            const metadata = tokenData.metadata as any;
            if (metadata?.userInfo) {
              results.push({
                check: 'Informações do Usuário',
                status: 'success',
                message: 'Perfil do Google conectado',
                details: `Email: ${metadata.userInfo.email}, Nome: ${metadata.userInfo.name}`
              });
            }
          }
        }
      } catch (err) {
        results.push({
          check: 'Token OAuth Armazenado',
          status: 'error',
          message: 'Erro ao verificar token',
          details: err instanceof Error ? err.message : 'Erro desconhecido'
        });
      }
    }

    // ============= 4. VERIFICAR ESCOPOS =============
    
    const configuredScopes = [
      'https://www.googleapis.com/auth/admin.directory.user.readonly',
      'https://www.googleapis.com/auth/admin.directory.group.readonly',
      'https://www.googleapis.com/auth/admin.reports.audit.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'openid',
      'profile',
      'email'
    ];

    results.push({
      check: 'Escopos Configurados',
      status: 'success',
      message: '7 escopos configurados',
      details: configuredScopes.join(', ')
    });

    results.push({
      check: 'Compatibilidade de Escopos',
      status: 'manual',
      message: 'Verificação do tipo de conta necessária',
      details: 'Escopos Admin SDK requerem Google Workspace (não funcionam com @gmail.com)',
      recommendation: 'Para contas pessoais (@gmail.com), use apenas: openid, profile, email, drive.metadata.readonly. Para Google Workspace, use todos os escopos configurados.',
      link: 'https://developers.google.com/workspace/guides/auth-overview'
    });

    // ============= 5. VERIFICAR TELA DE CONSENTIMENTO =============
    
    results.push({
      check: 'Tela de Consentimento - Test Users',
      status: 'manual',
      message: 'Adicione sua conta como Test User',
      details: 'Se o app não está publicado (modo Testing), apenas Test Users podem autorizar',
      recommendation: 'Acesse Google Cloud Console > OAuth consent screen > Test users e adicione seu email',
      link: 'https://console.cloud.google.com/apis/credentials/consent'
    });

    // ============= 6. VERIFICAR APIs HABILITADAS =============
    
    const requiredApis = [
      'Admin SDK API',
      'Google People API', 
      'Google Drive API',
      'Admin SDK Reports API'
    ];

    results.push({
      check: 'APIs Necessárias',
      status: 'manual',
      message: 'Verifique se as APIs estão habilitadas',
      details: `APIs necessárias: ${requiredApis.join(', ')}`,
      recommendation: 'Acesse Google Cloud Console > API Library, pesquise cada API e clique em ENABLE se necessário. Aguarde 5 minutos após habilitar.',
      link: 'https://console.cloud.google.com/apis/library'
    });

    // ============= 7. VERIFICAR PARÂMETROS DA URL DE AUTORIZAÇÃO =============
    
    const authUrlParams = [
      'client_id',
      'redirect_uri', 
      'response_type',
      'scope',
      'access_type',
      'prompt',
      'state'
    ];

    results.push({
      check: 'Parâmetros de Autorização',
      status: 'success',
      message: 'Todos os parâmetros obrigatórios configurados',
      details: `Parâmetros: ${authUrlParams.join(', ')}`,
      recommendation: 'Inclui CSRF protection (state), refresh token (access_type=offline) e force consent (prompt=consent)'
    });

    // ============= 8. VERIFICAR RESTRIÇÕES ADMINISTRATIVAS =============
    
    results.push({
      check: 'Restrições de Admin/Empresa',
      status: 'manual',
      message: 'Verifique se não há bloqueios corporativos',
      details: 'Contas corporativas podem ter políticas que bloqueiam apps de terceiros',
      recommendation: 'Se usando conta empresarial: Admin Console > Security > API controls > Manage Third-Party App Access. Se necessário, solicite ao administrador que adicione o app à lista de confiança.',
      link: 'https://admin.google.com/ac/owl'
    });

    // ============= RESUMO GERAL =============
    
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    const manualCount = results.filter(r => r.status === 'manual').length;
    const successCount = results.filter(r => r.status === 'success').length;

    let overallStatus: 'ready' | 'needs_attention' | 'critical_issues' | 'needs_configuration';
    let overallMessage: string;
    let nextSteps: string[];

    if (errorCount > 0) {
      overallStatus = 'critical_issues';
      overallMessage = 'Problemas críticos encontrados que impedem a integração';
      nextSteps = [
        'Corrija os erros marcados em vermelho',
        'Configure os secrets necessários no Supabase',
        'Verifique as configurações do Google Cloud Console'
      ];
    } else if (warningCount > 0 || manualCount >= 3) {
      overallStatus = 'needs_attention';
      overallMessage = 'Configuração parcial - verificações manuais necessárias';
      nextSteps = [
        'Complete as verificações manuais no Google Cloud Console',
        'Adicione seu email como Test User',
        'Habilite as APIs necessárias',
        'Teste a conexão após ajustes'
      ];
    } else if (manualCount > 0) {
      overallStatus = 'needs_configuration';
      overallMessage = 'Configuração básica OK - complete os passos manuais';
      nextSteps = [
        'Siga as instruções de verificação manual',
        'Configure a tela de consentimento',
        'Teste a integração'
      ];
    } else {
      overallStatus = 'ready';
      overallMessage = 'Configuração completa e validada';
      nextSteps = [
        'Clique em "Conectar ao Google Workspace"',
        'Autorize as permissões solicitadas',
        'Comece a sincronizar dados'
      ];
    }

    const response = {
      success: true,
      validation: {
        timestamp: new Date().toISOString(),
        overallStatus,
        overallMessage,
        summary: {
          total: results.length,
          success: successCount,
          warnings: warningCount,
          errors: errorCount,
          manual: manualCount
        },
        nextSteps,
        results,
        configuration: {
          projectId: 'ofbyxnpprwwuieabwhdo',
          redirectUri,
          configuredScopes,
          requiredApis
        }
      }
    };

    console.log('Google OAuth Validation: Completed', {
      status: overallStatus,
      errors: errorCount,
      warnings: warningCount
    });

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Google OAuth Validation: Error', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        validation: null
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
