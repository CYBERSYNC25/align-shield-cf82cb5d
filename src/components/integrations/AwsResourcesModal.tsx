import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Users, Database, Shield, CheckCircle2, XCircle, AlertCircle, Cloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AwsUser {
  userName: string;
  userId: string;
  createdAt: string;
  mfaEnabled: boolean | null;
}

interface AwsBucket {
  name: string;
  createdAt: string;
}

interface AwsTrail {
  name: string;
  isMultiRegion: boolean;
  s3BucketName: string;
}

interface AwsResourcesData {
  timestamp: string;
  accountId: string;
  iam: {
    totalUsers: number;
    users: AwsUser[];
  };
  s3: {
    totalBuckets: number;
    buckets: AwsBucket[];
  };
  cloudtrail: {
    enabled: boolean;
    totalTrails: number;
    trails: AwsTrail[];
  };
}

interface AwsResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationId: string;
  integrationName?: string;
}

export function AwsResourcesModal({ open, onOpenChange, integrationId, integrationName }: AwsResourcesModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AwsResourcesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const syncResources = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Não autenticado');
      }

      const response = await supabase.functions.invoke('aws-sync-resources', {
        body: { integration_id: integrationId },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erro ao sincronizar');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Falha na sincronização');
      }

      setData(response.data.data);
      toast({
        title: 'Sincronização concluída',
        description: `${response.data.data.iam.totalUsers} usuários e ${response.data.data.s3.totalBuckets} buckets encontrados.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      toast({
        title: 'Erro na sincronização',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getMfaBadge = (mfaEnabled: boolean | null) => {
    if (mfaEnabled === null) {
      return (
        <Badge variant="secondary" className="text-xs">
          <AlertCircle className="h-3 w-3 mr-1" />
          N/A
        </Badge>
      );
    }
    if (mfaEnabled) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="text-xs">
        <XCircle className="h-3 w-3 mr-1" />
        Inativo
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Cloud className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle>Recursos AWS</SheetTitle>
              <SheetDescription>
                {integrationName || 'AWS Cloud'} {data?.accountId && `• Account: ${data.accountId}`}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4 mt-4">
          {/* Sync Button */}
          <div className="flex items-center justify-between">
            <Button onClick={syncResources} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
            {data && (
              <span className="text-xs text-muted-foreground">
                Última sync: {formatDate(data.timestamp)}
              </span>
            )}
          </div>

          {/* Error State */}
          {error && !loading && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="pt-4">
                <p className="text-sm text-destructive">{error}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Verifique se a Role AWS tem as permissões necessárias: iam:ListUsers, s3:ListAllMyBuckets, cloudtrail:DescribeTrails
                </p>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && !data && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          )}

          {/* Data Display */}
          {data && (
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Usuários IAM
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.iam.totalUsers}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        Buckets S3
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.s3.totalBuckets}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5" />
                        CloudTrail
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      {data.cloudtrail.enabled ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* IAM Users Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Usuários IAM ({data.iam.totalUsers})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.iam.users.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum usuário encontrado
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Criado em</TableHead>
                            <TableHead>MFA</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.iam.users.map((user) => (
                            <TableRow key={user.userId}>
                              <TableCell className="font-medium">{user.userName}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(user.createdAt)}
                              </TableCell>
                              <TableCell>{getMfaBadge(user.mfaEnabled)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* S3 Buckets Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Buckets S3 ({data.s3.totalBuckets})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.s3.buckets.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum bucket encontrado
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome do Bucket</TableHead>
                            <TableHead>Criado em</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.s3.buckets.map((bucket) => (
                            <TableRow key={bucket.name}>
                              <TableCell className="font-medium font-mono text-sm">
                                {bucket.name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDate(bucket.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* CloudTrail Section */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      CloudTrail ({data.cloudtrail.totalTrails} {data.cloudtrail.totalTrails === 1 ? 'trail' : 'trails'})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.cloudtrail.trails.length === 0 ? (
                      <div className="text-center py-4">
                        <XCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                        <p className="text-sm text-muted-foreground">
                          CloudTrail não está configurado
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recomendamos habilitar o CloudTrail para auditoria de ações na AWS
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Multi-região</TableHead>
                            <TableHead>Bucket S3</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.cloudtrail.trails.map((trail) => (
                            <TableRow key={trail.name}>
                              <TableCell className="font-medium">{trail.name}</TableCell>
                              <TableCell>
                                {trail.isMultiRegion ? (
                                  <Badge variant="secondary" className="text-xs">Sim</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">Não</Badge>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {trail.s3BucketName}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}

          {/* Empty State */}
          {!loading && !data && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Sincronize seus recursos</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Clique em "Sincronizar Agora" para buscar os usuários IAM, buckets S3 e status do CloudTrail da sua conta AWS.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
