import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Monitor, Smartphone, Globe, MapPin, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  lastActive: string;
  current: boolean;
  deviceType: 'desktop' | 'mobile' | 'web';
}

interface ManageSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageSessionsModal = ({ open, onOpenChange }: ManageSessionsModalProps) => {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows PC',
      browser: 'Chrome 118.0',
      location: 'São Paulo, Brasil',
      lastActive: 'Agora',
      current: true,
      deviceType: 'desktop'
    },
    {
      id: '2',
      device: 'iPhone 14',
      browser: 'Safari Mobile',
      location: 'São Paulo, Brasil',
      lastActive: '2 horas atrás',
      current: false,
      deviceType: 'mobile'
    },
    {
      id: '3',
      device: 'MacBook Pro',
      browser: 'Firefox 119.0',
      location: 'Rio de Janeiro, Brasil',
      lastActive: '1 dia atrás',
      current: false,
      deviceType: 'desktop'
    }
  ]);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'web':
        return <Globe className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    toast({
      title: "Sessão encerrada",
      description: "A sessão foi encerrada com sucesso"
    });
  };

  const handleTerminateAllOther = () => {
    setSessions(prev => prev.filter(session => session.current));
    toast({
      title: "Sessões encerradas",
      description: "Todas as outras sessões foram encerradas"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Gerenciar Sessões Ativas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? 'sessão ativa' : 'sessões ativas'}
            </p>
            {sessions.length > 1 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTerminateAllOther}
              >
                Encerrar outras sessões
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getDeviceIcon(session.deviceType)}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{session.device}</span>
                          {session.current && (
                            <Badge variant="secondary" className="text-xs">
                              Atual
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.browser}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {session.location}
                          </div>
                          <div>Última atividade: {session.lastActive}</div>
                        </div>
                      </div>
                    </div>

                    {!session.current && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTerminateSession(session.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Dica de segurança:</strong> Se você vir sessões que não reconhece, 
              encerre-as imediatamente e considere alterar sua senha.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};