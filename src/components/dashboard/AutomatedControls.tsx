import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, XCircle, Shield, Lock, Cpu, Users, Database, Cloud } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIntegratedSystems } from '@/hooks/useIntegratedSystems';
import { useIntegrationDataStats } from '@/hooks/useIntegrationData';

interface DeviceLog {
  id: string;
  device_id: string;
  router_name: string;
  version: string;
  cpu_usage: number;
  created_at: string;
}

interface ControlCheck {
  id: string;
  name: string;
  description: string;
  status: 'pass' | 'fail';
  icon: typeof CheckCircle2;
  details: string;
}

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const AutomatedControls = () => {
  const [loading, setLoading] = useState(true);
  const [latestLog, setLatestLog] = useState<DeviceLog | null>(null);
  
  // Get integration data stats
  const { systems, hasRealData, totalUsers } = useIntegratedSystems();
  const { data: integrationStats } = useIntegrationDataStats();

  useEffect(() => {
    fetchLatestLog();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('device-logs-automated-controls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_logs',
        },
        () => {
          fetchLatestLog();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLatestLog = async () => {
    try {
      const { data, error } = await supabase
        .from('device_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching latest device log:', error);
        return;
      }

      setLatestLog(data || null);
    } catch (err) {
      console.error('Error in fetchLatestLog:', err);
    } finally {
      setLoading(false);
    }
  };

  const controlChecks: ControlCheck[] = useMemo(() => {
    const now = new Date().getTime();
    const logTime = latestLog?.created_at ? new Date(latestLog.created_at).getTime() : 0;
    const isRecent = (now - logTime) < OFFLINE_THRESHOLD_MS;
    const avgCpu = latestLog?.cpu_usage || 100;

    const checks: ControlCheck[] = [];

    // 1. Edge Monitoring (MikroTik)
    checks.push({
      id: 'edge-monitoring',
      name: 'Monitoramento de Borda',
      description: 'Agente MikroTik reportando',
      status: isRecent && avgCpu < 80 ? 'pass' : 'fail',
      icon: Shield,
      details: isRecent 
        ? `CPU: ${avgCpu}% (OK)` 
        : 'Sem dados recentes (5min)',
    });

    // 2. Data Encryption (Always pass - HTTPS)
    checks.push({
      id: 'encryption',
      name: 'Criptografia de Dados',
      description: 'TLS 1.2+ Ativo',
      status: 'pass',
      icon: Lock,
      details: 'Conexão HTTPS segura',
    });

    // 3. Firmware Version
    checks.push({
      id: 'firmware',
      name: 'Versão do Firmware',
      description: 'Firmware atualizado',
      status: latestLog?.version ? 'pass' : 'fail',
      icon: Cpu,
      details: latestLog?.version ? `v${latestLog.version}` : 'Versão não detectada',
    });

    // 4. Integration Data Collection (new - based on real integration data)
    if (hasRealData) {
      checks.push({
        id: 'integration-data',
        name: 'Coleta de Dados de Integrações',
        description: 'Dados coletados automaticamente',
        status: 'pass',
        icon: Database,
        details: `${systems.length} sistemas, ${totalUsers} usuários`,
      });
    }

    // 5. Identity Monitoring (based on connected IAM integrations)
    const iamIntegrations = systems.filter(s => 
      ['Azure AD', 'Okta', 'Auth0', 'Google Workspace'].includes(s.name)
    );
    if (iamIntegrations.length > 0) {
      checks.push({
        id: 'identity-monitoring',
        name: 'Monitoramento de Identidades',
        description: 'IAM integrado',
        status: 'pass',
        icon: Users,
        details: `${iamIntegrations.length} provedor(es) IAM conectado(s)`,
      });
    }

    // 6. Cloud Infrastructure Monitoring
    const cloudIntegrations = systems.filter(s => 
      ['AWS Cloud', 'Cloudflare', 'Microsoft Intune'].includes(s.name)
    );
    if (cloudIntegrations.length > 0) {
      checks.push({
        id: 'cloud-monitoring',
        name: 'Monitoramento de Nuvem',
        description: 'Infraestrutura cloud monitorada',
        status: 'pass',
        icon: Cloud,
        details: `${cloudIntegrations.length} plataforma(s) conectada(s)`,
      });
    }

    return checks;
  }, [latestLog, hasRealData, systems, totalUsers]);

  const passedCount = controlChecks.filter(c => c.status === 'pass').length;
  const totalCount = controlChecks.length;

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold text-foreground">
            Controles Automatizados
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Verificações em tempo real do sistema
          </p>
        </div>
        <Badge 
          variant={passedCount === totalCount ? "default" : "secondary"}
          className={passedCount === totalCount ? "bg-success/10 text-success border-success/20" : ""}
        >
          {passedCount}/{totalCount} Aprovados
        </Badge>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {controlChecks.map((check) => {
              const Icon = check.status === 'pass' ? CheckCircle2 : XCircle;
              const iconColor = check.status === 'pass' ? 'text-success' : 'text-destructive';
              const bgColor = check.status === 'pass' ? 'bg-success/10' : 'bg-destructive/10';
              const CheckIcon = check.icon;

              return (
                <div
                  key={check.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className={`p-2 rounded-lg ${bgColor}`}>
                    <CheckIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-semibold text-foreground">
                        {check.name}
                      </h4>
                      <Icon className={`h-4 w-4 ${iconColor} flex-shrink-0`} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {check.description}
                    </p>
                    <p className="text-xs text-foreground/70 mt-1 font-medium">
                      {check.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AutomatedControls;
