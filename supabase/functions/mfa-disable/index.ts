/**
 * MFA Disable - Disable MFA for user
 * 
 * POST /mfa-disable
 * Body: { code: string }
 * 
 * Requires current TOTP or backup code to disable
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decryptToken } from "../_shared/crypto-utils.ts";
import { verifyTotp, verifyBackupCode } from "../_shared/totp-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DisableRequest {
  code: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("TOKEN_ENCRYPTION_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: DisableRequest = await req.json();
    const { code } = body;

    if (!code) {
      return new Response(
        JSON.stringify({ error: "Código é obrigatório" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get MFA settings
    const { data: mfaSettings, error: fetchError } = await adminClient
      .from('user_mfa_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError || !mfaSettings) {
      return new Response(
        JSON.stringify({ error: "MFA não configurado" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!mfaSettings.enabled_at) {
      return new Response(
        JSON.stringify({ error: "MFA não está habilitado" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt secret
    const secret = await decryptToken(mfaSettings.secret_encrypted, encryptionKey);

    // Check if it's a TOTP code or backup code
    const isBackupCode = code.length > 6 || code.includes('-');
    let verified = false;

    if (isBackupCode) {
      const backupCodes: string[] = JSON.parse(
        await decryptToken(mfaSettings.backup_codes_encrypted, encryptionKey)
      );
      verified = verifyBackupCode(code, backupCodes) >= 0;
    } else {
      verified = await verifyTotp(secret, code, 1);
    }

    if (!verified) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Código inválido. Digite seu código atual para desabilitar MFA." 
        }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete MFA settings (completely remove, not just disable)
    const { error: deleteError } = await adminClient
      .from('user_mfa_settings')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      console.error('Failed to delete MFA settings:', deleteError);
      return new Response(
        JSON.stringify({ error: "Falha ao desabilitar MFA" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`MFA disabled for user ${userId}`);

    // Log to audit
    await adminClient.from('audit_logs').insert({
      user_id: userId,
      action: 'mfa_disabled',
      resource_type: 'user_mfa_settings',
      resource_id: userId,
      new_data: { disabled_at: new Date().toISOString() }
    });

    return new Response(JSON.stringify({
      success: true,
      message: "MFA desabilitado com sucesso"
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: unknown) {
    console.error('MFA disable error:', error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
