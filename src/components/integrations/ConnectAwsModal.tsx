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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

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
  const { toast } = useToast();

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
      // Aqui virá a integração com Supabase
      console.log('Dados da conexão AWS:', data);

      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast({
        title: 'Conexão AWS configurada!',
        description: `${data.name} foi conectada com sucesso.`,
        variant: 'default',
      });

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao conectar AWS:', error);
      toast({
        title: 'Erro ao conectar',
        description: 'Não foi possível estabelecer conexão com a AWS.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
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

          {/* Info Card */}
          <div className="rounded-lg bg-muted/50 p-4 border border-border">
            <h4 className="text-sm font-medium mb-2">ℹ️ Como obter o Role ARN?</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Acesse o Console AWS IAM</li>
              <li>Vá em Roles → Criar nova role</li>
              <li>Selecione "Another AWS account"</li>
              <li>Copie o ARN gerado após criação</li>
            </ol>
          </div>

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
