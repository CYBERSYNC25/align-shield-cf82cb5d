import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Copy, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface MikroTikAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MikroTikAgentModal = ({ open, onOpenChange }: MikroTikAgentModalProps) => {
  const [agentToken, setAgentToken] = useState<string>('');

  useEffect(() => {
    const generateToken = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Use user ID as the agent token
        setAgentToken(user.id);
      } else {
        // Generate a random UUID if no user
        setAgentToken(crypto.randomUUID());
      }
    };
    
    if (open) {
      generateToken();
    }
  }, [open]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(agentToken);
    toast.success('Token copiado para a área de transferência!');
  };

  const configExample = `[MIKROTIK]
ip = 192.168.88.1
user = admin
password = sua_senha

[APOC]
api_url = https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/ingest-metrics
token = ${agentToken}
anon_key = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mYnl4bnBwcnd3dWllYWJ3aGRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDY4NTEsImV4cCI6MjA3MzE4Mjg1MX0.aHH2NWUQZnvV6FALdBIP5SB02YbrE8u12lXI1DtIbiw
intervalo_segundos = 5`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuração do Agente Local</DialogTitle>
          <DialogDescription>
            Siga os passos abaixo para instalar e configurar o APOC Agent no seu ambiente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Download */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                1
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">Baixar o Agente</h3>
                  <p className="text-sm text-muted-foreground">
                    Faça o download do executável do APOC Agent
                  </p>
                </div>
                <Button className="w-full sm:w-auto" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Agente (.zip)
                </Button>
              </div>
            </div>
          </Card>

          {/* Step 2: Agent Token */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                2
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">Seu Token de Agente</h3>
                  <p className="text-sm text-muted-foreground">
                    Copie este token único para usar na configuração
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agent-token">Token</Label>
                  <div className="flex gap-2">
                    <Input
                      id="agent-token"
                      value={agentToken}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Step 3: Configuration */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                3
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">Configurar o config.ini</h3>
                  <p className="text-sm text-muted-foreground">
                    Edite o arquivo config.ini com suas informações
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Modelo de Configuração</Label>
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                      <code>{configExample}</code>
                    </pre>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Substitua o IP, usuário e senha do MikroTik pelos valores corretos da sua rede
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Additional Info */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-semibold mb-2">📋 Próximos Passos</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Extraia o arquivo .zip baixado</li>
              <li>Edite o config.ini com suas credenciais</li>
              <li>Execute o APOC_Agent.exe</li>
              <li>Os dados começarão a aparecer no dashboard em tempo real</li>
            </ul>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
