import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useFrameworks } from '@/hooks/useFrameworks';
import { Shield, Plus } from 'lucide-react';

interface CreateControlModalProps {
  onSuccess?: () => void;
}

const CreateControlModal = ({ onSuccess }: CreateControlModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createControl } = useFrameworks();

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    category: '',
    status: 'pending' as 'pending' | 'passed' | 'failed' | 'na',
    owner: '',
    framework_id: '',
    next_review: '',
    findings: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const controlData = {
        code: formData.code,
        title: formData.title,
        description: formData.description || '',
        category: formData.category,
        status: formData.status,
        evidence_count: 0,
        owner: formData.owner || '',
        last_verified: '',
        next_review: formData.next_review || '',
        findings: formData.findings,
        framework_id: formData.framework_id || ''
      };

      const result = await createControl(controlData);
      
      if (result) {
        setOpen(false);
        setFormData({
          code: '',
          title: '',
          description: '',
          category: '',
          status: 'pending',
          owner: '',
          framework_id: '',
          next_review: '',
          findings: []
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao criar controle:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Controle
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Criar Novo Controle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Controle *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="Ex: AC-1, SC-7, AU-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="access_control">Controle de Acesso</SelectItem>
                  <SelectItem value="audit_accountability">Auditoria e Responsabilidade</SelectItem>
                  <SelectItem value="awareness_training">Conscientização e Treinamento</SelectItem>
                  <SelectItem value="configuration_management">Gestão de Configuração</SelectItem>
                  <SelectItem value="identification_authentication">Identificação e Autenticação</SelectItem>
                  <SelectItem value="incident_response">Resposta a Incidentes</SelectItem>
                  <SelectItem value="system_protection">Proteção do Sistema</SelectItem>
                  <SelectItem value="risk_assessment">Avaliação de Riscos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título do Controle *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Política e Procedimentos de Controle de Acesso"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o objetivo e implementação do controle"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'pending' | 'passed' | 'failed' | 'na') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="passed">Aprovado</SelectItem>
                  <SelectItem value="failed">Falhando</SelectItem>
                  <SelectItem value="na">Não Aplicável</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Proprietário</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Responsável pelo controle"
              />
            </div>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Controle'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateControlModal;