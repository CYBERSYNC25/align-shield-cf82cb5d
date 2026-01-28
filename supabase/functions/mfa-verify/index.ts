/**
 * MFA Verify - Verify TOTP code or backup code
 * 
 * POST /mfa-verify
 * Body: { code: string, action: 'setup' | 'login' | 'sensitive' }
 * 
 * Actions:
 * - 'setup': Complete MFA setup (first verification)
 * - 'login': Verify during login flow
 * - 'sensitive': Re-challenge for sensitive actions
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { decryptToken } from "../_shared/crypto-utils.ts";
import { encryptToken } from "../_shared/crypto-utils.ts";
import { verifyTotp, verifyBackupCode } from "../_shared/totp-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type MFAAction = 'setup' | 'login' | 'sensitive';

interface VerifyRequest {
  code: string;
  action: MFAAction;
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
    const body: VerifyRequest = await req.json();
    const { code, action } = body;

    if (!code || !action) {
      return new Response(
        JSON.stringify({ error: "Código e ação são obrigatórios" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate action
    if (!['setup', 'login', 'sensitive'].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Ação inválida" }), 
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
        JSON.stringify({ error: "MFA não configurado para este usuário" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For login/sensitive actions, MFA must be enabled
    if ((action === 'login' || action === 'sensitive') && !mfaSettings.enabled_at) {
      return new Response(
        JSON.stringify({ error: "MFA não está habilitado" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt secret
    const secret = await decryptToken(mfaSettings.secret_encrypted, encryptionKey);

    // Check if it's a TOTP code (6 digits) or backup code
    const isBackupCode = code.length > 6 || code.includes('-');
    let verified = false;
    let usedBackupCode = false;

    if (isBackupCode) {
      // Verify backup code
      const backupCodes: string[] = JSON.parse(
        await decryptToken(mfaSettings.backup_codes_encrypted, encryptionKey)
      );
      
      const codeIndex = verifyBackupCode(code, backupCodes);
      
      if (codeIndex >= 0) {
        verified = true;
        usedBackupCode = true;
        
        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        const updatedCodesEncrypted = await encryptToken(
          JSON.stringify(backupCodes), 
          encryptionKey
        );
        
        await adminClient
          .from('user_mfa_settings')
          .update({
            backup_codes_encrypted: updatedCodesEncrypted,
            backup_codes_used: mfaSettings.backup_codes_used + 1,
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
        
        console.log(`Backup code used for user ${userId}. Remaining: ${backupCodes.length}`);
      }
    } else {
      // Verify TOTP code
      verified = await verifyTotp(secret, code, 1);
      
      if (verified) {
        await adminClient
          .from('user_mfa_settings')
          .update({
            last_used_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    if (!verified) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Código inválido. Verifique e tente novamente." 
        }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If action is 'setup', enable MFA
    if (action === 'setup' && !mfaSettings.enabled_at) {
      await adminClient
        .from('user_mfa_settings')
        .update({
          enabled_at: new Date().toISOString(),
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      console.log(`MFA enabled for user ${userId}`);
    }

    // Get remaining backup codes count
    const backupCodes: string[] = JSON.parse(
      await decryptToken(mfaSettings.backup_codes_encrypted, encryptionKey)
    );
    const remainingCodes = usedBackupCode ? backupCodes.length - 1 : backupCodes.length;

    return new Response(JSON.stringify({
      success: true,
      verified: true,
      action,
      usedBackupCode,
      remainingBackupCodes: remainingCodes,
      message: action === 'setup' 
        ? "MFA ativado com sucesso!" 
        : "Verificação concluída com sucesso"
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: unknown) {
    console.error('MFA verify error:', error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
