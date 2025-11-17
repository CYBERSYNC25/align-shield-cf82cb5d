/**
 * Componente de teste para APIs do Google Workspace
 * 
 * Permite testar todos os endpoints disponíveis:
 * - Perfil do usuário autenticado
 * - Lista de usuários do domínio
 * - Lista de grupos
 * - Logs de auditoria
 * 
 * Exibe resultados formatados e tratamento de erros em tempo real.
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  User,
  Users,
  Shield,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useGoogleWorkspaceApi } from '@/hooks/useGoogleWorkspaceApi';

const GoogleApiTester = () => {
  const [results, setResults] = useState<any>(null);
  const [userParams, setUserParams] = useState({ maxResults: 10, domain: '' });
  const [groupParams, setGroupParams] = useState({ maxResults: 10 });
  const [auditParams, setAuditParams] = useState({
    applicationName: 'admin',
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T00:00:00Z',
    maxResults: 20
  });

  const { getUserProfile, listUsers, listGroups, getAuditLogs, loading, error } = useGoogleWorkspaceApi();

  const handleGetProfile = async () => {
    const profile = await getUserProfile();
    setResults({ type: 'profile', data: profile });
  };

  const handleListUsers = async () => {
    const result = await listUsers({
      maxResults: userParams.maxResults,
      domain: userParams.domain || undefined
    });
    setResults({ type: 'users', data: result });
  };

  const handleListGroups = async () => {
    const result = await listGroups({
      maxResults: groupParams.maxResults
    });
    setResults({ type: 'groups', data: result });
  };

  const handleGetAuditLogs = async () => {
    const result = await getAuditLogs(auditParams);
    setResults({ type: 'audit', data: result });
  };

  return (
    <div className="space-y-6">
      {/* Instruções de uso */}
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Como testar a integração</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>
            <strong>1. Certifique-se de estar conectado:</strong> Sua conta Google Workspace deve estar autorizada na aba "🔐 OAuth 2.0".
          </p>
          <p>
            <strong>2. Escolha um endpoint:</strong> Cada aba representa um tipo de consulta diferente.
          </p>
          <p>
            <strong>3. Configure parâmetros:</strong> Ajuste filtros como domínio, número de resultados, etc.
          </p>
          <p>
            <strong>4. Execute:</strong> Clique no botão para fazer a requisição e visualize os resultados.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            💡 <strong>Dica:</strong> Se receber erro de token expirado, a renovação será feita automaticamente. Aguarde alguns segundos e tente novamente.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>🧪 Testador de API Google Workspace</CardTitle>
          <CardDescription>
            Teste os endpoints disponíveis e visualize as respostas em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="groups">
                <Shield className="h-4 w-4 mr-2" />
                Grupos
              </TabsTrigger>
              <TabsTrigger value="audit">
                <FileText className="h-4 w-4 mr-2" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            {/* TAB: Perfil do Usuário */}
            <TabsContent value="profile" className="space-y-4">
              <Alert>
                <User className="h-4 w-4" />
                <AlertTitle>Endpoint: oauth2/v2/userinfo</AlertTitle>
                <AlertDescription>
                  Retorna o perfil do usuário que autorizou o OAuth (você).
                  <br />
                  <strong>Scopes:</strong> openid, profile, email
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleGetProfile} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando perfil...
                  </>
                ) : (
                  <>
                    <User className="mr-2 h-4 w-4" />
                    Obter Meu Perfil
                  </>
                )}
              </Button>
            </TabsContent>

            {/* TAB: Listar Usuários */}
            <TabsContent value="users" className="space-y-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertTitle>Endpoint: admin/directory/v1/users</AlertTitle>
                <AlertDescription>
                  Lista todos os usuários do Google Workspace.
                  <br />
                  <strong>Scope:</strong> admin.directory.user.readonly
                  <br />
                  <strong>Requer:</strong> Permissões de administrador
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxResults">Máximo de resultados (1-500)</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    min="1"
                    max="500"
                    value={userParams.maxResults}
                    onChange={(e) => setUserParams({ ...userParams, maxResults: parseInt(e.target.value) })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="domain">Filtrar por domínio (opcional)</Label>
                  <Input
                    id="domain"
                    type="text"
                    placeholder="empresa.com"
                    value={userParams.domain}
                    onChange={(e) => setUserParams({ ...userParams, domain: e.target.value })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleListUsers} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listando usuários...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Listar Usuários
                  </>
                )}
              </Button>
            </TabsContent>

            {/* TAB: Listar Grupos */}
            <TabsContent value="groups" className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Endpoint: admin/directory/v1/groups</AlertTitle>
                <AlertDescription>
                  Lista todos os grupos do Google Workspace.
                  <br />
                  <strong>Scope:</strong> admin.directory.group.readonly
                </AlertDescription>
              </Alert>

              <div className="grid gap-2">
                <Label htmlFor="groupMaxResults">Máximo de resultados (1-200)</Label>
                <Input
                  id="groupMaxResults"
                  type="number"
                  min="1"
                  max="200"
                  value={groupParams.maxResults}
                  onChange={(e) => setGroupParams({ ...groupParams, maxResults: parseInt(e.target.value) })}
                />
              </div>

              <Button 
                onClick={handleListGroups} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Listando grupos...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Listar Grupos
                  </>
                )}
              </Button>
            </TabsContent>

            {/* TAB: Audit Logs */}
            <TabsContent value="audit" className="space-y-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Endpoint: admin/reports/v1/activity</AlertTitle>
                <AlertDescription>
                  Busca eventos de auditoria do Google Workspace.
                  <br />
                  <strong>Scope:</strong> admin.reports.audit.readonly
                  <br />
                  <strong>Apps:</strong> admin, drive, login, token, calendar, meet
                </AlertDescription>
              </Alert>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="appName">Aplicação</Label>
                  <select
                    id="appName"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={auditParams.applicationName}
                    onChange={(e) => setAuditParams({ ...auditParams, applicationName: e.target.value })}
                  >
                    <option value="admin">Admin (alterações administrativas)</option>
                    <option value="login">Login (autenticações)</option>
                    <option value="drive">Drive (atividades de arquivos)</option>
                    <option value="token">Token (uso de OAuth)</option>
                  </select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="startTime">Data inicial</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={auditParams.startTime.slice(0, 16)}
                    onChange={(e) => setAuditParams({ 
                      ...auditParams, 
                      startTime: e.target.value + ':00Z' 
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Logs podem ter delay de até 24h
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="auditMaxResults">Máximo de resultados (1-1000)</Label>
                  <Input
                    id="auditMaxResults"
                    type="number"
                    min="1"
                    max="1000"
                    value={auditParams.maxResults}
                    onChange={(e) => setAuditParams({ ...auditParams, maxResults: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <Button 
                onClick={handleGetAuditLogs} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Buscando logs...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Obter Audit Logs
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resultados */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Resultado da API
            </CardTitle>
            <CardDescription>
              {results.type === 'profile' && 'Perfil do usuário autenticado'}
              {results.type === 'users' && `${results.data?.metadata?.totalCount || 0} usuários encontrados`}
              {results.type === 'groups' && `${results.data?.metadata?.totalCount || 0} grupos encontrados`}
              {results.type === 'audit' && `${results.data?.metadata?.totalCount || 0} logs de auditoria`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full rounded-md border p-4">
              <pre className="text-xs">
                {JSON.stringify(results.data, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Erro atual */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GoogleApiTester;
