import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, CheckCircle, AlertCircle, Info } from 'lucide-react';
import type { ApiProvider } from '../ApiIntegrationFlow';

interface AzureAdConnectorProps {
  provider: ApiProvider;
  onBack: () => void;
}

export const AzureAdConnector = ({ provider, onBack }: AzureAdConnectorProps) => {
  const [step, setStep] = useState<'config' | 'scopes' | 'connecting' | 'success'>('config');
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(
    provider.scopes?.filter(s => s.required).map(s => s.id) || []
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleScopeToggle = (scopeId: string, required: boolean) => {
    if (required) return; // Can't deselect required scopes
    
    setSelectedScopes(prev => 
      prev.includes(scopeId) 
        ? prev.filter(s => s !== scopeId)
        : [...prev, scopeId]
    );
  };

  const validateConfig = () => {
    if (!tenantId || !clientId || !clientSecret) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos para continuar',
        variant: 'destructive'
      });
      return false;
    }

    // Basic UUID validation for tenant and client IDs
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId) || !uuidRegex.test(clientId)) {
      toast({
        title: 'Formato inválido',
        description: 'Tenant ID e Client ID devem estar no formato UUID',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const handleConnect = async () => {
    if (!validateConfig()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Call edge function to initiate Azure OAuth flow
      const { data, error } = await supabase.functions.invoke('azure-oauth-start', {
        body: {
          tenant_id: tenantId,
          client_id: clientId,
          client_secret: clientSecret,
          scopes: selectedScopes
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        // Redirect to Azure OAuth consent screen
        window.location.href = data.authorization_url;
      } else {
        throw new Error('URL de autorização não retornada');
      }
    } catch (error: any) {
      console.error('Erro ao conectar:', error);
      toast({
        title: 'Erro na conexão',
        description: error.message || 'Não foi possível iniciar o fluxo OAuth',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderConfigStep = () => (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Configuração do Azure AD</h3>
        <p className="text-sm text-muted-foreground">
          Insira as credenciais do seu aplicativo registrado no Azure Portal
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">Como obter as credenciais:</p>
          <ol className="text-sm space-y-1 ml-4">
            <li>1. Acesse o Azure Portal → Azure Active Directory</li>
            <li>2. Vá em "App registrations" → "New registration"</li>
            <li>3. Copie o Tenant ID e Client ID</li>
            <li>4. Em "Certificates & secrets", crie um novo Client Secret</li>
          </ol>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="tenantId">Tenant ID *</Label>
          <Input
            id="tenantId"
            placeholder="00000000-0000-0000-0000-000000000000"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            ID do diretório (tenant) no Azure AD
          </p>
        </div>

        <div>
          <Label htmlFor="clientId">Client ID (Application ID) *</Label>
          <Input
            id="clientId"
            placeholder="00000000-0000-0000-0000-000000000000"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="clientSecret">Client Secret *</Label>
          <Input
            id="clientSecret"
            type="password"
            placeholder="••••••••••••••••"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Será armazenado de forma criptografada
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={() => setStep('scopes')} disabled={loading}>
          Próximo: Escolher Permissões
        </Button>
      </div>

      <div className="pt-4 border-t">
        <a
          href="https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredApps"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir Azure Portal para registrar aplicativo
        </a>
      </div>
    </Card>
  );

  const renderScopesStep = () => (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Permissões e Escopos</h3>
        <p className="text-sm text-muted-foreground">
          Selecione as permissões que a integração precisará acessar
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Permissões marcadas como obrigatórias são necessárias para o funcionamento básico da integração.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {provider.scopes?.map(scope => (
          <div key={scope.id} className="flex items-start space-x-3 p-4 border rounded-lg">
            <Checkbox
              id={scope.id}
              checked={selectedScopes.includes(scope.id)}
              onCheckedChange={() => handleScopeToggle(scope.id, scope.required)}
              disabled={scope.required || loading}
            />
            <div className="flex-1">
              <Label htmlFor={scope.id} className="font-medium cursor-pointer">
                {scope.name}
                {scope.required && (
                  <span className="ml-2 text-xs text-red-500">* Obrigatório</span>
                )}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {scope.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <strong>Importante:</strong> Certifique-se de que essas permissões estão configuradas no Azure Portal para seu aplicativo.
        </AlertDescription>
      </Alert>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep('config')} disabled={loading}>
          Voltar
        </Button>
        <Button onClick={handleConnect} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Conectando...
            </>
          ) : (
            'Conectar com Azure AD'
          )}
        </Button>
      </div>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="p-6 space-y-6 text-center">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">Conexão Estabelecida!</h3>
        <p className="text-sm text-muted-foreground">
          Sua integração com Azure AD foi configurada com sucesso
        </p>
      </div>

      <div className="space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Token de acesso armazenado com segurança</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>{selectedScopes.length} permissões configuradas</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span>Sincronização automática ativada</span>
        </div>
      </div>

      <Button onClick={onBack} className="w-full">
        Concluir
      </Button>
    </Card>
  );

  switch (step) {
    case 'config':
      return renderConfigStep();
    case 'scopes':
      return renderScopesStep();
    case 'success':
      return renderSuccessStep();
    default:
      return renderConfigStep();
  }
};
