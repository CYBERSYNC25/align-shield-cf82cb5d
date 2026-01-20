import { Badge } from "@/components/ui/badge";
import { Zap, Database, Shield } from "lucide-react";
import { EVIDENCE_CONTROL_MAP } from "@/lib/evidence-control-map";

interface IntegrationPopoverProps {
  integration: {
    id: string;
    name: string;
    description: string;
    category: string;
    logo?: string;
  };
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  cloud: { label: 'Cloud', icon: '☁️' },
  iam: { label: 'IAM', icon: '🔐' },
  sdlc: { label: 'SDLC', icon: '🔄' },
  security: { label: 'Security', icon: '🛡️' },
  productivity: { label: 'Productivity', icon: '📊' },
  observability: { label: 'Observability', icon: '👁️' },
};

const getResourceTypesForIntegration = (integrationId: string): string[] => {
  const rules = EVIDENCE_CONTROL_MAP.filter(r => r.integrationId === integrationId);
  return [...new Set(rules.map(r => r.resourceType))];
};

const getControlsForIntegration = (integrationId: string): string[] => {
  const rules = EVIDENCE_CONTROL_MAP.filter(r => r.integrationId === integrationId);
  return [...new Set(rules.flatMap(r => r.controlCodes))];
};

export const IntegrationPopover = ({ integration }: IntegrationPopoverProps) => {
  const resourceTypes = getResourceTypesForIntegration(integration.id);
  const controls = getControlsForIntegration(integration.id);
  const categoryInfo = CATEGORY_LABELS[integration.category] || { label: integration.category, icon: '📦' };

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex items-start gap-3">
        {integration.logo ? (
          <img src={integration.logo} alt={integration.name} className="w-10 h-10 rounded-lg" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">{categoryInfo.icon}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground">{integration.name}</h4>
          <Badge variant="secondary" className="text-xs mt-1">
            {categoryInfo.icon} {categoryInfo.label}
          </Badge>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {integration.description}
      </p>

      {/* Resources Collected */}
      {resourceTypes.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Database className="h-3 w-3" />
            RECURSOS COLETADOS
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {resourceTypes.map((type) => (
              <Badge key={type} variant="outline" className="text-xs capitalize">
                {type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Controls Mapped */}
      {controls.length > 0 && (
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
            <Shield className="h-3 w-3" />
            CONTROLES MAPEADOS
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {controls.slice(0, 5).map((code) => (
              <Badge key={code} className="text-xs bg-primary/10 text-primary border-0">
                {code}
              </Badge>
            ))}
            {controls.length > 5 && (
              <Badge variant="secondary" className="text-xs">
                +{controls.length - 5} mais
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-primary" />
          <span className="font-medium text-foreground">{controls.length}</span> controles
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Database className="h-3 w-3 text-primary" />
          <span className="font-medium text-foreground">{resourceTypes.length}</span> recursos
        </div>
      </div>
    </div>
  );
};
