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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
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
    }),
});

type AwsConnectionFormData = z.infer<typeof awsConnectionSchema>;

interface ConnectAwsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ConnectAwsModal = ({ open, onOpenChange, onSuccess }: ConnectAwsModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
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

    try {
      // Obter usuário autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
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
          status: 'active',
          last_sync_at: null,
        })
        .select()
        .single();

      if (insertError || !insertedIntegration) {
        throw insertError || new Error('Erro ao salvar integração');
      }

      // Testar a conexão chamando a edge function
      const { data: testResult, error: testError } = await supabase.functions.invoke(
        'aws-test-connection',
        {
          body: { integration_id: insertedIntegration.id }
        }
      );

      if (testError) {
        console.error('Erro ao testar conexão:', testError);
        toast({
          title: 'Integração salva com aviso',
          description: `${data.name} foi salva, mas não foi possível validar a conexão. Teste manualmente depois.`,
          variant: 'default',
        });
      } else if (!testResult?.success) {
        // Teste falhou
        toast({
          title: 'Conexão AWS não validada',
          description: testResult?.error || 'Não foi possível conectar à AWS com as credenciais fornecidas.',
          variant: 'destructive',
        });
        
        // Mesmo com erro, a integração foi salva
        toast({
          title: 'Integração salva',
          description: `${data.name} foi salva. Verifique as credenciais e tente novamente.`,
        });
      } else {
        // Sucesso total!
        toast({
          title: 'Integração AWS validada com sucesso! ✓',
          description: `${data.name} foi configurada e testada. ${testResult.user_count || 0} usuários IAM encontrados.`,
          variant: 'default',
        });
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao conectar AWS:', error);
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
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Conectar conta AWS</DialogTitle>
          <DialogDescription>
            Configure a conexão com sua conta AWS usando Cross-Account Role
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
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
              className={errors.name ? 'border-danger focus-visible:ring-danger' : ''}
            />
            {errors.name && (
              <div className="flex items-center gap-2 text-sm text-danger">
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
              className={errors.roleArn ? 'border-danger focus-visible:ring-danger' : ''}
            />
            {errors.roleArn && (
              <div className="flex items-center gap-2 text-sm text-danger">
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
