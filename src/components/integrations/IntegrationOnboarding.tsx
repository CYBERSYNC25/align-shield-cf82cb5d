/**
 * Integration Onboarding Component
 * 
 * Step-by-step visual guide for setting up integrations
 * Includes examples, common errors, and clear instructions
 */

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Info,
  ExternalLink,
  Copy,
  ChevronRight,
  PlayCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const IntegrationOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copiado!',
      description: 'Texto copiado para a área de transferência.',
    });
  };

  const steps = [
    {
      title: 'Escolha uma Integração',
      description: 'Selecione qual serviço você deseja integrar ao APOC',
      completed: currentStep > 0,
    },
    {
      title: 'Configure as Credenciais',
      description: 'Obtenha e configure as credenciais necessárias',
      completed: currentStep > 1,
    },
    {
      title: 'Autorize o Acesso',
      description: 'Complete o fluxo OAuth 2.0 para autorizar o acesso',
      completed: currentStep > 2,
    },
    {
      title: 'Configure Webhooks (Opcional)',
      description: 'Configure webhooks para sincronização em tempo real',
      completed: currentStep > 3,
    },
    {
      title: 'Teste a Integração',
      description: 'Verifique se tudo está funcionando corretamente',
      completed: currentStep > 4,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-primary" />
            <CardTitle>Bem-vindo ao Hub de Integrações</CardTitle>
          </div>
          <CardDescription>
            Siga este guia passo a passo para conectar suas ferramentas e automatizar a coleta de evidências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Dica</AlertTitle>
            <AlertDescription>
              A integração leva cerca de 5-10 minutos. Tenha em mãos as credenciais de administrador do serviço que deseja integrar.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Steps Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Progresso da Configuração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                  currentStep === index
                    ? 'border-primary bg-primary/5'
                    : step.completed
                    ? 'border-green-500/20 bg-green-500/5'
                    : 'border-muted'
                }`}
              >
                <div className="mt-0.5">
                  {step.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : currentStep === index ? (
                    <Circle className="h-5 w-5 text-primary fill-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{step.title}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {currentStep === index && (
                  <Badge variant="default">Atual</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Guides by Integration */}
      <Tabs defaultValue="google" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="google">Google Workspace</TabsTrigger>
          <TabsTrigger value="aws">AWS</TabsTrigger>
          <TabsTrigger value="azure">Azure</TabsTrigger>
          <TabsTrigger value="okta">Okta</TabsTrigger>
        </TabsList>

        {/* Google Workspace Guide */}
        <TabsContent value="google" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guia: Google Workspace</CardTitle>
              <CardDescription>
                Configure a integração com o Google Workspace em 5 passos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>1</Badge>
                  <h3 className="font-semibold">Criar Projeto no Google Cloud</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" className="text-primary hover:underline">Google Cloud Console</a></li>
                  <li>Crie um novo projeto ou selecione um existente</li>
                  <li>Ative as APIs necessárias: Admin SDK API e People API</li>
                </ol>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>2</Badge>
                  <h3 className="font-semibold">Configurar Tela de Consentimento</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Navegue até APIs & Services → OAuth consent screen</li>
                  <li>Escolha "Internal" se for apenas para sua organização</li>
                  <li>Preencha nome do app, email de suporte e logo</li>
                  <li>Adicione os escopos: userinfo.email, userinfo.profile, admin.directory.user.readonly</li>
                </ol>
              </div>

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>3</Badge>
                  <h3 className="font-semibold">Criar Credenciais OAuth 2.0</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Vá em APIs & Services → Credentials</li>
                  <li>Clique em "+ CREATE CREDENTIALS" → OAuth client ID</li>
                  <li>Tipo de aplicativo: Web application</li>
                  <li>Authorized redirect URIs:</li>
                </ol>
                <div className="ml-8 mt-2">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded text-sm font-mono">
                    <span className="flex-1">
                      https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>4</Badge>
                  <h3 className="font-semibold">Adicionar Credenciais ao Supabase</h3>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm ml-4">
                  <li>Copie o Client ID e Client Secret gerados</li>
                  <li>Vá na aba "🔐 Secrets" nesta página</li>
                  <li>Adicione os secrets GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET</li>
                </ol>
              </div>

              {/* Step 5 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge>5</Badge>
                  <h3 className="font-semibold">Autorizar Acesso</h3>
                </div>
                <p className="text-sm ml-4">
                  Vá na aba "OAuth 2.0" e clique em "Conectar Google Workspace" para iniciar o fluxo de autorização.
                </p>
              </div>

              <Button className="w-full" onClick={() => setCurrentStep(5)}>
                Concluir Configuração
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Common Errors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Erros Comuns e Soluções
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="error-1">
                  <AccordionTrigger>
                    <span className="text-red-500">Error: redirect_uri_mismatch</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Causa:</strong> A URI de redirecionamento configurada no Google Cloud não corresponde à usada na requisição.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Solução:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Verifique se adicionou exatamente esta URL no Google Cloud Console:</li>
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                        https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/google-oauth-callback
                      </div>
                      <li>Certifique-se de não ter espaços extras ou barras no final</li>
                      <li>Aguarde alguns minutos após salvar as mudanças no Google</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-2">
                  <AccordionTrigger>
                    <span className="text-red-500">Error: invalid_client</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Causa:</strong> Client ID ou Client Secret incorretos.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Solução:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Revise os valores de GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET</li>
                      <li>Certifique-se de copiar os valores completos sem espaços</li>
                      <li>Se necessário, gere novas credenciais no Google Cloud Console</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-3">
                  <AccordionTrigger>
                    <span className="text-red-500">Error: access_denied</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Causa:</strong> O usuário não aprovou os escopos solicitados.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Solução:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Tente novamente e certifique-se de clicar em "Permitir"</li>
                      <li>Verifique se o usuário tem permissões de admin no Google Workspace</li>
                      <li>Revogue o acesso em myaccount.google.com e tente novamente</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="error-4">
                  <AccordionTrigger>
                    <span className="text-red-500">Error: insufficient_permissions</span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>Causa:</strong> Os escopos OAuth configurados não incluem as permissões necessárias.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Solução:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-sm ml-4">
                      <li>Volte ao Google Cloud Console</li>
                      <li>Em OAuth consent screen, adicione os escopos:
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>https://www.googleapis.com/auth/admin.directory.user.readonly</li>
                          <li>https://www.googleapis.com/auth/admin.directory.group.readonly</li>
                        </ul>
                      </li>
                      <li>Salve e tente conectar novamente</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AWS Guide */}
        <TabsContent value="aws" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guia: AWS</CardTitle>
              <CardDescription>
                Configure a integração com AWS para coletar evidências de S3, IAM e CloudTrail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Pré-requisitos</AlertTitle>
                <AlertDescription>
                  Você precisa ter uma conta AWS com permissões de administrador para criar IAM users e policies.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Badge>1</Badge>
                  <h3 className="font-semibold">Criar IAM User</h3>
                  <p className="text-sm text-muted-foreground ml-6">
                    Crie um novo usuário IAM apenas para integração com APOC
                  </p>
                </div>

                <div className="space-y-2">
                  <Badge>2</Badge>
                  <h3 className="font-semibold">Configurar Permissões</h3>
                  <p className="text-sm text-muted-foreground ml-6">
                    Anexe as policies: ReadOnlyAccess ou personalize com S3:ListBucket, IAM:ListUsers
                  </p>
                </div>

                <div className="space-y-2">
                  <Badge>3</Badge>
                  <h3 className="font-semibold">Gerar Access Keys</h3>
                  <p className="text-sm text-muted-foreground ml-6">
                    Crie access keys e adicione na aba "🔐 Secrets"
                  </p>
                </div>
              </div>

              <Button variant="outline" className="w-full" asChild>
                <a href="https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html" target="_blank">
                  Ver documentação completa da AWS
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Azure Guide */}
        <TabsContent value="azure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guia: Azure</CardTitle>
              <CardDescription>
                Configure a integração com Microsoft Azure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Guia detalhado em desenvolvimento. Consulte a documentação oficial da Azure.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://docs.microsoft.com/azure" target="_blank">
                  Ver documentação da Azure
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Okta Guide */}
        <TabsContent value="okta" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guia: Okta</CardTitle>
              <CardDescription>
                Configure a integração com Okta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Guia detalhado em desenvolvimento. Consulte a documentação oficial do Okta.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://developer.okta.com/docs/" target="_blank">
                  Ver documentação do Okta
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Precisa de Ajuda?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/docs/OAUTH_FLOW_DOCUMENTATION.md" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação Técnica Completa
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/docs/INTEGRATION_API_REFERENCE.md" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Referência da API
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href="/docs/WEBHOOK_DOCUMENTATION.md" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentação de Webhooks
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntegrationOnboarding;
