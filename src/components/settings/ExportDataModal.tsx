import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  FileJson, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Loader2,
  User,
  Building2,
  AlertTriangle,
  FileText,
  Settings,
  Bell,
  Database,
  ExternalLink
} from 'lucide-react';
import { useDataExport } from '@/hooks/useDataExport';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DATA_CATEGORIES = [
  {
    id: 'profile',
    name: 'Perfil e Conta',
    icon: User,
    description: 'Dados pessoais, preferências e configurações da conta',
    tables: ['profiles', 'user_roles']
  },
  {
    id: 'organization',
    name: 'Organização',
    icon: Building2,
    description: 'Dados da organização e membros',
    tables: ['organizations']
  },
  {
    id: 'compliance',
    name: 'Compliance',
    icon: Shield,
    description: 'Frameworks, controles e testes de conformidade',
    tables: ['frameworks', 'controls', 'control_tests', 'compliance_alerts']
  },
  {
    id: 'risks',
    name: 'Riscos',
    icon: AlertTriangle,
    description: 'Registro de riscos, avaliações e fornecedores',
    tables: ['risks', 'risk_assessments', 'risk_acceptances', 'vendors']
  },
  {
    id: 'audit',
    name: 'Auditoria',
    icon: FileText,
    description: 'Auditorias, evidências e logs de atividade',
    tables: ['audits', 'evidence', 'audit_logs']
  },
  {
    id: 'policies',
    name: 'Políticas e Tarefas',
    icon: FileText,
    description: 'Políticas de segurança e tarefas',
    tables: ['policies', 'tasks']
  },
  {
    id: 'incidents',
    name: 'Incidentes',
    icon: AlertTriangle,
    description: 'Incidentes, playbooks e planos de continuidade',
    tables: ['incidents', 'incident_playbooks', 'bcp_plans']
  },
  {
    id: 'integrations',
    name: 'Integrações',
    icon: Settings,
    description: 'Conexões com serviços externos (sem credenciais)',
    tables: ['integrations', 'integration_status', 'integration_collected_data']
  },
  {
    id: 'notifications',
    name: 'Notificações',
    icon: Bell,
    description: 'Histórico de notificações',
    tables: ['notifications']
  },
  {
    id: 'questionnaires',
    name: 'Questionários',
    icon: Database,
    description: 'Questionários de segurança e respostas',
    tables: ['security_questionnaires', 'questionnaire_questions']
  }
];

export const ExportDataModal = ({ open, onOpenChange }: ExportDataModalProps) => {
  const [includeActivityLogs, setIncludeActivityLogs] = useState(true);
  const { 
    requestExport, 
    isExporting, 
    lastCompletedExport, 
    pendingExport,
    exportRequests 
  } = useDataExport();

  const handleExport = async () => {
    const result = await requestExport(includeActivityLogs);
    if (result?.download_url) {
      // Abrir download em nova aba
      window.open(result.download_url, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  const recentExports = exportRequests
    .filter(r => r.request_type === 'export')
    .slice(0, 5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <DialogTitle>Exportar Meus Dados</DialogTitle>
          </div>
          <DialogDescription>
            Exporte todos os seus dados em formato JSON conforme a Lei Geral de Proteção de Dados (LGPD)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Info Card */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-primary">Direito de Portabilidade (LGPD)</h4>
                    <p className="text-sm text-muted-foreground">
                      Você tem o direito de receber uma cópia de todos os seus dados pessoais em formato estruturado.
                      Credenciais e tokens de acesso são automaticamente removidos por segurança.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categorias de dados */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Dados incluídos na exportação:</h4>
              <div className="grid gap-2">
                {DATA_CATEGORIES.map((category) => (
                  <div 
                    key={category.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                  >
                    <category.icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {category.description}
                      </p>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Opções */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Opções:</h4>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-logs"
                  checked={includeActivityLogs}
                  onCheckedChange={(checked) => setIncludeActivityLogs(checked as boolean)}
                />
                <label htmlFor="include-logs" className="text-sm">
                  Incluir logs de atividade (últimos 1000 registros)
                </label>
              </div>
            </div>

            {/* Última exportação */}
            {lastCompletedExport && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Última exportação:</h4>
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm">
                              {formatDistanceToNow(new Date(lastCompletedExport.completed_at!), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {lastCompletedExport.metadata?.total_records || 0} registros
                            </p>
                          </div>
                        </div>
                        {lastCompletedExport.file_url && new Date(lastCompletedExport.expires_at!) > new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(lastCompletedExport.file_url!, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Baixar
                          </Button>
                        )}
                        {lastCompletedExport.expires_at && new Date(lastCompletedExport.expires_at) <= new Date() && (
                          <Badge variant="secondary">Expirado</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {/* Exportação em andamento */}
            {pendingExport && (
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                    <p className="text-sm">Exportação em andamento...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aviso sobre link temporário */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mt-0.5" />
              <p>O link de download expira em 24 horas por segurança.</p>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleExport}
            disabled={isExporting || !!pendingExport}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
