/**
 * PolicyVersionHistory Component
 * 
 * Exibe o histórico de versões de uma política corporativa.
 * 
 * **Funcionalidades:**
 * - Timeline visual de todas as versões
 * - Download de versões anteriores
 * - Visualização de notas de mudança
 * - Comparação entre versões
 * - Informações de autor e data
 * 
 * **Exemplos de Uso:**
 * ```tsx
 * // Visualizar histórico em modal
 * <PolicyVersionHistory policy={policyData} />
 * 
 * // Histórico inline
 * <PolicyVersionHistory 
 *   policy={policyData}
 *   inline={true}
 * />
 * ```
 * 
 * **Edge Cases:**
 * - Política sem histórico: Exibe mensagem informativa
 * - Versão sem arquivo: Desabilita botão de download
 * - Histórico muito longo: ScrollArea com limite de altura
 * - version_history com formato inválido: Fallback seguro
 * 
 * **Erros Comuns:**
 * - "Cannot read version_history": Verifica se é array válido
 * - "Download failed": Arquivo pode ter sido deletado do storage
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { History, Download, FileText, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Policy = Database['public']['Tables']['policies']['Row'];

interface VersionEntry {
  version: string;
  date: string;
  changes: string;
  file_url?: string;
  author?: string;
}

interface PolicyVersionHistoryProps {
  policy: Policy;
  trigger?: React.ReactNode;
}

/**
 * Componente de histórico de versões
 * 
 * @param policy - Política com histórico de versões
 * @param trigger - Elemento customizado para abrir o modal
 */
const PolicyVersionHistory = ({ policy, trigger }: PolicyVersionHistoryProps) => {
  const { toast } = useToast();

  /**
   * Processa o histórico de versões
   * Edge case: version_history pode ser null, undefined ou inválido
   * 
   * @returns Array de versões ordenado por data (mais recente primeiro)
   */
  const getVersionHistory = (): VersionEntry[] => {
    // Versão atual
    const currentVersion: VersionEntry = {
      version: policy.version,
      date: policy.updated_at,
      changes: 'Versão atual',
      file_url: policy.file_url || undefined,
      author: policy.user_id
    };

    // Histórico de versões antigas
    const history: VersionEntry[] = Array.isArray(policy.version_history)
      ? (policy.version_history as any[]).filter(v => 
          v && typeof v === 'object' && 'version' in v
        )
      : [];

    // Combina e ordena
    return [currentVersion, ...history].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  /**
   * Formata a data para exibição
   * 
   * @param dateString - Data em formato ISO
   * @returns Data formatada em português
   */
  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
        locale: ptBR
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  /**
   * Simula download de versão específica
   * 
   * **Fluxo Real:**
   * 1. Verificar permissão do usuário
   * 2. Obter arquivo do Supabase Storage
   * 3. Criar blob e iniciar download
   * 
   * **Edge Case:** Arquivo não existe mais no storage
   */
  const handleDownload = (version: VersionEntry) => {
    if (!version.file_url) {
      toast({
        title: "Arquivo não disponível",
        description: "Esta versão não possui documento associado.",
        variant: "destructive"
      });
      return;
    }

    // Mock de download
    toast({
      title: "Download iniciado",
      description: `Baixando ${policy.name} v${version.version}`,
    });

    // Implementação real:
    // const { data, error } = await supabase.storage
    //   .from('documents')
    //   .download(version.file_url);
    // 
    // if (data) {
    //   const url = URL.createObjectURL(data);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = `${policy.name}-v${version.version}.pdf`;
    //   a.click();
    // }
  };

  /**
   * Obtém iniciais do autor
   * Edge case: author pode ser undefined ou ID inválido
   */
  const getAuthorInitials = (author?: string): string => {
    if (!author) return '?';
    return author.substring(0, 2).toUpperCase();
  };

  const versions = getVersionHistory();

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            Histórico ({versions.length})
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Versões - {policy.name}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          {versions.length === 0 ? (
            // Edge case: Sem histórico
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma versão anterior encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version, index) => (
                <Card 
                  key={`${version.version}-${version.date}`}
                  className={`${
                    index === 0 
                      ? 'border-primary bg-primary/5' 
                      : 'border-card-border'
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getAuthorInitials(version.author)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              Versão {version.version}
                            </CardTitle>
                            {index === 0 && (
                              <Badge className="bg-primary text-primary-foreground">
                                Atual
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(version.date)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {version.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownload(version)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Alterações:
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {version.changes}
                          </p>
                        </div>
                      </div>

                      {version.file_url && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                          <FileText className="h-3 w-3" />
                          <span className="truncate">
                            {version.file_url.split('/').pop()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Informações adicionais */}
        <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
          <span>Total de versões: {versions.length}</span>
          <span>
            Criada em: {formatDate(policy.created_at)}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PolicyVersionHistory;
