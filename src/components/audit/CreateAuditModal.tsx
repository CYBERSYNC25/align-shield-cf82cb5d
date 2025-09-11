import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Shield } from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import type { Database } from '@/lib/supabase';

type AuditInsert = Database['public']['Tables']['audits']['Insert'];

export default function CreateAuditModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { createAudit } = useAudits();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    framework: '',
    status: 'planning' as AuditInsert['status'],
    auditor_name: '',
    auditor_email: '',
    start_date: '',
    end_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const audit = await createAudit({
        ...formData,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        evidence_count: 0,
        findings_count: 0
      });

      if (audit) {
        setOpen(false);
        setFormData({
          title: '',
          description: '',
          framework: '',
          status: 'planning',
          auditor_name: '',
          auditor_email: '',
          start_date: '',
          end_date: ''
        });
      }
    } catch (error) {
      console.error('Erro ao criar auditoria:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Auditoria
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Nova Auditoria
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Auditoria SOC 2 Type II - Q1 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição do escopo e objetivos da auditoria"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Framework</Label>
              <Select value={formData.framework} onValueChange={(value) => setFormData(prev => ({ ...prev, framework: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SOC 2">SOC 2</SelectItem>
                  <SelectItem value="ISO 27001">ISO 27001</SelectItem>
                  <SelectItem value="LGPD">LGPD</SelectItem>
                  <SelectItem value="GDPR">GDPR</SelectItem>
                  <SelectItem value="PCI DSS">PCI DSS</SelectItem>
                  <SelectItem value="HIPAA">HIPAA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as AuditInsert['status'] }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planejamento</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="auditor_name">Nome do Auditor</Label>
              <Input
                id="auditor_name"
                value={formData.auditor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, auditor_name: e.target.value }))}
                placeholder="Nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auditor_email">Email do Auditor</Label>
              <Input
                id="auditor_email"
                type="email"
                value={formData.auditor_email}
                onChange={(e) => setFormData(prev => ({ ...prev, auditor_email: e.target.value }))}
                placeholder="email@auditor.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data de Início</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Data de Término</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Auditoria'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}