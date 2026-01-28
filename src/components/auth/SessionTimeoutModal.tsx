/**
 * Session Timeout Warning Modal
 * 
 * Shows a countdown when user session is about to expire.
 * Allows user to continue session or logout.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionTimeoutModalProps {
  open: boolean;
  timeRemaining: number; // in seconds
  onContinue: () => void;
  onLogout: () => void;
}

export function SessionTimeoutModal({
  open,
  timeRemaining,
  onContinue,
  onLogout,
}: SessionTimeoutModalProps) {
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine urgency level for styling
  const isUrgent = timeRemaining <= 60;
  const isCritical = timeRemaining <= 30;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-[420px]" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock className={cn(
              "h-5 w-5",
              isCritical ? "text-destructive" : isUrgent ? "text-orange-500" : "text-yellow-500"
            )} />
            Sessão Expirando
          </DialogTitle>
          <DialogDescription className="pt-2">
            Sua sessão expirará em breve por inatividade.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          {/* Countdown Timer */}
          <div className={cn(
            "text-5xl font-mono font-bold tabular-nums",
            isCritical ? "text-destructive" : isUrgent ? "text-orange-500" : "text-foreground"
          )}>
            {formatTime(timeRemaining)}
          </div>
          
          {/* Progress indicator */}
          <div className="w-full mt-4 bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000",
                isCritical ? "bg-destructive" : isUrgent ? "bg-orange-500" : "bg-yellow-500"
              )}
              style={{ 
                width: `${(timeRemaining / 300) * 100}%`, // 300 = 5 minutes
                transition: 'width 1s linear'
              }}
            />
          </div>

          <p className="text-sm text-muted-foreground mt-4 text-center">
            Deseja continuar conectado?
          </p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex-1 sm:flex-none"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
          <Button 
            onClick={onContinue}
            className="flex-1 sm:flex-none"
            autoFocus
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
