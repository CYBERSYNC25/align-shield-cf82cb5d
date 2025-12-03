import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useRisks } from '@/hooks/useRisks';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Plus } from 'lucide-react';

interface CreateRiskModalProps {
  onSuccess?: () => void;
}

const CreateRiskModal = ({ onSuccess }: CreateRiskModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createRisk } = useRisks();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    probability: 'medium' as 'low' | 'medium' | 'high',
    impact: 'medium' as 'low' | 'medium' | 'high',
    level: 'medium' as 'low' | 'medium' | 'high',
    owner: '',
    owner_role: '',
    status: 'active' as 'active' | 'mitigated' | 'accepted',
    trend: 'stable' as 'increasing' | 'decreasing' | 'stable',
    controls: [] as string[],
    next_review: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const riskData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        probability: formData.probability,
        impact: formData.impact,
        level: formData.level,
        owner: formData.owner,
        ownerRole: formData.owner_role,
        status: formData.status,
        trend: formData.trend,
        controls: formData.controls,
        riskScore: calculateRiskScore(formData.probability, formData.impact),
        lastReview: new Date().toISOString().split('T')[0],
        nextReview: formData.next_review
      };

      const { error } = await createRisk(riskData);
      
      if (!error) {
        setOpen(false);
        setFormData({
          title: '',
          description: '',
          category: '',
          probability: 'medium',
          impact: 'medium',
          level: 'medium',
          owner: '',
          owner_role: '',
          status: 'active',
          trend: 'stable',
          controls: [],
          next_review: ''
        });
        toast({
          title: "Risco criado",
          description: "O risco foi cadastrado com sucesso.",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Erro",
          description: "Falha ao criar o risco. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao criar risco:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = (probability: string, impact: string): number => {
    const probMap = { low: 1, medium: 2, high: 3 };
    const impactMap = { low: 1, medium: 2, high: 3 };
    return (probMap[probability as keyof typeof probMap] || 2) * (impactMap[impact as keyof typeof impactMap] || 2) * 10;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Risco
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cadastrar Novo Risco
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="title">Título do Risco *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Falha de segurança de dados"
                required
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o risco detalhadamente"
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
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operacional">Operacional</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="estrategico">Estratégico</SelectItem>
                  <SelectItem value="tecnologico">Tecnológico</SelectItem>
                  <SelectItem value="regulatorio">Regulatório</SelectItem>
                  <SelectItem value="reputacional">Reputacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Proprietário *</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Nome do responsável"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="probability">Probabilidade</Label>
              <Select 
                value={formData.probability} 
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData(prev => ({ ...prev, probability: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="impact">Impacto</Label>
              <Select 
                value={formData.impact} 
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData(prev => ({ ...prev, impact: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixo</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="high">Alto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: 'active' | 'mitigated' | 'accepted') => 
                  setFormData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="mitigated">Mitigado</SelectItem>
                  <SelectItem value="accepted">Aceito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner_role">Cargo do Proprietário</Label>
              <Input
                id="owner_role"
                value={formData.owner_role}
                onChange={(e) => setFormData(prev => ({ ...prev, owner_role: e.target.value }))}
                placeholder="Ex: Gerente de TI"
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

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Risco'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRiskModal;