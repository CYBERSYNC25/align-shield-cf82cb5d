import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface IntegrationStatus {
  connected: boolean;
  lastSync: Date | null;
  metadata?: Record<string, any>;
}

interface IntegrationStatusResult {
  aws: IntegrationStatus & { accountId?: string; integrationId?: string };
  google: IntegrationStatus & { expiresAt?: Date };
  azure: IntegrationStatus & { expiresAt?: Date };
  mikrotik: IntegrationStatus & { deviceCount?: number };
  loading: boolean;
  refetch: () => void;
}

export function useIntegrationStatus(): IntegrationStatusResult {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [aws, setAws] = useState<IntegrationStatus & { accountId?: string; integrationId?: string }>({
    connected: false,
    lastSync: null,
  });
  const [google, setGoogle] = useState<IntegrationStatus & { expiresAt?: Date }>({
    connected: false,
    lastSync: null,
  });
  const [azure, setAzure] = useState<IntegrationStatus & { expiresAt?: Date }>({
    connected: false,
    lastSync: null,
  });
  const [mikrotik, setMikrotik] = useState<IntegrationStatus & { deviceCount?: number }>({
    connected: false,
    lastSync: null,
  });

  const fetchStatus = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Fetch AWS status - check integrations table
      const { data: awsData } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'AWS')
        .eq('status', 'active')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (awsData && awsData.length > 0) {
        const firstAws = awsData[0];
        const config = firstAws.configuration as Record<string, any> | null;
        setAws({
          connected: true,
          lastSync: firstAws.last_sync_at ? new Date(firstAws.last_sync_at) : new Date(firstAws.updated_at),
          accountId: config?.account_id || config?.accountId,
          integrationId: firstAws.id,
        });
      } else {
        setAws({ connected: false, lastSync: null });
      }

      // Fetch Google OAuth token
      const { data: googleToken } = await supabase
        .from('integration_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'google_workspace')
        .maybeSingle();

      if (googleToken) {
        setGoogle({
          connected: true,
          lastSync: new Date(googleToken.updated_at),
          expiresAt: new Date(googleToken.expires_at),
        });
      } else {
        setGoogle({ connected: false, lastSync: null });
      }

      // Fetch Azure OAuth token
      const { data: azureToken } = await supabase
        .from('integration_oauth_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'azure_ad')
        .maybeSingle();

      if (azureToken) {
        setAzure({
          connected: true,
          lastSync: new Date(azureToken.updated_at),
          expiresAt: new Date(azureToken.expires_at),
        });
      } else {
        setAzure({ connected: false, lastSync: null });
      }

      // Fetch MikroTik status - check device_logs from last 24 hours
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: mikrotikLogs, count } = await supabase
        .from('device_logs')
        .select('*', { count: 'exact' })
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (mikrotikLogs && mikrotikLogs.length > 0) {
        // Count unique devices
        const { data: deviceData } = await supabase
          .from('device_logs')
          .select('device_id')
          .gte('created_at', twentyFourHoursAgo.toISOString());
        
        const uniqueDevices = new Set(deviceData?.map(d => d.device_id)).size;

        setMikrotik({
          connected: true,
          lastSync: new Date(mikrotikLogs[0].created_at),
          deviceCount: uniqueDevices,
        });
      } else {
        setMikrotik({ connected: false, lastSync: null });
      }
    } catch (error) {
      console.error('Error fetching integration status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user?.id]);

  return {
    aws,
    google,
    azure,
    mikrotik,
    loading,
    refetch: fetchStatus,
  };
}
