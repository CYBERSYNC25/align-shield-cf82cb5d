/**
 * Cleanup PII Data - LGPD/GDPR Compliance
 * 
 * Runs on schedule (daily) to:
 * 1. Hard delete accounts scheduled for deletion (30 days passed)
 * 2. Anonymize inactive accounts (2 years)
 * 3. Clean up expired data exports
 * 4. Clean up old system logs
 * 5. Clean up expired OAuth tokens
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('cleanup-pii-data');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CleanupResult {
  deletedAccounts: number;
  anonymizedAccounts: number;
  expiredExports: number;
  cleanedLogs: number;
  expiredTokens: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const result: CleanupResult = {
    deletedAccounts: 0,
    anonymizedAccounts: 0,
    expiredExports: 0,
    cleanedLogs: 0,
    expiredTokens: 0,
    errors: []
  };

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    logger.info('Starting PII data cleanup job');

    // ============================================
    // 1. Hard delete accounts scheduled for deletion
    // ============================================
    try {
      const now = new Date().toISOString();
      
      const { data: toDelete, error: fetchError } = await supabase
        .from('profiles')
        .select('user_id, deletion_scheduled_for')
        .not('deletion_scheduled_for', 'is', null)
        .lte('deletion_scheduled_for', now);

      if (fetchError) {
        throw fetchError;
      }

      if (toDelete && toDelete.length > 0) {
        logger.info(`Found ${toDelete.length} accounts to permanently delete`);

        for (const profile of toDelete) {
          try {
            // Delete the user from auth.users (cascades to profiles and other related data)
            const { error: deleteError } = await supabase.auth.admin.deleteUser(
              profile.user_id
            );

            if (deleteError) {
              logger.error(`Failed to delete user ${profile.user_id}`, deleteError);
              result.errors.push(`Delete user ${profile.user_id}: ${deleteError.message}`);
            } else {
              result.deletedAccounts++;
              
              // Log PII access for compliance
              await supabase.from('pii_access_audit').insert({
                user_id: null, // System action
                org_id: null,
                action: 'hard_delete',
                resource_type: 'user_account',
                resource_id: profile.user_id,
                pii_fields: ['all'],
                access_reason: 'LGPD/GDPR scheduled deletion after 30-day retention period'
              });
            }
          } catch (err) {
            logger.error(`Error deleting user ${profile.user_id}`, err);
            result.errors.push(`Delete user ${profile.user_id}: ${String(err)}`);
          }
        }
      }
    } catch (err) {
      logger.error('Error in account deletion phase', err);
      result.errors.push(`Account deletion phase: ${String(err)}`);
    }

    // ============================================
    // 2. Anonymize inactive accounts (2 years)
    // ============================================
    try {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const { data: inactiveProfiles, error: inactiveError } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .lt('updated_at', twoYearsAgo.toISOString())
        .is('deleted_at', null)
        .neq('display_name', 'Usuário Anônimo');

      if (inactiveError) {
        throw inactiveError;
      }

      if (inactiveProfiles && inactiveProfiles.length > 0) {
        logger.info(`Found ${inactiveProfiles.length} inactive accounts to anonymize`);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: 'Usuário Anônimo',
            avatar_url: null,
            updated_at: new Date().toISOString()
          })
          .lt('updated_at', twoYearsAgo.toISOString())
          .is('deleted_at', null)
          .neq('display_name', 'Usuário Anônimo');

        if (updateError) {
          throw updateError;
        }

        result.anonymizedAccounts = inactiveProfiles.length;

        // Log PII access for compliance
        await supabase.from('pii_access_audit').insert({
          user_id: null,
          org_id: null,
          action: 'anonymize',
          resource_type: 'user_profile',
          resource_id: 'batch',
          pii_fields: ['display_name', 'avatar_url'],
          access_reason: 'LGPD/GDPR automatic anonymization after 2 years of inactivity',
          access_context: { count: inactiveProfiles.length }
        });
      }
    } catch (err) {
      logger.error('Error in anonymization phase', err);
      result.errors.push(`Anonymization phase: ${String(err)}`);
    }

    // ============================================
    // 3. Clean up expired data exports
    // ============================================
    try {
      // Delete expired export files from storage
      const { data: expiredExports, error: exportsError } = await supabase
        .from('data_export_requests')
        .select('id, file_url')
        .lt('expires_at', new Date().toISOString())
        .not('file_url', 'is', null);

      if (exportsError) {
        throw exportsError;
      }

      if (expiredExports && expiredExports.length > 0) {
        logger.info(`Found ${expiredExports.length} expired data exports to clean`);

        // Extract file paths and delete from storage
        const filePaths = expiredExports
          .map(e => {
            if (!e.file_url) return null;
            // Extract path from URL
            const match = e.file_url.match(/data-exports\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter((p): p is string => p !== null);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from('data-exports')
            .remove(filePaths);

          if (storageError) {
            logger.warn('Error deleting export files from storage', storageError);
          }
        }

        // Update the records to clear file_url
        await supabase
          .from('data_export_requests')
          .update({ file_url: null, status: 'expired' })
          .lt('expires_at', new Date().toISOString());

        result.expiredExports = expiredExports.length;
      }
    } catch (err) {
      logger.error('Error in export cleanup phase', err);
      result.errors.push(`Export cleanup phase: ${String(err)}`);
    }

    // ============================================
    // 4. Clean up old system logs (90 days by default)
    // ============================================
    try {
      const { data: cleanedCount, error: logsError } = await supabase
        .rpc('cleanup_old_system_logs', { p_days_to_keep: 90 });

      if (logsError) {
        throw logsError;
      }

      result.cleanedLogs = cleanedCount || 0;

      if (result.cleanedLogs > 0) {
        logger.info(`Cleaned ${result.cleanedLogs} old system logs`);
      }
    } catch (err) {
      logger.error('Error in logs cleanup phase', err);
      result.errors.push(`Logs cleanup phase: ${String(err)}`);
    }

    // ============================================
    // 5. Clean up expired OAuth tokens
    // ============================================
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: expiredTokens, error: tokensError } = await supabase
        .from('integration_oauth_tokens')
        .delete()
        .lt('expires_at', ninetyDaysAgo.toISOString())
        .select('id');

      if (tokensError) {
        throw tokensError;
      }

      result.expiredTokens = expiredTokens?.length || 0;

      if (result.expiredTokens > 0) {
        logger.info(`Deleted ${result.expiredTokens} expired OAuth tokens`);
      }
    } catch (err) {
      logger.error('Error in token cleanup phase', err);
      result.errors.push(`Token cleanup phase: ${String(err)}`);
    }

    // ============================================
    // 6. Clean up expired blocked IPs
    // ============================================
    try {
      const { data: cleanedIps } = await supabase.rpc('cleanup_expired_blocked_ips');
      
      if (cleanedIps && cleanedIps > 0) {
        logger.info(`Cleaned ${cleanedIps} expired blocked IPs`);
      }
    } catch (err) {
      logger.error('Error cleaning expired blocked IPs', err);
      result.errors.push(`Blocked IPs cleanup: ${String(err)}`);
    }

    // ============================================
    // 7. Clean up old suspicious activity logs
    // ============================================
    try {
      const { data: cleanedSuspicious } = await supabase.rpc('cleanup_old_suspicious_logs', { 
        p_days_to_keep: 30 
      });
      
      if (cleanedSuspicious && cleanedSuspicious > 0) {
        logger.info(`Cleaned ${cleanedSuspicious} old suspicious activity logs`);
      }
    } catch (err) {
      logger.error('Error cleaning suspicious logs', err);
      result.errors.push(`Suspicious logs cleanup: ${String(err)}`);
    }

    // ============================================
    // 8. Clean up old login attempts
    // ============================================
    try {
      const { data: cleanedAttempts } = await supabase.rpc('cleanup_old_login_attempts', { 
        p_days_to_keep: 30 
      });
      
      if (cleanedAttempts && cleanedAttempts > 0) {
        logger.info(`Cleaned ${cleanedAttempts} old login attempts`);
      }
    } catch (err) {
      logger.error('Error cleaning login attempts', err);
      result.errors.push(`Login attempts cleanup: ${String(err)}`);
    }

    // Log summary
    logger.info('PII data cleanup completed', {
      deletedAccounts: result.deletedAccounts,
      anonymizedAccounts: result.anonymizedAccounts,
      expiredExports: result.expiredExports,
      cleanedLogs: result.cleanedLogs,
      expiredTokens: result.expiredTokens,
      errorsCount: result.errors.length
    });

    return new Response(
      JSON.stringify({
        success: result.errors.length === 0,
        result,
        message: `Cleanup completed: ${result.deletedAccounts} accounts deleted, ${result.anonymizedAccounts} anonymized, ${result.expiredExports} exports cleaned`
      }),
      { 
        status: result.errors.length === 0 ? 200 : 207,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logger.error('Critical error in cleanup job', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Critical error in cleanup job',
        result 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
