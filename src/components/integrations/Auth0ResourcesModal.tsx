import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  AppWindow, 
  Key, 
  Zap,
  CheckCircle2,
  XCircle,
  Shield
} from 'lucide-react';
import { Auth0Evidence } from '@/hooks/useAuth0Sync';

interface Auth0ResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Auth0Evidence | null;
}

export function Auth0ResourcesModal({ open, onOpenChange, data }: Auth0ResourcesModalProps) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="https://cdn.auth0.com/website/assets/pages/press/img/auth0-logo-3D7CE7F9A0-logo.svg" 
              alt="Auth0" 
              className="h-6 w-auto"
            />
            Recursos Auth0 - {data.domain}
          </DialogTitle>
        </DialogHeader>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3 py-2">
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{data.users.total}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <AppWindow className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{data.applications.total}</p>
                <p className="text-xs text-muted-foreground">Apps</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{data.connections.total}</p>
                <p className="text-xs text-muted-foreground">Conexões</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <div>
                <p className="text-lg font-bold">{data.actions.total}</p>
                <p className="text-xs text-muted-foreground">Actions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="users" className="gap-1">
              <Users className="h-3 w-3" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-1">
              <AppWindow className="h-3 w-3" />
              Aplicações
            </TabsTrigger>
            <TabsTrigger value="connections" className="gap-1">
              <Key className="h-3 w-3" />
              Conexões
            </TabsTrigger>
            <TabsTrigger value="actions" className="gap-1">
              <Zap className="h-3 w-3" />
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Usuários ({data.users.total})</span>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                      {data.users.verified} verificados
                    </Badge>
                    {data.users.blocked > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {data.users.blocked} bloqueados
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Logins</TableHead>
                        <TableHead>Último Login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.list.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={user.picture} />
                                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{user.name || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {user.emailVerified ? (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-500" />
                                  Verificado
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Não verificado
                                </Badge>
                              )}
                              {user.blocked && (
                                <Badge variant="destructive" className="text-xs">Bloqueado</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{user.loginsCount || 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Aplicações ({data.applications.total})</span>
                  <Badge variant="outline" className="text-xs">
                    {data.applications.firstParty} first-party
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>First Party</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.applications.list.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell className="font-medium">{app.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {app.type || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {app.description || '-'}
                          </TableCell>
                          <TableCell>
                            {app.isFirstParty ? (
                              <Shield className="h-4 w-4 text-primary" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connections Tab */}
          <TabsContent value="connections" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">
                  Provedores de Autenticação ({data.connections.total})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Estratégia</TableHead>
                        <TableHead>Apps Habilitados</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.connections.list.map((conn) => (
                        <TableRow key={conn.id}>
                          <TableCell className="font-medium">{conn.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {conn.strategy}
                            </Badge>
                          </TableCell>
                          <TableCell>{conn.enabledClients}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="flex-1 overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Actions ({data.actions.total})</span>
                  <Badge variant="outline" className="text-xs">
                    {data.actions.deployed} deployed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px]">
                  {data.actions.list.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhuma action configurada
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Triggers</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Criado em</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.actions.list.map((action) => (
                          <TableRow key={action.id}>
                            <TableCell className="font-medium">{action.name}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {action.triggers.map((trigger) => (
                                  <Badge key={trigger} variant="secondary" className="text-xs">
                                    {trigger}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={action.status === 'built' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {action.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(action.createdAt).toLocaleDateString('pt-BR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
          Dados coletados em {new Date(data.timestamp).toLocaleString('pt-BR')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
