import { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Users, FolderClosed, Shield, CheckCircle2, XCircle, AlertCircle, Mail, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkspaceUser {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName?: string;
    familyName?: string;
  };
  isAdmin: boolean;
  suspended: boolean;
  orgUnitPath?: string;
  lastLoginTime?: string;
  creationTime?: string;
}

interface WorkspaceGroup {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
  adminCreated?: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  hd?: string;
}

interface GoogleWorkspaceData {
  timestamp: string;
  profile: UserProfile | null;
  users: {
    totalCount: number;
    items: WorkspaceUser[];
  };
  groups: {
    totalCount: number;
    items: WorkspaceGroup[];
  };
}

interface GoogleWorkspaceResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleWorkspaceResourcesModal({ open, onOpenChange }: GoogleWorkspaceResourcesModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<GoogleWorkspaceData | null>(null);
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

      // Fetch profile
      const profileResponse = await supabase.functions.invoke('google-workspace-sync', {
        body: { action: 'get_user_profile' },
      });

      let profile: UserProfile | null = null;
      if (profileResponse.data?.success) {
        profile = profileResponse.data.data.profile;
      }

      // Try to fetch users (may fail without Admin SDK permissions)
      let users: WorkspaceUser[] = [];
      let usersError: string | null = null;
      
      try {
        const usersResponse = await supabase.functions.invoke('google-workspace-sync', {
          body: { action: 'list_users', params: { maxResults: 100 } },
        });
        
        if (usersResponse.data?.success) {
          users = usersResponse.data.data.users || [];
        } else if (usersResponse.data?.code === 'FORBIDDEN') {
          usersError = 'Sem permissão para listar usuários (requer Admin SDK)';
        }
      } catch (err) {
        console.log('Users fetch error (expected without Admin SDK):', err);
        usersError = 'API Admin Directory não disponível';
      }

      // Try to fetch groups (may fail without Admin SDK permissions)
      let groups: WorkspaceGroup[] = [];
      let groupsError: string | null = null;
      
      try {
        const groupsResponse = await supabase.functions.invoke('google-workspace-sync', {
          body: { action: 'list_groups', params: { maxResults: 100 } },
        });
        
        if (groupsResponse.data?.success) {
          groups = groupsResponse.data.data.groups || [];
        } else if (groupsResponse.data?.code === 'FORBIDDEN') {
          groupsError = 'Sem permissão para listar grupos (requer Admin SDK)';
        }
      } catch (err) {
        console.log('Groups fetch error (expected without Admin SDK):', err);
        groupsError = 'API Admin Directory não disponível';
      }

      setData({
        timestamp: new Date().toISOString(),
        profile,
        users: {
          totalCount: users.length,
          items: users,
        },
        groups: {
          totalCount: groups.length,
          items: groups,
        },
      });

      const messages: string[] = [];
      if (profile) messages.push(`Perfil: ${profile.email}`);
      if (users.length > 0) messages.push(`${users.length} usuários`);
      if (groups.length > 0) messages.push(`${groups.length} grupos`);
      
      toast({
        title: 'Sincronização concluída',
        description: messages.length > 0 ? messages.join(', ') : 'Dados do perfil carregados',
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

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getAdminBadge = (isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Admin
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="text-xs">
        Usuário
      </Badge>
    );
  };

  const getStatusBadge = (suspended: boolean) => {
    if (suspended) {
      return (
        <Badge variant="destructive" className="text-xs">
          <XCircle className="h-3 w-3 mr-1" />
          Suspenso
        </Badge>
      );
    }
    return (
      <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Ativo
      </Badge>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <SheetTitle>Recursos Google Workspace</SheetTitle>
              <SheetDescription>
                {data?.profile?.hd ? `Domínio: ${data.profile.hd}` : 'Google Workspace'}
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
                  Verifique se a integração Google está conectada corretamente.
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
                        <Mail className="h-3.5 w-3.5" />
                        Conta
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-sm font-medium truncate">
                        {data.profile?.email || 'N/A'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        Usuários
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.users.totalCount}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2 pt-3 px-3">
                      <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <FolderClosed className="h-3.5 w-3.5" />
                        Grupos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="text-2xl font-bold">{data.groups.totalCount}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Card */}
                {data.profile && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Perfil Conectado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        {data.profile.picture && (
                          <img 
                            src={data.profile.picture} 
                            alt={data.profile.name}
                            className="w-12 h-12 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{data.profile.name}</p>
                          <p className="text-sm text-muted-foreground">{data.profile.email}</p>
                          {data.profile.hd && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {data.profile.hd}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Users Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Usuários do Workspace ({data.users.totalCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.users.items.length === 0 ? (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum usuário encontrado
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          A listagem de usuários requer permissões de Admin Directory
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.users.items.slice(0, 20).map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.name?.fullName || user.primaryEmail.split('@')[0]}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {user.primaryEmail}
                              </TableCell>
                              <TableCell>{getAdminBadge(user.isAdmin)}</TableCell>
                              <TableCell>{getStatusBadge(user.suspended)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Groups Table */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FolderClosed className="h-4 w-4" />
                      Grupos ({data.groups.totalCount})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.groups.items.length === 0 ? (
                      <div className="text-center py-4">
                        <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Nenhum grupo encontrado
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          A listagem de grupos requer permissões de Admin Directory
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Membros</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.groups.items.slice(0, 20).map((group) => (
                            <TableRow key={group.id}>
                              <TableCell className="font-medium">{group.name}</TableCell>
                              <TableCell className="text-muted-foreground text-sm font-mono">
                                {group.email}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {group.directMembersCount}
                                </Badge>
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
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Sincronize seus recursos</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Clique em "Sincronizar Agora" para buscar usuários, grupos e informações do seu Google Workspace.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
