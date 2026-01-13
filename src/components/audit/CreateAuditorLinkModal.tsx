import { useState } from 'react';
import { Link2, Copy, Check, Shield, Calendar, Mail, Building2, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuditorAccess } from '@/hooks/useAuditorAccess';

interface CreateAuditorLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EXPIRATION_OPTIONS = [
  { value: '7', label: '7 dias' },
  { value: '14', label: '14 dias' },
  { value: '30', label: '30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
];

const AUDIT_TYPES = [
  { value: 'soc2', label: 'SOC 2 Type II' },
  { value: 'iso27001', label: 'ISO 27001' },
  { value: 'lgpd', label: 'LGPD' },
  { value: 'hipaa', label: 'HIPAA' },
  { value: 'pci-dss', label: 'PCI-DSS' },
  { value: 'other', label: 'Outro' },
];

export function CreateAuditorLinkModal({ open, onOpenChange }: CreateAuditorLinkModalProps) {
  const { createToken, isCreating } = useAuditorAccess();
  
  const [auditorName, setAuditorName] = useState('');
  const [auditorEmail, setAuditorEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [auditType, setAuditType] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('30');
  const [permissions, setPermissions] = useState({
    view_evidence: true,
    view_inventory: true,
    view_history: true,
  });
  
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    try {
      const result = await createToken({
        auditorName: auditorName || undefined,
        auditorEmail: auditorEmail || undefined,
        companyName: companyName || undefined,
        auditType: auditType || undefined,
        expiresInDays: parseInt(expiresInDays),
        permissions,
      });

      const link = `${window.location.origin}/auditor-portal?token=${result.token}`;
      setGeneratedLink(link);
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setAuditorName('');
    setAuditorEmail('');
    setCompanyName('');
    setAuditType('');
    setExpiresInDays('30');
    setPermissions({
      view_evidence: true,
      view_inventory: true,
      view_history: true,
    });
    setGeneratedLink(null);
    setCopied(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Criar Link para Auditor</DialogTitle>
          </div>
          <DialogDescription>
            Gere um link seguro para que auditores externos acessem o portal de evidências.
          </DialogDescription>
        </DialogHeader>

        {generatedLink ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <Shield className="h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Link seguro gerado com sucesso!
              </p>
            </div>

            <div className="space-y-2">
              <Label>Link de Acesso</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Este link expira em {expiresInDays} dias. Compartilhe apenas com o auditor.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
              <Button onClick={() => setGeneratedLink(null)}>
                Criar Outro
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="space-y-4 py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="auditorName" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Nome do Auditor
                </Label>
                <Input
                  id="auditorName"
                  placeholder="Ex: João Silva"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="auditorEmail" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Email do Auditor
                </Label>
                <Input
                  id="auditorEmail"
                  type="email"
                  placeholder="auditor@empresa.com"
                  value={auditorEmail}
                  onChange={(e) => setAuditorEmail(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="companyName" className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  Empresa de Auditoria
                </Label>
                <Input
                  id="companyName"
                  placeholder="Ex: Big Four Audit"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="auditType" className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Tipo de Auditoria
                  </Label>
                  <Select value={auditType} onValueChange={setAuditType}>
                    <SelectTrigger id="auditType">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {AUDIT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="expires" className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Validade
                  </Label>
                  <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                    <SelectTrigger id="expires">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPIRATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Permissões</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm_evidence"
                      checked={permissions.view_evidence}
                      onCheckedChange={(checked) => 
                        setPermissions(p => ({ ...p, view_evidence: !!checked }))
                      }
                    />
                    <Label htmlFor="perm_evidence" className="text-sm font-normal">
                      Visualizar Evidências e Controles
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm_inventory"
                      checked={permissions.view_inventory}
                      onCheckedChange={(checked) => 
                        setPermissions(p => ({ ...p, view_inventory: !!checked }))
                      }
                    />
                    <Label htmlFor="perm_inventory" className="text-sm font-normal">
                      Visualizar Inventário de Ativos
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="perm_history"
                      checked={permissions.view_history}
                      onCheckedChange={(checked) => 
                        setPermissions(p => ({ ...p, view_history: !!checked }))
                      }
                    />
                    <Label htmlFor="perm_history" className="text-sm font-normal">
                      Visualizar Histórico de Verificações
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? 'Gerando...' : 'Gerar Link Seguro'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
