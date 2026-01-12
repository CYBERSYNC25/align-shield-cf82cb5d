import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle, Key, Globe, ExternalLink } from 'lucide-react';
import { useOktaTestConnection, useOktaSync } from '@/hooks/useOktaSync';

interface ConnectOktaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: () => void;
}

export function ConnectOktaModal({ open, onOpenChange, onConnected }: ConnectOktaModalProps) {
  const [connectionName, setConnectionName] = useState('');
  const [domain, setDomain] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [step, setStep] = useState<'form' | 'testing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [syncResult, setSyncResult] = useState<any>(null);

  const testConnection = useOktaTestConnection();
  const syncData = useOktaSync();

  const handleConnect = async () => {
    if (!domain || !apiToken) {
      setErrorMessage('Preencha todos os campos obrigatórios');
      setStep('error');
      return;
    }

    // Clean domain (remove https:// if present)
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    setStep('testing');
    setErrorMessage('');

    try {
      const result = await testConnection.mutateAsync({
        domain: cleanDomain,
        apiToken
      });

      if (result?.success) {
        setSyncResult(result.data);
        setStep('success');
        onConnected?.();
      } else {
        setErrorMessage(result?.error || 'Falha ao conectar com Okta');
        setStep('error');
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Erro ao testar conexão');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('form');
    setConnectionName('');
    setDomain('');
    setApiToken('');
    setErrorMessage('');
    setSyncResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Conectar Okta
          </DialogTitle>
          <DialogDescription>
            Configure a integração com sua organização Okta para sincronizar usuários, grupos e aplicações.
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="connection-name">Nome da Conexão (opcional)</Label>
              <Input
                id="connection-name"
                placeholder="Ex: Okta Produção"
                value={connectionName}
                onChange={(e) => setConnectionName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="okta-domain">Okta Domain *</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="okta-domain"
                  placeholder="dev-123456.okta.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Encontre em: Okta Admin Console → Settings → Customization → Org Contact
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-token">API Token *</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="api-token"
                  type="password"
                  placeholder="00abcdef..."
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Crie em: Okta Admin Console → Security → API → Tokens → Create Token
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                O API Token permite acesso de leitura à sua organização Okta. 
                Use uma conta de serviço com permissões mínimas necessárias.
                <a 
                  href="https://developer.okta.com/docs/guides/create-an-api-token/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline mt-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Documentação Okta API Tokens
                </a>
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={handleConnect} disabled={!domain || !apiToken}>
                Testar Conexão
              </Button>
            </div>
          </div>
        )}

        {step === 'testing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Conectando ao Okta...</p>
            <p className="text-xs text-muted-foreground">Coletando usuários, grupos e aplicações</p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium">Conexão estabelecida com sucesso!</p>
            </div>

            {syncResult && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">Dados coletados:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usuários:</span>
                    <span className="font-medium">{syncResult.users?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grupos:</span>
                    <span className="font-medium">{syncResult.groups?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aplicações:</span>
                    <span className="font-medium">{syncResult.applications?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Políticas:</span>
                    <span className="font-medium">{syncResult.policies?.total || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleClose}>Concluir</Button>
            </div>
          </div>
        )}

        {step === 'error' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="font-medium">Erro ao conectar</p>
              <p className="text-sm text-muted-foreground text-center">{errorMessage}</p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button onClick={() => setStep('form')}>
                Tentar Novamente
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
