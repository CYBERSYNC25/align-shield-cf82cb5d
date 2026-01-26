/**
 * Credential Access Logger
 * 
 * Centralized logging for all credential access operations.
 * CRITICAL: All credential decrypt/encrypt operations MUST be logged.
 * 
 * This creates an immutable audit trail for compliance (SOC2, ISO27001, LGPD).
 */

export type CredentialAction = 'decrypt' | 'encrypt' | 'refresh' | 'revoke' | 'test_connection';

export interface CredentialAccessLog {
  user_id: string;
  org_id?: string;
  integration_name: string;
  action: CredentialAction;
  function_name: string;
  key_version?: number;
  success: boolean;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log credential access to system_audit_logs
 * 
 * @param supabase - Supabase admin client (service role)
 * @param log - Credential access details
 */
export async function logCredentialAccess(
  supabase: any,
  log: CredentialAccessLog
): Promise<void> {
  try {
    const { error } = await supabase.from('system_audit_logs').insert({
      user_id: log.user_id,
      action_type: 'credential_access',
      action_category: 'security',
      resource_type: 'integration_credential',
      resource_id: log.integration_name,
      description: `${log.action} credential for ${log.integration_name}`,
      metadata: {
        action: log.action,
        function_name: log.function_name,
        key_version: log.key_version || 1,
        success: log.success,
        error: log.error_message || null,
        org_id: log.org_id || null,
        ...log.metadata,
      },
      ip_address: null, // Edge functions don't have direct access to client IP
    });

    if (error) {
      // Log error but don't throw - audit logging should not break operations
      console.error('[CredentialLogger] Failed to log access:', error);
    }
  } catch (err) {
    console.error('[CredentialLogger] Exception during logging:', err);
  }
}

/**
 * Create a logger bound to a specific function context
 */
export function createCredentialLogger(
  supabase: any,
  userId: string,
  functionName: string,
  orgId?: string
) {
  return {
    logDecrypt: async (integrationName: string, success: boolean, errorMessage?: string) => {
      await logCredentialAccess(supabase, {
        user_id: userId,
        org_id: orgId,
        integration_name: integrationName,
        action: 'decrypt',
        function_name: functionName,
        success,
        error_message: errorMessage,
      });
    },

    logEncrypt: async (integrationName: string, success: boolean, errorMessage?: string) => {
      await logCredentialAccess(supabase, {
        user_id: userId,
        org_id: orgId,
        integration_name: integrationName,
        action: 'encrypt',
        function_name: functionName,
        success,
        error_message: errorMessage,
      });
    },

    logRefresh: async (integrationName: string, success: boolean, errorMessage?: string) => {
      await logCredentialAccess(supabase, {
        user_id: userId,
        org_id: orgId,
        integration_name: integrationName,
        action: 'refresh',
        function_name: functionName,
        success,
        error_message: errorMessage,
      });
    },

    logRevoke: async (integrationName: string, success: boolean, errorMessage?: string) => {
      await logCredentialAccess(supabase, {
        user_id: userId,
        org_id: orgId,
        integration_name: integrationName,
        action: 'revoke',
        function_name: functionName,
        success,
        error_message: errorMessage,
      });
    },

    logTestConnection: async (integrationName: string, success: boolean, errorMessage?: string) => {
      await logCredentialAccess(supabase, {
        user_id: userId,
        org_id: orgId,
        integration_name: integrationName,
        action: 'test_connection',
        function_name: functionName,
        success,
        error_message: errorMessage,
      });
    },
  };
}
