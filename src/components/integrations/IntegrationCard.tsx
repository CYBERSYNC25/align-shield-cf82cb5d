import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Settings, Zap, ExternalLink } from "lucide-react";
import { IntegrationDefinition, IntegrationStatus } from "@/lib/integrations-catalog";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IntegrationCardProps {
  integration: IntegrationDefinition;
  status: IntegrationStatus;
  lastSync?: Date | null;
  onConnect?: () => void;
  onManage?: () => void;
  onViewResources?: () => void;
  onRequestFeature?: () => void;
}

export function IntegrationCard({
  integration,
  status,
  lastSync,
  onConnect,
  onManage,
  onViewResources,
  onRequestFeature,
}: IntegrationCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
        );
      case 'available':
        return (
          <Badge variant="outline" className="text-muted-foreground border-border">
            <Zap className="h-3 w-3 mr-1" />
            Disponível
          </Badge>
        );
      case 'coming_soon':
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Em Breve
          </Badge>
        );
    }
  };

  const renderActions = () => {
    switch (status) {
      case 'connected':
        return (
          <div className="flex gap-2">
            {onViewResources && (
              <Button variant="outline" size="sm" onClick={onViewResources}>
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                Recursos
              </Button>
            )}
            {onManage && (
              <Button variant="ghost" size="sm" onClick={onManage}>
                <Settings className="h-3.5 w-3.5 mr-1" />
                Gerenciar
              </Button>
            )}
          </div>
        );
      case 'available':
        return (
          <Button size="sm" onClick={onConnect} className="w-full">
            <Zap className="h-3.5 w-3.5 mr-1" />
            Conectar
          </Button>
        );
      case 'coming_soon':
        return (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onRequestFeature}
            className="w-full"
          >
            Solicitar Acesso
          </Button>
        );
    }
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border hover:border-primary/30 transition-colors group">
      <CardContent className="p-5 flex flex-col h-full">
        {/* Header with logo and badges */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden p-1.5">
              <img 
                src={integration.logo} 
                alt={`${integration.name} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground text-sm leading-tight">
                  {integration.name}
                </h3>
                {integration.isNew && status === 'coming_soon' && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
                    Novo
                  </Badge>
                )}
              </div>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-2">
          {integration.description}
        </p>

        {/* Last sync info */}
        {status === 'connected' && lastSync && (
          <p className="text-[11px] text-muted-foreground mb-3">
            Última sincronização: {formatDistanceToNow(lastSync, { addSuffix: true, locale: ptBR })}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2 border-t border-border/50">
          {renderActions()}
        </div>
      </CardContent>
    </Card>
  );
}
