/**
 * MFA Setup - Generate TOTP secret and QR code
 * 
 * POST /mfa-setup
 * 
 * Response:
 * - qrCodeUrl: URL for QR code image
 * - otpauthUrl: Manual entry URL
 * - backupCodes: 10 backup codes (shown only once!)
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encryptToken } from "../_shared/crypto-utils.ts";
import { 
  generateTotpSecret, 
  generateOtpAuthUrl, 
  generateQrCodeUrl,
  generateBackupCodes 
} from "../_shared/totp-utils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const userEmail = claimsData.claims.email as string;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has MFA enabled
    const { data: existingMfa } = await adminClient
      .from('user_mfa_settings')
      .select('enabled_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMfa?.enabled_at) {
      return new Response(
        JSON.stringify({ error: "MFA já está habilitado. Desabilite primeiro para reconfigurar." }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate new TOTP secret and backup codes
    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes(10);
    const otpauthUrl = generateOtpAuthUrl(secret, userEmail, 'APOC');
    const qrCodeUrl = generateQrCodeUrl(otpauthUrl);

    // Encrypt sensitive data before storing
    const secretEncrypted = await encryptToken(secret, encryptionKey);
    const backupCodesEncrypted = await encryptToken(JSON.stringify(backupCodes), encryptionKey);

    // Upsert MFA settings (pending verification - enabled_at is null)
    const { error: upsertError } = await adminClient
      .from('user_mfa_settings')
      .upsert({
        user_id: userId,
        secret_encrypted: secretEncrypted,
        backup_codes_encrypted: backupCodesEncrypted,
        backup_codes_used: 0,
        enabled_at: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Failed to save MFA settings:', upsertError);
      return new Response(
        JSON.stringify({ error: "Falha ao inicializar configuração MFA" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('MFA setup initiated for user:', userId);

    return new Response(JSON.stringify({
      success: true,
      qrCodeUrl,
      otpauthUrl,
      backupCodes,
      message: 'Escaneie o QR code com seu app autenticador e digite o código para verificar'
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (error: unknown) {
    console.error('MFA setup error:', error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
