import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Lock, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConnectIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: {
    name: string;
    description: string;
    logo: string;
    controls: string[];
    evidences: number;
    setupTime: string;
  };
}

const ConnectIntegrationModal = ({ isOpen, onClose, integration }: ConnectIntegrationModalProps) => {
  const [step, setStep] = useState<'config' | 'connecting' | 'success'>('config');
  const [credentials, setCredentials] = useState({
    apiKey: '',
    apiSecret: '',
    endpoint: ''
  });
  const { toast } = useToast();

  const handleConnect = async () => {
    if (!credentials.apiKey || !credentials.apiSecret) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    setStep('connecting');
    
    // Simular conexão
    setTimeout(() => {
      setStep('success');
      toast({
        title: 'Integração conectada!',
        description: `${integration.name} foi conectado com sucesso.`,
      });
      
      setTimeout(() => {
        onClose();
        setStep('config');
        setCredentials({ apiKey: '', apiSecret: '', endpoint: '' });
      }, 2000);
    }, 2000);
  };

  const handleClose = () => {
    onClose();
    setStep('config');
    setCredentials({ apiKey: '', apiSecret: '', endpoint: '' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{integration.logo}</span>
            <div>
              <DialogTitle>Conectar {integration.name}</DialogTitle>
              <DialogDescription>
                {integration.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {step === 'config' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Benefícios desta integração
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Evidências coletadas automaticamente:</span>
                  <span className="font-medium">{integration.evidences}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tempo de configuração:</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span className="font-medium">{integration.setupTime}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Controles suportados:</span>
                  <div className="flex flex-wrap gap-1">
                    {integration.controls.slice(0, 4).map((control, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {control}
                      </Badge>
                    ))}
                    {integration.controls.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{integration.controls.length - 4} mais
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Key className="h-4 w-4" />
                Configuração de Credenciais
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    API Key *
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Insira sua API Key"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="apiSecret" className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    API Secret *
                  </Label>
                  <Input
                    id="apiSecret"
                    type="password"
                    placeholder="Insira seu API Secret"
                    value={credentials.apiSecret}
                    onChange={(e) => setCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endpoint">
                    Endpoint (opcional)
                  </Label>
                  <Input
                    id="endpoint"
                    placeholder="https://api.example.com"
                    value={credentials.endpoint}
                    onChange={(e) => setCredentials(prev => ({ ...prev, endpoint: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  Suas credenciais são criptografadas e armazenadas com segurança. 
                  <Button variant="link" className="h-auto p-0 text-xs" asChild>
                    <a href="#" className="inline-flex items-center gap-1">
                      Saiba mais <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 'connecting' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-center">
              <h3 className="font-medium">Conectando {integration.name}...</h3>
              <p className="text-sm text-muted-foreground">
                Testando credenciais e configurando a integração
              </p>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-medium text-primary">Integração conectada!</h3>
              <p className="text-sm text-muted-foreground">
                {integration.name} foi conectado com sucesso e já está coletando evidências.
              </p>
            </div>
          </div>
        )}

        {step === 'config' && (
          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleConnect}>
              Conectar Integração
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectIntegrationModal;