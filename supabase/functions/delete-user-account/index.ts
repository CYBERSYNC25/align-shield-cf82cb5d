import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  password: string;
  reason?: string;
  cancel_deletion?: boolean;
}

const RETENTION_DAYS = 30;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: DeleteAccountRequest = await req.json();
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se é uma solicitação de cancelamento
    if (body.cancel_deletion) {
      console.log(`Cancelling deletion for user ${user.id}`);

      const { error: cancelError } = await adminClient
        .from('profiles')
        .update({
          deleted_at: null,
          deletion_scheduled_for: null,
          deletion_reason: null
        })
        .eq('user_id', user.id);

      if (cancelError) {
        console.error('Error cancelling deletion:', cancelError);
        throw new Error('Failed to cancel account deletion');
      }

      // Cancelar request de exclusão pendente
      await adminClient
        .from('data_export_requests')
        .update({ 
          status: 'cancelled',
          completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('request_type', 'delete')
        .eq('status', 'pending');

      // Registrar no audit log
      await adminClient.from('audit_logs').insert({
        user_id: user.id,
        action: 'account_deletion_cancelled',
        resource_type: 'account',
        details: { cancelled_at: new Date().toISOString() }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Exclusão de conta cancelada com sucesso.' 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validar senha
    if (!body.password) {
      return new Response(
        JSON.stringify({ error: "Password is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar senha fazendo login
    const { error: signInError } = await adminClient.auth.signInWithPassword({
      email: user.email!,
      password: body.password
    });

    if (signInError) {
      return new Response(
        JSON.stringify({ error: "Senha incorreta" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing account deletion for user ${user.id}`);

    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + RETENTION_DAYS);

    // Marcar profile para exclusão (soft delete)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_scheduled_for: deletionDate.toISOString(),
        deletion_reason: body.reason || 'Solicitação do usuário'
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error marking account for deletion:', updateError);
      throw new Error('Failed to process account deletion');
    }

    // Criar registro de exclusão
    const { error: requestError } = await adminClient
      .from('data_export_requests')
      .insert({
        user_id: user.id,
        request_type: 'delete',
        status: 'pending',
        metadata: {
          reason: body.reason,
          scheduled_for: deletionDate.toISOString(),
          retention_days: RETENTION_DAYS
        }
      });

    if (requestError) {
      console.error('Error creating deletion request:', requestError);
    }

    // Registrar no audit log
    await adminClient.from('audit_logs').insert({
      user_id: user.id,
      action: 'account_deletion_scheduled',
      resource_type: 'account',
      details: {
        scheduled_for: deletionDate.toISOString(),
        retention_days: RETENTION_DAYS,
        reason: body.reason
      }
    });

    // Revogar todas as sessões (exceto a atual para permitir visualização da confirmação)
    // O usuário será deslogado após a confirmação no frontend

    console.log(`Account deletion scheduled for user ${user.id} on ${deletionDate.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sua conta foi agendada para exclusão. Todos os dados serão permanentemente excluídos em ${RETENTION_DAYS} dias.`,
        deletion_scheduled_for: deletionDate.toISOString(),
        retention_days: RETENTION_DAYS,
        can_cancel_until: deletionDate.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in delete-user-account:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
