import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  BookOpen
} from 'lucide-react';
import { useAuth0TestConnection, Auth0Evidence } from '@/hooks/useAuth0Sync';

const auth0Schema = z.object({
  name: z.string().min(1, 'Nome da conexão é obrigatório'),
  domain: z.string()
    .min(1, 'Domain é obrigatório')
    .regex(
      /^[\w-]+(\.[a-z0-9-]+)*\.auth0\.com$/i,
      'Formato inválido. Ex: dev-xxxxx.us.auth0.com'
    ),
  clientId: z.string().min(20, 'Client ID deve ter pelo menos 20 caracteres'),
  clientSecret: z.string().min(20, 'Client Secret deve ter pelo menos 20 caracteres'),
});

type Auth0FormData = z.infer<typeof auth0Schema>;

interface ConnectAuth0ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: Auth0Evidence) => void;
}

export function ConnectAuth0Modal({ open, onOpenChange, onSuccess }: ConnectAuth0ModalProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [connectedData, setConnectedData] = useState<Auth0Evidence | null>(null);
  
  const testConnection = useAuth0TestConnection();

  const form = useForm<Auth0FormData>({
    resolver: zodResolver(auth0Schema),
    defaultValues: {
      name: '',
      domain: '',
      clientId: '',
      clientSecret: '',
    },
  });

  const handleSubmit = async (data: Auth0FormData) => {
    setConnectionStatus('idle');
    setErrorMessage(null);

    try {
      const result = await testConnection.mutateAsync({
        domain: data.domain,
        clientId: data.clientId,
        clientSecret: data.clientSecret,
      });

      if (result.success && result.data) {
        setConnectionStatus('success');
        setConnectedData(result.data);
        
        // Notifica sucesso após 2 segundos
        setTimeout(() => {
          onSuccess?.(result.data!);
          onOpenChange(false);
          form.reset();
          setConnectionStatus('idle');
        }, 2000);
      } else {
        setConnectionStatus('error');
        setErrorMessage(result.error || 'Não foi possível conectar ao Auth0');
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao conectar');
    }
  };

  const handleClose = () => {
    if (!testConnection.isPending) {
      onOpenChange(false);
      form.reset();
      setConnectionStatus('idle');
      setErrorMessage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Conectar Auth0
          </DialogTitle>
          <DialogDescription>
            Insira as credenciais da sua aplicação Machine to Machine do Auth0.
          </DialogDescription>
        </DialogHeader>

        {connectionStatus === 'success' && connectedData ? (
          <div className="space-y-4">
            <Alert className="border-emerald-500/50 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-200">
                Conexão estabelecida com sucesso!
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{connectedData.users.total}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{connectedData.applications.total}</p>
                <p className="text-xs text-muted-foreground">Aplicações</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{connectedData.connections.total}</p>
                <p className="text-xs text-muted-foreground">Conexões</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{connectedData.actions.total}</p>
                <p className="text-xs text-muted-foreground">Actions</p>
              </div>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {connectionStatus === 'error' && errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Conexão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Auth0 Produção" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auth0 Domain</FormLabel>
                    <FormControl>
                      <Input placeholder="dev-xxxxx.us.auth0.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Encontre em Auth0 Dashboard → Settings → Domain
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="DY844vLf1MTH0EyP3a6MYdEHZsndkRZ9" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Secret</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          type={showSecret ? 'text' : 'password'} 
                          placeholder="••••••••••••••••••••"
                          {...field} 
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Usado apenas para autenticação, não é armazenado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="instructions" className="border-muted">
                  <AccordionTrigger className="text-sm text-muted-foreground hover:text-foreground">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Como obter as credenciais?
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-3 text-muted-foreground">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>
                        Acesse o{' '}
                        <a 
                          href="https://manage.auth0.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Auth0 Dashboard
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </li>
                      <li>Vá em <strong>Applications → Applications</strong></li>
                      <li>Clique em <strong>"Create Application"</strong></li>
                      <li>Selecione <strong>"Machine to Machine Applications"</strong></li>
                      <li>Autorize o <strong>Auth0 Management API</strong></li>
                      <li>
                        Selecione as permissões:
                        <ul className="list-disc list-inside ml-4 mt-1 text-xs">
                          <li>read:users</li>
                          <li>read:connections</li>
                          <li>read:clients</li>
                          <li>read:actions</li>
                        </ul>
                      </li>
                      <li>Copie Domain, Client ID e Client Secret</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={testConnection.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={testConnection.isPending}>
                  {testConnection.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    'Conectar'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
