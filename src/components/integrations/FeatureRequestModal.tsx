import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle2, Sparkles } from "lucide-react";
import { IntegrationDefinition } from "@/lib/integrations-catalog";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface FeatureRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: IntegrationDefinition | null;
}

const STORAGE_KEY = 'apoc-integration-requests';

export function FeatureRequestModal({ 
  open, 
  onOpenChange, 
  integration 
}: FeatureRequestModalProps) {
  const [hasRequested, setHasRequested] = useState(false);

  useEffect(() => {
    if (integration) {
      const requests = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setHasRequested(requests.includes(integration.id));
    }
  }, [integration]);

  const handleRequest = () => {
    if (!integration) return;

    const requests = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!requests.includes(integration.id)) {
      requests.push(integration.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    }
    
    setHasRequested(true);
    toast({
      title: "Solicitação registrada!",
      description: `Você será notificado quando ${integration.name} estiver disponível.`,
    });
    
    setTimeout(() => onOpenChange(false), 1500);
  };

  if (!integration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden p-2">
              <img 
                src={integration.logo} 
                alt={`${integration.name} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
            <div>
              <DialogTitle className="text-left">{integration.name}</DialogTitle>
              <Badge variant="secondary" className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                Em Desenvolvimento
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-left pt-2">
            Esta integração está em desenvolvimento e estará disponível em breve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              O que será auditado:
            </h4>
            <p className="text-sm text-muted-foreground">
              {integration.description}
            </p>
          </div>

          {hasRequested ? (
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 rounded-lg p-3">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                Você já solicitou acesso a esta integração
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Clique abaixo para ser notificado quando esta integração estiver disponível.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {!hasRequested && (
            <Button onClick={handleRequest}>
              <Bell className="h-4 w-4 mr-2" />
              Notificar-me
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
