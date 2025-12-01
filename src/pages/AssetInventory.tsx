import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Server, CheckCircle, AlertTriangle, Layers, Router } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Asset {
  device_id: string;
  router_name: string;
  version: string;
  cpu_usage: number;
  created_at: string;
}

const OFFLINE_THRESHOLD_SECONDS = 90;
const MINIMUM_VERSION = "7.10.0";

const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
};

const isVersionOutdated = (version: string): boolean => {
  const versionNumber = version.replace(/[^0-9.]/g, '').split('.').slice(0, 3).join('.');
  return compareVersions(versionNumber, MINIMUM_VERSION) < 0;
};

const AssetInventory = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second for accurate status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAssets = async () => {
    try {
      // Get the most recent log for each distinct device_id
      const { data, error } = await supabase
        .from('device_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by device_id and keep only the most recent
      const latestAssets = data?.reduce((acc: Asset[], log) => {
        const existing = acc.find(a => a.device_id === log.device_id);
        if (!existing) {
          acc.push(log);
        }
        return acc;
      }, []) || [];

      setAssets(latestAssets);
    } catch (error) {
      console.error('Erro ao buscar ativos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();

    // Poll every 10 seconds
    const interval = setInterval(fetchAssets, 10000);

    // Subscribe to real-time inserts
    const channel = supabase
      .channel('asset-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_logs'
        },
        () => {
          fetchAssets();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const enrichedAssets = useMemo(() => {
    return assets.map(asset => {
      const logTimestamp = new Date(asset.created_at).getTime();
      const secondsSinceLastLog = (currentTime.getTime() - logTimestamp) / 1000;
      const isOnline = secondsSinceLastLog < OFFLINE_THRESHOLD_SECONDS;
      const isOutdated = isVersionOutdated(asset.version);

      return {
        ...asset,
        isOnline,
        isOutdated
      };
    });
  }, [assets, currentTime]);

  const stats = useMemo(() => {
    const total = enrichedAssets.length;
    const healthy = enrichedAssets.filter(a => a.isOnline && !a.isOutdated).length;
    const atRisk = enrichedAssets.filter(a => !a.isOnline || a.isOutdated).length;
    const versions = new Set(enrichedAssets.map(a => a.version)).size;

    return { total, healthy, atRisk, versions };
  }, [enrichedAssets]);

  const getCpuColor = (usage: number): string => {
    if (usage < 50) return 'bg-success';
    if (usage < 80) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">Inventário de Ativos</h1>
            <p className="text-muted-foreground">Visão consolidada de todos os dispositivos monitorados</p>
          </div>

          {/* Fleet Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ativos</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Dispositivos monitorados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos Saudáveis</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.healthy}</div>
                <p className="text-xs text-muted-foreground">Online e atualizados</p>
              </CardContent>
            </Card>

            <Card className={stats.atRisk > 0 ? 'border-warning/50 animate-pulse' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos com Risco</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.atRisk}</div>
                <p className="text-xs text-muted-foreground">Offline ou desatualizados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Versões de Firmware</CardTitle>
                <Layers className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">{stats.versions}</div>
                <p className="text-xs text-muted-foreground">Versões distintas</p>
              </CardContent>
            </Card>
          </div>

          {/* Devices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos Monitorados</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando ativos...</div>
              ) : enrichedAssets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum dispositivo encontrado. Configure um agente MikroTik para começar.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Nome do Host</TableHead>
                        <TableHead>Versão do Sistema</TableHead>
                        <TableHead>Carga Atual</TableHead>
                        <TableHead>Última Visto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enrichedAssets.map((asset) => (
                        <TableRow key={asset.device_id}>
                          <TableCell>
                            <Badge 
                              className={asset.isOnline 
                                ? 'bg-success/10 text-success border-success/20 animate-pulse' 
                                : 'bg-danger/10 text-danger border-danger/20'
                              }
                            >
                              {asset.isOnline ? '🟢 Online' : '🔴 Offline'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Router className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{asset.router_name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{asset.version}</span>
                              {asset.isOutdated && (
                                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                  ⚠️ Desatualizado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {asset.isOnline ? (
                              <div className="flex items-center gap-2">
                                <Progress 
                                  value={asset.cpu_usage} 
                                  className={`w-24 h-2 ${getCpuColor(asset.cpu_usage)}`}
                                />
                                <span className="text-sm font-medium">{asset.cpu_usage}%</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(asset.created_at), { 
                              addSuffix: true,
                              locale: ptBR 
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default AssetInventory;

