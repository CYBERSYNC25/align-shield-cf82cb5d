import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Shield, 
  Cloud, 
  Users, 
  Laptop,
  Clock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DeviceLog {
  id: string;
  created_at: string;
  version: string;
}

interface OAuthToken {
  id: string;
  integration_name: string;
  updated_at: string;
}

interface Integration {
  id: string;
  provider: string;
  status: string;
  updated_at: string;
}

interface ComplianceControl {
  id: string;
  name: string;
  source: string;
  sourceIcon: typeof Shield;
  status: 'pass' | 'fail' | 'not-configured';
  lastCheck: Date;
  description: string;
}

const HEARTBEAT_THRESHOLD_SECONDS = 90;

const ComplianceHub = () => {
  const [loading, setLoading] = useState(true);
  const [deviceLog, setDeviceLog] = useState<DeviceLog | null>(null);
  const [oauthTokens, setOauthTokens] = useState<OAuthToken[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    fetchAllData();

    // Subscribe to real-time updates
    const deviceChannel = supabase
      .channel('compliance-device-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_logs' }, () => {
        fetchDeviceLog();
      })
      .subscribe();

    const tokenChannel = supabase
      .channel('compliance-oauth-tokens')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integration_oauth_tokens' }, () => {
        fetchOAuthTokens();
      })
      .subscribe();

    const integrationChannel = supabase
      .channel('compliance-integrations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'integrations' }, () => {
        fetchIntegrations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(tokenChannel);
      supabase.removeChannel(integrationChannel);
    };
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDeviceLog(),
      fetchOAuthTokens(),
      fetchIntegrations()
    ]);
    setLoading(false);
  };

  const fetchDeviceLog = async () => {
    const { data } = await supabase
      .from('device_logs')
      .select('id, created_at, version')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setDeviceLog(data);
  };

  const fetchOAuthTokens = async () => {
    const { data } = await supabase
      .from('integration_oauth_tokens')
      .select('id, integration_name, updated_at');

    setOauthTokens(data || []);
  };

  const fetchIntegrations = async () => {
    const { data } = await supabase
      .from('integrations')
      .select('id, provider, status, updated_at');

    setIntegrations(data || []);
  };

  const controls: ComplianceControl[] = useMemo(() => {
    const now = new Date();

    // Control 1: Network Availability (MikroTik)
    const deviceLogTime = deviceLog?.created_at ? new Date(deviceLog.created_at) : null;
    const secondsSinceLastLog = deviceLogTime 
      ? (now.getTime() - deviceLogTime.getTime()) / 1000 
      : Infinity;
    
    const networkControl: ComplianceControl = {
      id: 'network-availability',
      name: 'Disponibilidade de Rede',
      source: 'MikroTik Agent',
      sourceIcon: Shield,
      status: secondsSinceLastLog < HEARTBEAT_THRESHOLD_SECONDS ? 'pass' : 'fail',
      lastCheck: deviceLogTime || now,
      description: secondsSinceLastLog < HEARTBEAT_THRESHOLD_SECONDS 
        ? 'Agente reportando normalmente' 
        : 'Agente offline ou sem dados'
    };

    // Control 2: Identity Management (Google/Azure)
    const hasGoogleToken = oauthTokens.some(t => t.integration_name.toLowerCase().includes('google'));
    const hasAzureToken = oauthTokens.some(t => t.integration_name.toLowerCase().includes('azure'));
    const identityToken = oauthTokens.find(t => 
      t.integration_name.toLowerCase().includes('google') || 
      t.integration_name.toLowerCase().includes('azure')
    );
    
    const identityControl: ComplianceControl = {
      id: 'identity-management',
      name: 'Gestão de Identidade',
      source: hasGoogleToken ? 'Google Workspace' : hasAzureToken ? 'Azure AD' : 'Não Configurado',
      sourceIcon: Users,
      status: (hasGoogleToken || hasAzureToken) ? 'pass' : 'not-configured',
      lastCheck: identityToken?.updated_at ? new Date(identityToken.updated_at) : now,
      description: (hasGoogleToken || hasAzureToken) 
        ? 'Token OAuth válido e ativo' 
        : 'Nenhuma integração de identidade configurada'
    };

    // Control 3: Cloud Audit (AWS)
    const awsIntegration = integrations.find(i => i.provider.toLowerCase().includes('aws'));
    
    const cloudControl: ComplianceControl = {
      id: 'cloud-audit',
      name: 'Auditoria de Nuvem',
      source: 'AWS Cloud',
      sourceIcon: Cloud,
      status: awsIntegration ? 'pass' : 'not-configured',
      lastCheck: awsIntegration?.updated_at ? new Date(awsIntegration.updated_at) : now,
      description: awsIntegration 
        ? 'Role IAM configurada e ativa' 
        : 'AWS não configurado'
    };

    // Control 4: Endpoint Security (Firmware)
    const endpointControl: ComplianceControl = {
      id: 'endpoint-security',
      name: 'Segurança de Endpoints',
      source: 'Agente Local',
      sourceIcon: Laptop,
      status: deviceLog?.version ? 'pass' : 'fail',
      lastCheck: deviceLogTime || now,
      description: deviceLog?.version 
        ? `Firmware v${deviceLog.version} detectado` 
        : 'Versão do firmware não detectada'
    };

    return [networkControl, identityControl, cloudControl, endpointControl];
  }, [deviceLog, oauthTokens, integrations]);

  const securityScore = useMemo(() => {
    const passedControls = controls.filter(c => c.status === 'pass').length;
    return Math.round((passedControls / controls.length) * 100);
  }, [controls]);

  const getStatusBadge = (status: ComplianceControl['status']) => {
    switch (status) {
      case 'pass':
        return (
          <Badge className="bg-success/10 text-success border-success/20 gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Aprovado
          </Badge>
        );
      case 'fail':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1.5">
            <XCircle className="h-3.5 w-3.5" />
            Falha
          </Badge>
        );
      case 'not-configured':
        return (
          <Badge variant="outline" className="gap-1.5 text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            Não Configurado
          </Badge>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-success';
    if (score >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card className="h-full bg-surface-elevated border-card-border">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Status de Conformidade em Tempo Real
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Monitoramento contínuo de controles de segurança
              </p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${getScoreColor(securityScore)}`}>
                {securityScore}%
              </div>
              <p className="text-xs text-muted-foreground">Score de Segurança</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {controls.filter(c => c.status === 'pass').length} de {controls.length} controles aprovados
              </span>
              <span className={`font-semibold ${getScoreColor(securityScore)}`}>
                {securityScore >= 80 ? 'Excelente' : securityScore >= 50 ? 'Atenção Necessária' : 'Crítico'}
              </span>
            </div>
            <Progress 
              value={securityScore} 
              className={`h-3 ${getProgressColor(securityScore)}`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Controle
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Fonte
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                    Última Verificação
                  </th>
                </tr>
              </thead>
              <tbody>
                {controls.map((control, index) => {
                  const SourceIcon = control.sourceIcon;
                  return (
                    <tr 
                      key={control.id} 
                      className={`border-b border-border hover:bg-accent/5 transition-colors ${
                        index === controls.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {control.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {control.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <SourceIcon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm text-foreground">{control.source}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(control.status)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            {formatDistanceToNow(control.lastCheck, { 
                              addSuffix: true,
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComplianceHub;
