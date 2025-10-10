import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useUserRoles } from '@/hooks/useUserRoles';
import { FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const actionLabels: Record<string, string> = {
  create: 'Criou',
  update: 'Atualizou',
  delete: 'Excluiu',
  assign_role: 'Atribuiu função',
  remove_role: 'Removeu função',
  login: 'Login',
  logout: 'Logout'
};

const resourceLabels: Record<string, string> = {
  controls: 'Controle',
  risks: 'Risco',
  policies: 'Política',
  evidence: 'Evidência',
  audits: 'Auditoria',
  user_roles: 'Função de Usuário',
  frameworks: 'Framework'
};

export default function AuditLogsViewer() {
  const { logs, loading } = useAuditLogs();
  const { canViewAuditLogs } = useUserRoles();

  if (!canViewAuditLogs()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Você não tem permissão para visualizar logs de auditoria.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Logs de Auditoria
        </CardTitle>
        <CardDescription>
          Histórico completo de ações realizadas no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full pr-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum log encontrado</p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg space-y-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <Badge variant="secondary">
                        {resourceLabels[log.resource_type] || log.resource_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR
                      })}
                    </div>
                  </div>

                  {log.user_id && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" />
                      Usuário: {log.user_id.substring(0, 8)}...
                    </div>
                  )}

                  {log.new_data && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver detalhes
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                        {JSON.stringify(log.new_data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
