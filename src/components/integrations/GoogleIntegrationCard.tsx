import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HardDrive, Eye, Settings } from 'lucide-react';
import { GoogleOAuthValidator } from './GoogleOAuthValidator';
import { GoogleWorkspaceResourcesModal } from './GoogleWorkspaceResourcesModal';
import { formatRelativeTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GoogleIntegrationCardProps {
  isConnected?: boolean;
  lastSync?: Date | null;
}

export const GoogleIntegrationCard = ({ isConnected = false, lastSync = null }: GoogleIntegrationCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false);

  if (isConnected) {
    return (
      <>
        <Card className="transition-all duration-200 border-green-500/50 ring-1 ring-green-500/20 shadow-lg hover:shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                <HardDrive className="h-8 w-8" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                Conectado
              </Badge>
            </div>
            <CardTitle className="mt-4">Google Workspace</CardTitle>
            <CardDescription>
              Integração OAuth 2.0 para coleta de usuários e permissões
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            <div className="flex gap-2">
              <Button 
                variant="default" 
                className="flex-1 gap-2" 
                onClick={() => setIsResourcesModalOpen(true)}
              >
                <Eye className="h-4 w-4" />
                Ver Recursos
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setIsModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Última sync: {formatRelativeTime(lastSync)}
            </p>
          </CardContent>
        </Card>

        <GoogleWorkspaceResourcesModal 
          open={isResourcesModalOpen} 
          onOpenChange={setIsResourcesModalOpen} 
        />

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Google Workspace - Validação OAuth</DialogTitle>
              <DialogDescription>
                Verificação completa da configuração de integração
              </DialogDescription>
            </DialogHeader>
            <GoogleOAuthValidator />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className="transition-all duration-200 border-primary/50 shadow-md hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <HardDrive className="h-8 w-8" />
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Disponível
            </Badge>
          </div>
          <CardTitle className="mt-4">Google Workspace</CardTitle>
          <CardDescription>
            Integração OAuth 2.0 para coleta de usuários e permissões
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          <Button className="w-full" onClick={() => setIsModalOpen(true)}>
            Conectar
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Configure via OAuth 2.0
          </p>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Google Workspace - Validação OAuth</DialogTitle>
            <DialogDescription>
              Verificação completa da configuração de integração
            </DialogDescription>
          </DialogHeader>
          <GoogleOAuthValidator />
        </DialogContent>
      </Dialog>
    </>
  );
};
