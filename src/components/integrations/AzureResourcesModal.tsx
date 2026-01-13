import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  UsersRound, 
  ShieldCheck, 
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AzureResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface AzureUser {
  id: string;
  displayName: string;
  userPrincipalName: string;
  mail: string | null;
  jobTitle: string | null;
  department: string | null;
  accountEnabled: boolean;
  userType: string;
  mfaEnabled: boolean;
}

interface AzureGroup {
  id: string;
  displayName: string;
  description: string | null;
  securityEnabled: boolean;
  mailEnabled: boolean;
  memberCount: number;
}

interface ConditionalAccessPolicy {
  id: string;
  displayName: string;
  state: string;
}

export function AzureResourcesModal({ open, onOpenChange }: AzureResourcesModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: resources, isLoading } = useQuery({
    queryKey: ['azure-resources'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('integration_collected_data')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_name', 'azure_ad');

      if (error) throw error;

      const users: AzureUser[] = [];
      const groups: AzureGroup[] = [];
      const policies: ConditionalAccessPolicy[] = [];

      data?.forEach(item => {
        const resourceData = item.resource_data as Record<string, any>;
        if (item.resource_type === 'user') {
          users.push(resourceData as unknown as AzureUser);
        } else if (item.resource_type === 'group') {
          groups.push(resourceData as unknown as AzureGroup);
        } else if (item.resource_type === 'conditional_access_policy') {
          policies.push(resourceData as unknown as ConditionalAccessPolicy);
        }
      });

      return { users, groups, policies };
    },
    enabled: open,
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('azure-sync-resources');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Sincronização concluída', {
        description: `${data.summary?.total || 0} recursos coletados do Azure AD`,
      });
      queryClient.invalidateQueries({ queryKey: ['azure-resources'] });
    },
    onError: (error: Error) => {
      toast.error('Erro na sincronização', {
        description: error.message,
      });
    },
  });

  const users = resources?.users || [];
  const groups = resources?.groups || [];
  const policies = resources?.policies || [];

  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userPrincipalName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const usersWithMfa = users.filter(u => u.mfaEnabled).length;
  const usersWithoutMfa = users.filter(u => !u.mfaEnabled && u.accountEnabled).length;
  const disabledUsers = users.filter(u => !u.accountEnabled).length;
  const guestUsers = users.filter(u => u.userType === 'Guest').length;
  const enabledPolicies = policies.filter(p => p.state === 'enabled' || p.state === 'enabledForReportingButNotEnforced').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0078D4]" />
            Recursos Azure AD / Microsoft Entra ID
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Usuários</span>
              </div>
              <p className="text-xl font-bold mt-1">{users.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">MFA Ativo</span>
              </div>
              <p className="text-xl font-bold mt-1">{usersWithMfa}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <UsersRound className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">Grupos</span>
              </div>
              <p className="text-xl font-bold mt-1">{groups.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">Políticas CA</span>
              </div>
              <p className="text-xl font-bold mt-1">{policies.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sync */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários ou grupos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            Sincronizar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Usuários
              <Badge variant="secondary" className="text-xs">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <UsersRound className="h-4 w-4" />
              Grupos
              <Badge variant="secondary" className="text-xs">{groups.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="policies" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Políticas CA
              <Badge variant="secondary" className="text-xs">{policies.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="flex-1 overflow-hidden mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <Users className="h-8 w-8 mb-2" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2 pr-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className="bg-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.displayName}</span>
                              {user.userType === 'Guest' && (
                                <Badge variant="secondary" className="text-xs">Guest</Badge>
                              )}
                              {!user.accountEnabled && (
                                <Badge variant="destructive" className="text-xs">Desativado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.userPrincipalName}</p>
                            {user.department && (
                              <p className="text-xs text-muted-foreground mt-1">{user.department}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {user.mfaEnabled ? (
                              <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                MFA
                              </Badge>
                            ) : user.accountEnabled ? (
                              <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Sem MFA
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* MFA Summary */}
            {users.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cobertura MFA:</span>
                  <span className="font-medium">
                    {users.filter(u => u.accountEnabled).length > 0
                      ? Math.round((usersWithMfa / users.filter(u => u.accountEnabled).length) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {usersWithMfa} com MFA
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                    {usersWithoutMfa} sem MFA
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {disabledUsers} desativados
                  </span>
                  {guestUsers > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-blue-500" />
                      {guestUsers} guests
                    </span>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="flex-1 overflow-hidden mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <UsersRound className="h-8 w-8 mb-2" />
                <p>Nenhum grupo encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-4">
                  {filteredGroups.map((group) => (
                    <Card key={group.id} className="bg-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{group.displayName}</span>
                              {group.securityEnabled && (
                                <Badge variant="secondary" className="text-xs">Security</Badge>
                              )}
                              {group.mailEnabled && (
                                <Badge variant="outline" className="text-xs">Mail</Badge>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {group.description}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {group.memberCount || 0} membros
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="policies" className="flex-1 overflow-hidden mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : policies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mb-2" />
                <p>Nenhuma política de acesso condicional</p>
                <p className="text-xs mt-1">Requer permissão Policy.Read.All</p>
              </div>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-2 pr-4">
                  {policies.map((policy) => (
                    <Card key={policy.id} className="bg-card">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{policy.displayName}</span>
                          <Badge 
                            variant={policy.state === 'enabled' ? 'default' : 'secondary'}
                            className={policy.state === 'enabled' ? 'bg-emerald-500' : ''}
                          >
                            {policy.state === 'enabled' ? 'Ativa' : 
                             policy.state === 'disabled' ? 'Desativada' : 
                             policy.state === 'enabledForReportingButNotEnforced' ? 'Report Only' : 
                             policy.state}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}

            {policies.length > 0 && (
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Políticas ativas:</span>
                  <span className="font-medium">{enabledPolicies} de {policies.length}</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
