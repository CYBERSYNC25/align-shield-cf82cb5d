import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Copy, Check, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const awsConnectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: 'Nome da conexão é obrigatório' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  roleArn: z
    .string()
    .trim()
    .min(1, { message: 'Role ARN é obrigatório' })
    .refine((val) => val.startsWith('arn:aws:iam::'), {
      message: 'ARN deve começar com arn:aws:iam::',
    })
    .refine((val) => val.includes(':role/'), {
      message: 'ARN deve conter :role/',
    })
    .refine((val) => /^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/.test(val), {
      message: 'Formato de ARN inválido. Use: arn:aws:iam::123456789012:role/NomeDaRole',
    }),
});

type AwsConnectionFormData = z.infer<typeof awsConnectionSchema>;

interface ConnectionError {
  error: string;
  error_code?: string;
  step?: string;
  recommendation?: string;
  details?: string;
  aws_request_id?: string;
}

interface ConnectAwsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ConnectAwsModal = ({ open, onOpenChange, onSuccess }: ConnectAwsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [connectionError, setConnectionError] = useState<ConnectionError | null>(null);
  const { toast } = useToast();

  const policyJson = {
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": ["iam:ListUsers", "s3:ListAllMyBuckets"],
      "Resource": "*"
    }]
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AwsConnectionFormData>({
    resolver: zodResolver(awsConnectionSchema),
  });

  const onSubmit = async (data: AwsConnectionFormData) => {
    setIsLoading(true);
    setConnectionError(null);

    try {
      // Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }

      // Inserir integração no Supabase
      const { data: insertedIntegration, error: insertError } = await supabase
        .from('integrations')
        .insert({
          user_id: user.id,
          provider: 'AWS',
          name: data.name,
          configuration: {
            role_arn: data.roleArn,
          },
          status: 'pending',
          last_sync_at: null,
        })
        .select()
        .single();

      if (insertError || !insertedIntegration) {
        console.error('Erro ao inserir integração:', insertError);
        throw new Error(insertError?.message || 'Erro ao salvar integração no banco de dados');
      }

      console.log('Integração criada, testando conexão...', insertedIntegration.id);

      // Testar a conexão chamando a edge function
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        'aws-test-connection',
        {
          body: { integration_id: insertedIntegration.id }
        }
      );

      console.log('Resultado do teste:', testResult, 'Erro:', testError);

      if (testError) {
        // Erro de comunicação com a Edge Function
        console.error('Erro ao chamar Edge Function:', testError);
        
        setConnectionError({
          error: 'Não foi possível conectar ao servidor de teste',
          error_code: 'EDGE_FUNCTION_ERROR',
          recommendation: 'Verifique sua conexão com a internet e tente novamente.',
          details: testError.message
        });

        // Atualizar status para erro
        await supabase
          .from('integrations')
          .update({ status: 'error' })
          .eq('id', insertedIntegration.id);

        toast({
          title: 'Integração salva com erro',
          description: `${data.name} foi salva, mas a validação falhou. Veja os detalhes abaixo.`,
          variant: 'destructive',
        });
        return;
      }

      if (!testResult?.success) {
        // Teste retornou erro da AWS
        console.error('Teste AWS falhou:', testResult);
        
        setConnectionError({
          error: testResult?.error || 'Erro desconhecido',
          error_code: testResult?.error_code,
          step: testResult?.step,
          recommendation: testResult?.recommendation,
          details: testResult?.details,
          aws_request_id: testResult?.aws_request_id
        });

        toast({
          title: 'Conexão AWS não validada',
          description: 'A integração foi salva, mas houve um erro ao validar. Veja os detalhes abaixo.',
          variant: 'destructive',
        });
        return;
      }

      // Sucesso total!
      const accountId = testResult.accountId || 'N/A';
      const userCount = testResult.user_count || 0;
      
      toast({
        title: 'Integração AWS validada com sucesso!',
        description: `${data.name} foi configurada e testada. Account ID: ${accountId}. ${userCount} usuários IAM encontrados.`,
      });

      reset();
      setConnectionError(null);
      onOpenChange(false);
      onSuccess?.();

    } catch (error: any) {
      console.error('Erro ao conectar AWS:', error);
      
      setConnectionError({
        error: error.message || 'Erro inesperado ao processar a requisição',
        error_code: 'CLIENT_ERROR',
        recommendation: 'Verifique os dados inseridos e tente novamente.'
      });

      toast({
        title: 'Erro ao salvar integração',
        description: error.message || 'Não foi possível salvar a conexão com a AWS.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPolicy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(policyJson, null, 2));
      setIsCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Política JSON copiada para a área de transferência',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      setConnectionError(null);
      onOpenChange(false);
    }
  };

  const getStepLabel = (step?: string): string => {
    const stepLabels: Record<string, string> = {
      'validation': 'Validação de dados',
      'auth': 'Autenticação',
      'server_config': 'Configuração do servidor',
      'fetch_integration': 'Busca da integração',
      'validate_provider': 'Validação do provider',
      'extract_role_arn': 'Extração do Role ARN',
      'validate_arn': 'Validação do ARN',
      'check_system_credentials': 'Verificação de credenciais do sistema',
      'assume_role': 'AssumeRole (STS)',
      'iam_list_users': 'Teste de permissões IAM',
      'server': 'Processamento do servidor'
    };
    return stepLabels[step || ''] || step || 'Desconhecido';
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Conectar conta AWS</DialogTitle>
          <DialogDescription>
            Configure a conexão com sua conta AWS usando Cross-Account Role
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          {/* Alerta de Erro Detalhado */}
          {connectionError && (
            <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">
                Erro na conexão AWS
                {connectionError.error_code && (
                  <span className="ml-2 text-xs font-mono bg-destructive/20 px-2 py-0.5 rounded">
                    {connectionError.error_code}
                  </span>
                )}
              </AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm font-medium">{connectionError.error}</p>
                
                {connectionError.step && (
                  <p className="text-xs text-muted-foreground">
                    <strong>Etapa:</strong> {getStepLabel(connectionError.step)}
                  </p>
                )}
                
                {connectionError.details && (
                  <p className="text-xs font-mono bg-background/50 p-2 rounded border border-border break-all">
                    {connectionError.details}
                  </p>
                )}
                
                {connectionError.recommendation && (
                  <div className="flex items-start gap-2 mt-3 p-2 bg-warning/10 border border-warning/20 rounded">
                    <Info className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-foreground">
                      <strong>Recomendação:</strong> {connectionError.recommendation}
                    </p>
                  </div>
                )}

                {connectionError.aws_request_id && (
                  <p className="text-xs text-muted-foreground">
                    <strong>AWS Request ID:</strong> {connectionError.aws_request_id}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Nome da Conexão */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nome da Conexão
            </Label>
            <Input
              id="name"
              placeholder="Ex: AWS Produção"
              {...register('name')}
              disabled={isLoading}
              className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span>{errors.name.message}</span>
              </div>
            )}
          </div>

          {/* Cross-Account Role ARN */}
          <div className="space-y-2">
            <Label htmlFor="roleArn" className="text-sm font-medium">
              Cross-Account Role ARN
            </Label>
            <Input
              id="roleArn"
              placeholder="arn:aws:iam::123456789012:role/ComplianceRole"
              {...register('roleArn')}
              disabled={isLoading}
              className={errors.roleArn ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.roleArn && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span>{errors.roleArn.message}</span>
              </div>
            )}
            {!errors.roleArn && (
              <p className="text-xs text-muted-foreground">
                Formato: arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
              </p>
            )}
          </div>

          {/* Accordion com Instruções */}
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="instructions" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">📖 Como configurar?</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {/* Passo 1 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Acesse o Console AWS IAM</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Navegue até o serviço IAM no console da AWS
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Crie uma nova Role</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vá em Roles → Create role → Select "Another AWS account"
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Configure a política de permissões</p>
                      <p className="text-xs text-muted-foreground mt-1 mb-3">
                        Crie uma Role com permissão de leitura usando a política JSON abaixo:
                      </p>
                      
                      {/* Code Block */}
                      <div className="relative">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2 h-8 px-2"
                          onClick={handleCopyPolicy}
                        >
                          {isCopied ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto border border-border">
                          <code className="text-foreground">
{JSON.stringify(policyJson, null, 2)}
                          </code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Copie o ARN gerado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Após criar a role, copie o ARN (Amazon Resource Name) e cole no campo "Cross-Account Role ARN" acima
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      5
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Salvar e testar conexão</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique em "Salvar e Testar Conexão" para validar a configuração
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testando conexão...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Salvar e Testar Conexão
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
