/**
 * Manage Sessions Modal
 * 
 * Displays active user sessions with device info, location, and activity.
 * Allows revoking individual sessions or all other sessions.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Monitor, Smartphone, Tablet, Globe, MapPin, LogOut, AlertCircle, RefreshCw } from 'lucide-react';
import { 
  useUserSessions, 
  useRevokeSession, 
  useRevokeAllOtherSessions,
  useCurrentSessionId,
  formatLastActive,
  formatSessionLocation,
  type UserSession
} from '@/hooks/useUserSessions';

interface ManageSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ManageSessionsModal = ({ open, onOpenChange }: ManageSessionsModalProps) => {
  const { data: sessions, isLoading, error, refetch } = useUserSessions();
  const revokeSession = useRevokeSession();
  const revokeAllOthers = useRevokeAllOtherSessions();
  const currentSessionId = useCurrentSessionId();

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    revokeSession.mutate({ sessionId, reason: 'manual' });
  };

  const handleTerminateAllOther = () => {
    if (currentSessionId) {
      revokeAllOthers.mutate(currentSessionId);
    }
  };

  const otherSessionsCount = sessions?.filter(s => !s.is_current).length || 0;

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
          {/* Header with count and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  `${sessions?.length || 0} ${sessions?.length === 1 ? 'sessão ativa' : 'sessões ativas'}`
                )}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {otherSessionsCount > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleTerminateAllOther}
                disabled={revokeAllOthers.isPending}
              >
                Encerrar outras sessões
              </Button>
            )}
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              Erro ao carregar sessões. Tente novamente.
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Sessions list */}
          {!isLoading && sessions && (
            <div className="space-y-3">
              {sessions.map((session: UserSession) => (
                <Card 
                  key={session.id} 
                  className={`border-2 ${session.is_current ? 'border-primary/50 bg-primary/5' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getDeviceIcon(session.device_type)}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{session.device_info}</span>
                            {session.is_current && (
                              <Badge variant="secondary" className="text-xs">
                                Atual
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            {session.browser && (
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {session.browser} {session.browser_version}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {formatSessionLocation(session.city, session.country)}
                            </div>
                            <div>Última atividade: {formatLastActive(session.last_active_at)}</div>
                          </div>
                        </div>
                      </div>

                      {!session.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTerminateSession(session.id)}
                          disabled={revokeSession.isPending}
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
          )}

          {/* Empty state */}
          {!isLoading && sessions?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma sessão ativa encontrada</p>
            </div>
          )}

          <Separator />

          {/* Security tip */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Dica de segurança:</strong> Se você vir sessões que não reconhece, 
              encerre-as imediatamente e considere alterar sua senha e habilitar a autenticação 
              de dois fatores (MFA).
            </p>
          </div>

          {/* Session limits info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Máximo de 5 sessões simultâneas por usuário</p>
            <p>• Sessões expiram após 30 dias de inatividade</p>
            <p>• Logout automático após 30 minutos sem atividade</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
