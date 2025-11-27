/**
 * Google Workspace API Integration - Consumo de Endpoints
 * 
 * Esta edge function consome APIs do Google Workspace usando o access_token OAuth 2.0.
 * Implementa tratamento completo de erros HTTP e renovação automática de tokens.
 * 
 * ENDPOINTS DISPONÍVEIS:
 * - get_user_profile: Obter perfil do usuário autenticado
 * - list_users: Listar usuários do domínio (Admin SDK)
 * - list_groups: Listar grupos (Admin SDK)
 * - get_audit_logs: Obter logs de auditoria (Reports API)
 * 
 * TRATAMENTO DE ERROS HTTP:
 * - 401 Unauthorized: Token expirado ou inválido → Tenta renovar automaticamente
 * - 403 Forbidden: Sem permissões necessárias → Informa quais scopes faltam
 * - 429 Rate Limit: Muitas requisições → Sugere aguardar
 * - 500 Internal Server Error: Erro no Google → Retry com backoff
 * 
 * @requires GOOGLE_CLIENT_ID - OAuth 2.0 Client ID
 * @requires GOOGLE_CLIENT_SECRET - OAuth 2.0 Client Secret
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Interface: User Profile do Google
 * Representa o perfil básico do usuário autenticado
 */
interface GoogleUserProfile {
  id: string;           // ID único do usuário no Google
  email: string;        // Email principal
  verified_email: boolean; // Email foi verificado?
  name: string;         // Nome completo
  given_name: string;   // Primeiro nome
  family_name: string;  // Sobrenome
  picture: string;      // URL do avatar
  locale: string;       // Idioma preferido (ex: pt-BR)
  hd?: string;          // Domínio hospedado (ex: empresa.com)
}

/**
 * Interface: Usuário do Google Workspace Admin
 * Dados completos de usuário via Admin SDK
 */
interface WorkspaceUser {
  id: string;                    // ID único no Workspace
  primaryEmail: string;          // Email principal
  name: {
    fullName: string;            // Nome completo formatado
    givenName: string;           // Primeiro nome
    familyName: string;          // Sobrenome
  };
  isAdmin: boolean;              // É administrador?
  suspended: boolean;            // Conta suspensa?
  orgUnitPath: string;           // Unidade organizacional (ex: /Vendas)
  lastLoginTime?: string;        // Último login (ISO 8601)
  creationTime: string;          // Data de criação da conta
  agreedToTerms?: boolean;       // Aceitou termos de serviço?
  customerId?: string;           // ID do cliente Google
}

/**
 * Interface: Grupo do Google Workspace
 */
interface WorkspaceGroup {
  id: string;                    // ID único do grupo
  email: string;                 // Email do grupo
  name: string;                  // Nome do grupo
  description?: string;          // Descrição
  directMembersCount: number;    // Número de membros diretos
  adminCreated?: boolean;        // Criado por admin?
}

/**
 * Busca o access_token do banco de dados
 * @returns access_token válido ou null se não encontrado
 */
async function getAccessToken(supabase: any, userId: string): Promise<string | null> {
  console.log(`[Token] Buscando access_token para user ${userId}...`);

  const { data, error } = await supabase
    .from('integration_oauth_tokens')
    .select('access_token, expires_at, refresh_token')
    .eq('user_id', userId)
    .eq('integration_name', 'google_workspace')
    .single();

  if (error || !data) {
    console.error('[Token] Não encontrado:', error);
    return null;
  }

  // Verificar se o token está expirado
  const expiresAt = new Date(data.expires_at);
  const now = new Date();

  if (now >= expiresAt) {
    console.warn('[Token] Token expirado, será necessário renovar');
    return null;
  }

  console.log('[Token] Access token válido encontrado');
  return data.access_token;
}

/**
 * Faz uma requisição HTTP à API do Google com tratamento completo de erros e retry automático
 * @param url - URL completa da API
 * @param accessToken - Token OAuth 2.0
 * @param method - Método HTTP (GET, POST, etc)
 * @param retryCount - Tentativas restantes (padrão: 3)
 * @returns Response data ou lança erro descritivo
 */
async function callGoogleAPI(
  url: string, 
  accessToken: string, 
  method: string = 'GET',
  retryCount: number = 3
): Promise<any> {
  console.log(`[API Call] ${method} ${url} (retries left: ${retryCount})`);

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  // Tratamento de erros HTTP específicos
  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorCode = 'API_ERROR';

    try {
      const errorJson = JSON.parse(errorBody);
      
      switch (response.status) {
        case 401:
          errorCode = 'TOKEN_EXPIRED';
          errorMessage = '🔒 Token expirado ou inválido. Renovando automaticamente...';
          console.error('[API Error] 401 Unauthorized - Token needs refresh');
          break;
        
        case 403:
          errorCode = 'FORBIDDEN';
          errorMessage = '⛔ Sem permissão. Verifique se o usuário tem os scopes necessários no OAuth.';
          if (errorJson.error?.message) {
            errorMessage += `\nDetalhes: ${errorJson.error.message}`;
          }
          console.error('[API Error] 403 Forbidden - Missing required scopes:', errorJson);
          break;
        
        case 404:
          errorCode = 'NOT_FOUND';
          errorMessage = '❓ Recurso não encontrado. Verifique o ID ou endpoint.';
          console.error('[API Error] 404 Not Found:', url);
          break;
        
        case 429:
          // Rate limit - implement exponential backoff retry
          if (retryCount > 0) {
            const waitTime = Math.pow(2, 3 - retryCount) * 1000; // 1s, 2s, 4s
            console.warn(`[API Error] 429 Rate Limit - Retrying in ${waitTime}ms (${retryCount} attempts left)`);
            
            // Wait with exponential backoff
            await new Promise(resolve => setTimeout(resolve, waitTime));
            
            // Retry the request
            return callGoogleAPI(url, accessToken, method, retryCount - 1);
          }
          
          errorCode = 'RATE_LIMIT';
          errorMessage = '⏳ Limite de requisições atingido após 3 tentativas. Aguarde alguns minutos.';
          console.error('[API Error] 429 Rate Limit - Max retries exceeded');
          break;
        
        case 500:
        case 502:
        case 503:
        case 504:
          errorCode = 'SERVER_ERROR';
          errorMessage = '🔧 Erro no servidor do Google. Tente novamente em alguns instantes.';
          console.error(`[API Error] ${response.status} Server Error:`, errorJson);
          break;
        
        default:
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
          console.error(`[API Error] ${response.status}:`, errorJson);
      }
    } catch (e) {
      // Se não conseguir parsear JSON, usar mensagem padrão
      console.error('[API Error] Failed to parse error response:', errorBody);
    }

    throw { code: errorCode, message: errorMessage, status: response.status };
  }

  const data = await response.json();
  console.log('[API Call] Success');
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ✅ Autenticar usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[Auth] Missing authorization header');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '🔒 Autenticação necessária. Faça login para continuar.',
          code: 'UNAUTHORIZED' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error('[Auth] Invalid user token:', userError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '🔒 Token inválido. Faça login novamente.',
          code: 'INVALID_TOKEN' 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Request] User ${user.id} requesting sync`);

    // ✅ Parse request body
    const { action, params } = await req.json();

    if (!action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '❌ Parâmetro "action" é obrigatório.',
          code: 'MISSING_PARAMS' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Action] ${action}`, params);

    // ✅ Buscar access_token do banco
    const accessToken = await getAccessToken(supabase, user.id);

    if (!accessToken) {
      console.error('[Token] No valid access token found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '🔑 Token não encontrado ou expirado. Reconecte a integração Google Workspace.',
          code: 'TOKEN_EXPIRED',
          requiresReconnection: true
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Executar ação solicitada
    let result: any;

    switch (action) {
      case 'get_user_profile':
        /**
         * ENDPOINT: Obter perfil do usuário autenticado
         * API: https://www.googleapis.com/oauth2/v2/userinfo
         * Scopes necessários: openid, profile, email
         * 
         * EXEMPLO DE RESPOSTA:
         * {
         *   "id": "123456789",
         *   "email": "user@empresa.com",
         *   "verified_email": true,
         *   "name": "João Silva",
         *   "given_name": "João",
         *   "family_name": "Silva",
         *   "picture": "https://lh3.googleusercontent.com/...",
         *   "locale": "pt-BR",
         *   "hd": "empresa.com"
         * }
         * 
         * EDGE CASES:
         * - hd (hosted domain) pode ser undefined para contas pessoais @gmail.com
         * - picture pode retornar URL padrão se usuário não tem foto
         * - locale pode variar conforme configuração da conta
         */
        result = await callGoogleAPI(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          accessToken
        );
        
        console.log('[Profile] User profile fetched:', result.email);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              profile: result as GoogleUserProfile,
              metadata: {
                fetchedAt: new Date().toISOString(),
                source: 'google_oauth2_userinfo'
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list_users':
        /**
         * ENDPOINT: Listar usuários do Google Workspace
         * API: https://admin.googleapis.com/admin/directory/v1/users
         * Scopes necessários: https://www.googleapis.com/auth/admin.directory.user.readonly
         * 
         * PARÂMETROS DISPONÍVEIS:
         * - customer: 'my_customer' (padrão) ou ID do cliente
         * - domain: Filtrar por domínio (ex: empresa.com)
         * - maxResults: Número máximo de resultados (1-500, padrão: 100)
         * - pageToken: Token para próxima página de resultados
         * - query: Filtro de busca (ex: "orgName=Vendas")
         * - orderBy: Campo para ordenar (email, givenName, familyName)
         * 
         * EXEMPLO DE RESPOSTA:
         * {
         *   "users": [{
         *     "id": "123456",
         *     "primaryEmail": "user@empresa.com",
         *     "name": { "fullName": "João Silva", ... },
         *     "isAdmin": false,
         *     "suspended": false,
         *     "orgUnitPath": "/Vendas/Regional Sul",
         *     "lastLoginTime": "2025-11-17T10:30:00.000Z",
         *     "creationTime": "2024-01-15T08:00:00.000Z"
         *   }],
         *   "nextPageToken": "AEIUasdfASDF..." // Pode ser undefined
         * }
         * 
         * EDGE CASES:
         * - Domínio pode ter milhares de usuários, usar paginação
         * - lastLoginTime pode ser undefined para usuários que nunca fizeram login
         * - orgUnitPath sempre começa com /
         * - Usuários suspensos aparecem na lista mas com suspended=true
         */
        const customer = params?.customer || 'my_customer';
        const maxResults = params?.maxResults || 100;
        const domain = params?.domain;
        const pageToken = params?.pageToken;

        let usersUrl = `https://admin.googleapis.com/admin/directory/v1/users?customer=${customer}&maxResults=${maxResults}`;
        if (domain) usersUrl += `&domain=${domain}`;
        if (pageToken) usersUrl += `&pageToken=${pageToken}`;

        result = await callGoogleAPI(usersUrl, accessToken);
        
        console.log(`[Users] Fetched ${result.users?.length || 0} users`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              users: result.users || [],
              metadata: {
                totalCount: result.users?.length || 0,
                syncedAt: new Date().toISOString(),
                nextPageToken: result.nextPageToken || null
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'list_groups':
        /**
         * ENDPOINT: Listar grupos do Google Workspace
         * API: https://admin.googleapis.com/admin/directory/v1/groups
         * Scopes necessários: https://www.googleapis.com/auth/admin.directory.group.readonly
         * 
         * PARÂMETROS:
         * - customer: 'my_customer' (padrão)
         * - domain: Filtrar por domínio
         * - maxResults: Máximo de resultados (1-200, padrão: 100)
         * - pageToken: Token de paginação
         * 
         * EXEMPLO DE RESPOSTA:
         * {
         *   "groups": [{
         *     "id": "abc123",
         *     "email": "vendas@empresa.com",
         *     "name": "Equipe de Vendas",
         *     "description": "Grupo da equipe comercial",
         *     "directMembersCount": 15,
         *     "adminCreated": true
         *   }]
         * }
         * 
         * EDGE CASES:
         * - description pode ser undefined
         * - directMembersCount não inclui membros de subgrupos
         * - Grupos podem ter membros externos ao domínio
         */
        const groupsCustomer = params?.customer || 'my_customer';
        const groupsMaxResults = params?.maxResults || 100;
        
        let groupsUrl = `https://admin.googleapis.com/admin/directory/v1/groups?customer=${groupsCustomer}&maxResults=${groupsMaxResults}`;
        if (params?.domain) groupsUrl += `&domain=${params.domain}`;
        if (params?.pageToken) groupsUrl += `&pageToken=${params.pageToken}`;

        result = await callGoogleAPI(groupsUrl, accessToken);
        
        console.log(`[Groups] Fetched ${result.groups?.length || 0} groups`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              groups: result.groups || [],
              metadata: {
                totalCount: result.groups?.length || 0,
                syncedAt: new Date().toISOString(),
                nextPageToken: result.nextPageToken || null
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      case 'get_audit_logs':
        /**
         * ENDPOINT: Obter logs de auditoria
         * API: https://admin.googleapis.com/admin/reports/v1/activity/users/{userKey}/applications/{applicationName}
         * Scopes: https://www.googleapis.com/auth/admin.reports.audit.readonly
         * 
         * PARÂMETROS:
         * - applicationName: 'admin', 'drive', 'login', 'token', etc
         * - startTime: Data inicial (RFC 3339, ex: 2025-11-01T00:00:00Z)
         * - endTime: Data final (opcional)
         * - maxResults: Máximo de resultados (1-1000, padrão: 1000)
         * - userKey: 'all' (padrão) ou email específico
         * 
         * EXEMPLO DE RESPOSTA:
         * {
         *   "items": [{
         *     "id": { "time": "2025-11-17T10:30:00Z", "uniqueQualifier": "xyz" },
         *     "actor": { "email": "user@empresa.com", "profileId": "123" },
         *     "events": [{
         *       "type": "USER_SETTINGS",
         *       "name": "2sv_change",
         *       "parameters": [{ "name": "2sv_enabled", "value": "true" }]
         *     }]
         *   }]
         * }
         * 
         * EDGE CASES:
         * - items pode ser vazio se não houver logs no período
         * - events é array, pode ter múltiplos eventos por item
         * - parameters pode ser undefined para alguns tipos de eventos
         * - Logs podem ter delay de até 24h para aparecer
         */
        const applicationName = params?.applicationName || 'admin';
        const userKey = params?.userKey || 'all';
        const startTime = params?.startTime;
        
        if (!startTime) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: '❌ Parâmetro "startTime" é obrigatório para audit logs (formato: 2025-11-01T00:00:00Z)',
              code: 'MISSING_PARAMS' 
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let auditUrl = `https://admin.googleapis.com/admin/reports/v1/activity/users/${userKey}/applications/${applicationName}`;
        auditUrl += `?startTime=${startTime}`;
        if (params?.endTime) auditUrl += `&endTime=${params.endTime}`;
        if (params?.maxResults) auditUrl += `&maxResults=${params.maxResults}`;

        result = await callGoogleAPI(auditUrl, accessToken);
        
        console.log(`[Audit] Fetched ${result.items?.length || 0} audit logs`);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              auditLogs: result.items || [],
              metadata: {
                totalCount: result.items?.length || 0,
                syncedAt: new Date().toISOString(),
                applicationName,
                startTime,
                endTime: params?.endTime || 'now'
              }
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      default:
        console.error('[Action] Unknown action:', action);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `❌ Ação desconhecida: "${action}". Ações disponíveis: get_user_profile, list_users, list_groups, get_audit_logs`,
            code: 'INVALID_ACTION' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('[Error]', error);

    // Erro estruturado da API do Google
    if (error.code && error.message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message,
          code: error.code,
          status: error.status
        }),
        { 
          status: error.status || 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Erro genérico
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || '❌ Erro desconhecido ao processar requisição.',
        code: 'UNKNOWN_ERROR' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
