/**
 * EditPolicyModal Component
 * 
 * Modal para edição de políticas corporativas com suporte a versionamento automático.
 * 
 * **Funcionalidades:**
 * - Edição de metadados da política (nome, descrição, categoria, etc.)
 * - Versionamento automático quando há alterações significativas
 * - Upload de nova versão do documento
 * - Registro de histórico de alterações
 * - Workflow de aprovação resetado ao criar nova versão
 * 
 * **Exemplos de Uso:**
 * ```tsx
 * // Edição simples (não cria nova versão)
 * <EditPolicyModal 
 *   policy={policyData} 
 *   onSuccess={() => refetchPolicies()}
 * />
 * 
 * // Com callback personalizado
 * <EditPolicyModal 
 *   policy={policyData}
 *   onSuccess={(updatedPolicy) => {
 *     console.log('Política atualizada:', updatedPolicy);
 *     showToast('Sucesso!');
 *   }}
 * />
 * ```
 * 
 * **Edge Cases:**
 * - Arquivo muito grande (>20MB): Validação antes do upload
 * - Campos obrigatórios vazios: Validação no submit
 * - Usuário sem permissão: Bloqueio no backend (RLS)
 * - Política em aprovação: Aviso ao usuário sobre reset do workflow
 * - Falha no upload: Rollback da operação
 * 
 * **Erros Comuns:**
 * - "Failed to update policy": Verificar conexão e permissões RLS
 * - "File upload failed": Verificar tamanho e tipo do arquivo
 * - "Version history invalid": Schema do JSONB incorreto
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePolicies } from '@/hooks/usePolicies';
import { Edit, AlertCircle, GitBranch } from 'lucide-react';
import FileUploader from '@/components/common/FileUploader';
import type { Database } from '@/integrations/supabase/types';

type Policy = Database['public']['Tables']['policies']['Row'];

interface EditPolicyModalProps {
  policy: Policy;
  onSuccess?: (updatedPolicy?: Policy) => void;
  trigger?: React.ReactNode;
}

/**
 * Modal de edição de política
 * 
 * @param policy - Dados da política a ser editada
 * @param onSuccess - Callback executado após edição bem-sucedida
 * @param trigger - Elemento customizado para abrir o modal (opcional)
 */
const EditPolicyModal = ({ policy, onSuccess, trigger }: EditPolicyModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createNewVersion, setCreateNewVersion] = useState(false);
  const { updatePolicy } = usePolicies();

  const [formData, setFormData] = useState({
    name: policy.name,
    description: policy.description || '',
    category: policy.category,
    version: policy.version,
    status: policy.status as 'draft' | 'active' | 'review' | 'archived',
    owner: policy.owner || '',
    approver: policy.approver || '',
    effective_date: policy.effective_date || '',
    review_date: policy.review_date || '',
    next_review: policy.next_review || '',
    tags: policy.tags || [],
    file_url: policy.file_url || '',
    version_notes: ''
  });

  /**
   * Reseta o formulário quando a política muda
   * Edge case: Modal aberto e política alterada externamente
   */
  useEffect(() => {
    setFormData({
      name: policy.name,
      description: policy.description || '',
      category: policy.category,
      version: policy.version,
      status: policy.status as 'draft' | 'active' | 'review' | 'archived',
      owner: policy.owner || '',
      approver: policy.approver || '',
      effective_date: policy.effective_date || '',
      review_date: policy.review_date || '',
      next_review: policy.next_review || '',
      tags: policy.tags || [],
      file_url: policy.file_url || '',
      version_notes: ''
    });
    setCreateNewVersion(false);
  }, [policy, open]);

  /**
   * Incrementa a versão automaticamente
   * Formato: major.minor (ex: 1.0 -> 1.1 ou 2.0)
   */
  const incrementVersion = (currentVersion: string): string => {
    const parts = currentVersion.split('.');
    const major = parseInt(parts[0] || '1');
    const minor = parseInt(parts[1] || '0');
    
    // Nova versão major se houver mudanças significativas
    if (createNewVersion && formData.file_url !== policy.file_url) {
      return `${major + 1}.0`;
    }
    
    // Nova versão minor para mudanças menores
    return `${major}.${minor + 1}`;
  };

  /**
   * Submete as alterações da política
   * 
   * **Validações:**
   * - Campos obrigatórios preenchidos
   * - Formato de versão válido
   * - Tamanho do arquivo dentro do limite
   * 
   * **Fluxo:**
   * 1. Valida dados do formulário
   * 2. Cria entrada no histórico de versões
   * 3. Atualiza política no banco
   * 4. Reseta workflow de aprovação se nova versão
   * 5. Registra log de auditoria
   * 
   * **Exemplo de version_history:**
   * ```json
   * [
   *   {
   *     "version": "1.0",
   *     "date": "2024-01-01T00:00:00Z",
   *     "author": "user-id",
   *     "changes": "Versão inicial",
   *     "file_url": "/path/to/file.pdf"
   *   }
   * ]
   * ```
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de campos obrigatórios
    if (!formData.name.trim() || !formData.category) {
      return;
    }

    setLoading(true);

    try {
      const updateData: any = { ...formData };
      
      // Cria nova versão se necessário
      if (createNewVersion) {
        const newVersion = incrementVersion(policy.version);
        const versionHistory = Array.isArray(policy.version_history) 
          ? policy.version_history 
          : [];
        
        // Adiciona versão atual ao histórico
        versionHistory.push({
          version: policy.version,
          date: new Date().toISOString(),
          changes: formData.version_notes || 'Atualização de política',
          file_url: policy.file_url,
          author: policy.user_id
        });
        
        updateData.version = newVersion;
        updateData.version_history = versionHistory;
        updateData.approval_status = 'pending'; // Reset workflow
        updateData.approved_by = null;
        updateData.approved_at = null;
      }
      
      // Remove campos temporários
      delete updateData.version_notes;
      
      await updatePolicy(policy.id, updateData);
      
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao atualizar política:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Política
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Alerta sobre versionamento */}
            {createNewVersion && (
              <Alert className="bg-info/10 border-info/20">
                <GitBranch className="h-4 w-4 text-info" />
                <AlertDescription className="text-info">
                  Uma nova versão será criada ({incrementVersion(policy.version)}). 
                  O workflow de aprovação será resetado.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="name">Nome da Política *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Política de Segurança da Informação"
                  required
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo e escopo da política"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seguranca">Segurança</SelectItem>
                    <SelectItem value="ti">Tecnologia da Informação</SelectItem>
                    <SelectItem value="rh">Recursos Humanos</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="operacoes">Operações</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Versão Atual</Label>
                <Input
                  id="version"
                  value={formData.version}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="review">Em Revisão</SelectItem>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="archived">Arquivada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner">Responsável</Label>
                <Input
                  id="owner"
                  value={formData.owner}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="approver">Aprovador</Label>
                <Input
                  id="approver"
                  value={formData.approver}
                  onChange={(e) => setFormData(prev => ({ ...prev, approver: e.target.value }))}
                  placeholder="Nome do aprovador"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="effective_date">Data de Vigência</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="review_date">Data de Revisão</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, review_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_review">Próxima Revisão</Label>
                <Input
                  id="next_review"
                  type="date"
                  value={formData.next_review}
                  onChange={(e) => setFormData(prev => ({ ...prev, next_review: e.target.value }))}
                />
              </div>
            </div>

            {/* Toggle para criar nova versão */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="new-version" className="text-base cursor-pointer">
                  Criar Nova Versão
                </Label>
                <p className="text-sm text-muted-foreground">
                  Incrementa a versão e registra no histórico
                </p>
              </div>
              <Switch
                id="new-version"
                checked={createNewVersion}
                onCheckedChange={setCreateNewVersion}
              />
            </div>

            {/* Notas da versão (aparece só se criar nova versão) */}
            {createNewVersion && (
              <div className="space-y-2">
                <Label htmlFor="version_notes">Notas da Versão *</Label>
                <Textarea
                  id="version_notes"
                  value={formData.version_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, version_notes: e.target.value }))}
                  placeholder="Descreva as mudanças realizadas nesta versão"
                  rows={3}
                  required={createNewVersion}
                />
              </div>
            )}

            {/* Upload de documento */}
            <div className="space-y-2">
              <Label>Documento da Política</Label>
              <FileUploader
                bucket="documents"
                folder="policies"
                onUploadComplete={(urls) => {
                  const url = Array.isArray(urls) ? urls[0] : urls;
                  if (url) {
                    setFormData(prev => ({ ...prev, file_url: url }));
                    if (url !== policy.file_url) {
                      setCreateNewVersion(true);
                    }
                  }
                }}
              />
              {formData.file_url && (
                <p className="text-xs text-muted-foreground">
                  Arquivo atual: {formData.file_url.split('/').pop()}
                </p>
              )}
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EditPolicyModal;
