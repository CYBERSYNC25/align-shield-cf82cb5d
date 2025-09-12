import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useRisks } from '@/hooks/useRisks';
import { Building2, Plus } from 'lucide-react';

interface CreateVendorModalProps {
  onSuccess?: () => void;
}

const CreateVendorModal = ({ onSuccess }: CreateVendorModalProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createVendor } = useRisks();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    criticality: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    contractValue: '',
    lastAssessment: '',
    nextAssessment: '',
    status: 'active' as 'active' | 'review' | 'expired',
    certifications: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vendorData = {
        ...formData,
        complianceScore: Math.floor(Math.random() * 40) + 60, // Score inicial entre 60-100
        pendingActions: Math.floor(Math.random() * 5)
      };

      const { error } = await createVendor(vendorData);
      
      if (!error) {
        setOpen(false);
        setFormData({
          name: '',
          category: '',
          criticality: 'medium',
          riskLevel: 'medium',
          contractValue: '',
          lastAssessment: '',
          nextAssessment: '',
          status: 'active',
          certifications: []
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error('Erro ao criar fornecedor:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Cadastrar Novo Fornecedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Fornecedor *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Microsoft, AWS, Google..."
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
                  <SelectItem value="tecnologia">Tecnologia</SelectItem>
                  <SelectItem value="consultoria">Consultoria</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="juridico">Jurídico</SelectItem>
                  <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="criticality">Criticidade</Label>
              <Select 
                value={formData.criticality} 
                onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                  setFormData(prev => ({ ...prev, criticality: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="risk_level">Nível de Risco</Label>
              <Select 
                value={formData.riskLevel} 
                onValueChange={(value: 'low' | 'medium' | 'high') => 
                  setFormData(prev => ({ ...prev, riskLevel: value }))
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractValue">Valor do Contrato</Label>
              <Input
                id="contractValue"
                value={formData.contractValue}
                onChange={(e) => setFormData(prev => ({ ...prev, contractValue: e.target.value }))}
                placeholder="Ex: R$ 50.000/mês"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nextAssessment">Próxima Avaliação</Label>
              <Input
                id="nextAssessment"
                type="date"
                value={formData.nextAssessment}
                onChange={(e) => setFormData(prev => ({ ...prev, nextAssessment: e.target.value }))}
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
              {loading ? 'Criando...' : 'Criar Fornecedor'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVendorModal;