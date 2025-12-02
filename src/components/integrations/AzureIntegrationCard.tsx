import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Cloud } from 'lucide-react';
import { AzureConnectionStatus } from './AzureConnectionStatus';
import { formatRelativeTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AzureIntegrationCardProps {
  isConnected?: boolean;
  lastSync?: Date | null;
}

export const AzureIntegrationCard = ({ isConnected = false, lastSync = null }: AzureIntegrationCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isConnected) {
    return (
      <>
        <Card className="transition-all duration-200 border-green-500/50 ring-1 ring-green-500/20 shadow-lg hover:shadow-xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-lg bg-green-500/10 text-green-600">
                <Cloud className="h-8 w-8" />
              </div>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                Conectado
              </Badge>
            </div>
            <CardTitle className="mt-4">Azure AD / Entra ID</CardTitle>
            <CardDescription>
              Integração com Microsoft Azure Active Directory
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(true)}>
              Gerenciar
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Última sync: {formatRelativeTime(lastSync)}
            </p>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Azure AD - Status da Conexão</DialogTitle>
              <DialogDescription>
                Gerencie e teste sua conexão com Azure Active Directory
              </DialogDescription>
            </DialogHeader>
            <AzureConnectionStatus />
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
              <Cloud className="h-8 w-8" />
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Disponível
            </Badge>
          </div>
          <CardTitle className="mt-4">Azure AD / Entra ID</CardTitle>
          <CardDescription>
            Integração com Microsoft Azure Active Directory
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Azure AD - Status da Conexão</DialogTitle>
            <DialogDescription>
              Gerencie e teste sua conexão com Azure Active Directory
            </DialogDescription>
          </DialogHeader>
          <AzureConnectionStatus />
        </DialogContent>
      </Dialog>
    </>
  );
};
