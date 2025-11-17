/**
 * Integration Demo Component
 * 
 * Visual demonstration panel for testing integration APIs in real-time.
 * Shows how to consume REST endpoints and map responses to internal entities.
 * 
 * Features:
 * - Live API testing with Google Workspace
 * - Mock data demonstration
 * - Response visualization
 * - Error handling examples
 * - Mapping to internal entities
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGoogleWorkspaceSync } from '@/hooks/useGoogleWorkspaceSync';
import { 
  Users, 
  Shield, 
  FileText, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Database
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';

// Local type definitions for demo data
interface User {
  id: string;
  primaryEmail: string;
  name: {
    fullName: string;
    givenName: string;
    familyName: string;
  };
  isAdmin: boolean;
  suspended: boolean;
  orgUnitPath: string;
  lastLoginTime?: string;
  creationTime: string;
}

interface Group {
  id: string;
  email: string;
  name: string;
  description?: string;
  directMembersCount: number;
}

interface AuditLog {
  id: {
    time: string;
    uniqueQualifier: string;
  };
  actor: {
    email: string;
    profileId: string;
  };
  events: Array<{
    type: string;
    name: string;
    parameters?: Array<{
      name: string;
      value: string;
    }>;
  }>;
}

// Mock data for demonstration when real API is not available
const mockUsers = [
  {
    id: 'mock-1',
    primaryEmail: 'john.doe@example.com',
    name: { fullName: 'John Doe', givenName: 'John', familyName: 'Doe' },
    isAdmin: true,
    suspended: false,
    orgUnitPath: '/Engineering',
    creationTime: '2024-01-15T10:30:00Z',
  },
  {
    id: 'mock-2',
    primaryEmail: 'jane.smith@example.com',
    name: { fullName: 'Jane Smith', givenName: 'Jane', familyName: 'Smith' },
    isAdmin: false,
    suspended: false,
    orgUnitPath: '/Marketing',
    creationTime: '2024-01-20T14:20:00Z',
  },
];

const mockGroups: Group[] = [
  {
    id: 'mock-group-1',
    email: 'all-staff@example.com',
    name: 'All Staff',
    description: 'Everyone in the organization',
    directMembersCount: 125,
  },
  {
    id: 'mock-group-2',
    email: 'developers@example.com',
    name: 'Developers',
    description: 'Engineering team members',
    directMembersCount: 32,
  },
];

const mockAuditLogs: AuditLog[] = [
  {
    id: { time: '2024-11-17T10:00:00Z', uniqueQualifier: 'mock-log-1' },
    actor: { email: 'admin@example.com', profileId: 'admin-123' },
    events: [
      {
        type: 'USER_SETTINGS',
        name: 'CHANGE_PASSWORD',
        parameters: [{ name: 'USER_EMAIL', value: 'john.doe@example.com' }],
      },
    ],
  },
];

const IntegrationDemo = () => {
  const { syncUsers, syncGroups, syncAuditLogs, loading, error } = useGoogleWorkspaceSync();
  const [useMockData, setUseMockData] = useState(true);
  const [users, setUsers] = useState(mockUsers);
  const [groups, setGroups] = useState(mockGroups);
  const [auditLogs, setAuditLogs] = useState(mockAuditLogs);

  const handleSyncUsers = async () => {
    if (useMockData) {
      setUsers(mockUsers);
      return;
    }

    const result = await syncUsers({ maxResults: 10 });
    if (result) {
      setUsers(result.data);
    }
  };

  const handleSyncGroups = async () => {
    if (useMockData) {
      setGroups(mockGroups);
      return;
    }

    const result = await syncGroups({ maxResults: 10 });
    if (result) {
      setGroups(result.data);
    }
  };

  const handleSyncAuditLogs = async () => {
    if (useMockData) {
      setAuditLogs(mockAuditLogs);
      return;
    }

    const result = await syncAuditLogs({ 
      maxResults: 10,
      applicationName: 'admin'
    });
    if (result) {
      setAuditLogs(result.data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Demonstração de Integração API
              </CardTitle>
              <CardDescription>
                Teste em tempo real as APIs das integrações e visualize o mapeamento de dados
              </CardDescription>
            </div>
            <Button
              variant={useMockData ? "outline" : "default"}
              onClick={() => setUseMockData(!useMockData)}
            >
              {useMockData ? 'Usar Dados Mock' : 'Usar API Real'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Info Alert */}
      {useMockData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Modo Mock Ativo</AlertTitle>
          <AlertDescription>
            Você está visualizando dados de exemplo. Conecte o Google Workspace e desative o modo mock para usar a API real.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* API Tabs */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
            Logs de Auditoria
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Usuários</CardTitle>
                <Button onClick={handleSyncUsers} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
              </div>
              <CardDescription>
                Endpoint: <code className="text-sm bg-muted px-1 py-0.5 rounded">GET /admin/directory/v1/users</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {users.map((user) => (
                    <Card key={user.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.name.fullName}</p>
                            {user.isAdmin && (
                              <Badge variant="default">Admin</Badge>
                            )}
                            {user.suspended && (
                              <Badge variant="destructive">Suspenso</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.primaryEmail}</p>
                          <p className="text-xs text-muted-foreground">
                            Departamento: {user.orgUnitPath}
                          </p>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      
                      {/* Mapping Example */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-medium mb-2">Mapeamento para entidade interna:</p>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  email: "${user.primaryEmail}",
  display_name: "${user.name.fullName}",
  role: "${user.isAdmin ? 'admin' : 'user'}",
  status: "${user.suspended ? 'suspended' : 'active'}",
  department: "${user.orgUnitPath}"
}`}
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Grupos</CardTitle>
                <Button onClick={handleSyncGroups} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
              </div>
              <CardDescription>
                Endpoint: <code className="text-sm bg-muted px-1 py-0.5 rounded">GET /admin/directory/v1/groups</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {groups.map((group) => (
                    <Card key={group.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-muted-foreground">{group.email}</p>
                          </div>
                          <Badge>{group.directMembersCount} membros</Badge>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        )}
                        
                        {/* Mapping Example */}
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2">Mapeamento para entidade interna:</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  name: "${group.name}",
  email: "${group.email}",
  member_count: ${group.directMembersCount},
  description: "${group.description || 'N/A'}"
}`}
                          </pre>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Logs de Auditoria</CardTitle>
                <Button onClick={handleSyncAuditLogs} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar
                </Button>
              </div>
              <CardDescription>
                Endpoint: <code className="text-sm bg-muted px-1 py-0.5 rounded">GET /admin/reports/v1/activity/users/all/applications/admin</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <Card key={log.id.uniqueQualifier} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{log.actor.email}</p>
                          <Badge variant="outline">
                            {new Date(log.id.time).toLocaleString()}
                          </Badge>
                        </div>
                        {log.events.map((event, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium">{event.name}</p>
                            <p className="text-muted-foreground">{event.type}</p>
                          </div>
                        ))}
                        
                        {/* Mapping Example */}
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs font-medium mb-2">Mapeamento para tabela audit_logs:</p>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  action: "${log.events[0]?.name}",
  resource_type: "${log.events[0]?.type}",
  user_id: "uuid-from-email",
  created_at: "${log.id.time}",
  metadata: ${JSON.stringify(log.events[0]?.parameters || {})}
}`}
                          </pre>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationDemo;
