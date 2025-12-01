import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (error) {
      console.error('Azure OAuth error:', error, errorDescription);
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head><title>Erro na Autenticação</title></head>
        <body>
          <h1>Erro na Autenticação</h1>
          <p>${errorDescription || error}</p>
          <a href="/">Voltar</a>
        </body>
        </html>
        `,
        { headers: { 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    if (!code || !state) {
      throw new Error('Código ou state faltando na resposta OAuth');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find the pending OAuth request with this state
    const { data: pendingRequest, error: fetchError } = await supabaseClient
      .from('integration_webhooks')
      .select('*')
      .eq('integration_name', 'azure_ad')
      .eq('event_type', 'oauth_started')
      .eq('status', 'pending')
      .contains('payload', { state })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !pendingRequest) {
      throw new Error('Requisição OAuth não encontrada ou expirada');
    }

    const { tenant_id, client_id, client_secret, scopes, redirect_uri, user_id } = pendingRequest.payload;

    // Exchange code for tokens
    const tokenUrl = `https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`;
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id,
        client_secret,
        code,
        redirect_uri,
        grant_type: 'authorization_code',
        scope: scopes.join(' ')
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokenData = await tokenResponse.json();

    // Store tokens securely
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
    
    const { error: upsertError } = await supabaseClient
      .from('integration_oauth_tokens')
      .upsert({
        user_id,
        integration_name: 'azure_ad',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type,
        expires_at: expiresAt,
        scope: scopes.join(' '),
        metadata: {
          tenant_id,
          client_id,
          scopes
        }
      });

    if (upsertError) throw upsertError;

    // Update webhook status
    await supabaseClient
      .from('integration_webhooks')
      .update({
        status: 'success',
        processed_at: new Date().toISOString()
      })
      .eq('id', pendingRequest.id);

    // Log success
    await supabaseClient
      .from('integration_webhooks')
      .insert({
        integration_name: 'azure_ad',
        event_type: 'oauth_completed',
        status: 'success',
        payload: {
          user_id,
          scopes
        }
      });

    console.log('Azure OAuth completed successfully for user:', user_id);

    // Redirect to success page with query param to trigger toast
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autenticação Concluída</title>
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 100px auto; text-align: center; }
          .success { color: #22c55e; font-size: 48px; }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <h1>Autenticação Concluída!</h1>
        <p>Conectado ao Azure AD. Permissão de leitura de diretório confirmada.</p>
        <p>Você já pode fechar esta janela.</p>
        <script>
          setTimeout(() => {
            window.close();
            window.location.href = '/integrations-hub?azure_connected=true';
          }, 2000);
        </script>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' }, status: 200 }
    );
  } catch (error) {
    console.error('Error in azure-oauth-callback:', error);
    return new Response(
      `
      <!DOCTYPE html>
      <html>
      <head><title>Erro</title></head>
      <body>
        <h1>Erro ao processar autenticação</h1>
        <p>${error.message}</p>
        <a href="/integrations-hub">Voltar para Integrações</a>
      </body>
      </html>
      `,
      { headers: { 'Content-Type': 'text/html' }, status: 500 }
    );
  }
});
