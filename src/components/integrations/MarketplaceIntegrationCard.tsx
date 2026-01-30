import { useState } from "react";
import { Zap, ExternalLink, Check, Settings, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { motion } from "framer-motion";
import { IntegrationPopover } from "./IntegrationPopover";
import { getIntegrationFrameworks, getIntegrationControlsCount } from "@/lib/integrations-catalog";

interface MarketplaceIntegrationCardProps {
  integration: {
    id: string;
    name: string;
    description: string;
    category: string;
    logo?: string | null;
    isNew?: boolean;
    isBeta?: boolean;
  };
  isConnected: boolean;
  onConnect: () => void;
  onManage?: () => void;
  disabled?: boolean;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  cloud: { label: 'Cloud', icon: '☁️', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  iam: { label: 'IAM', icon: '🔐', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  sdlc: { label: 'SDLC', icon: '🔄', color: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  security: { label: 'Security', icon: '🛡️', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  productivity: { label: 'Productivity', icon: '📊', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  observability: { label: 'Observability', icon: '👁️', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
};

const FRAMEWORK_BADGE_CONFIG: Record<string, { color: string }> = {
  'ISO 27001': { color: 'border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/5' },
  'SOC 2': { color: 'border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-500/5' },
  'LGPD': { color: 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/5' },
};

export const MarketplaceIntegrationCard = ({
  integration,
  isConnected,
  onConnect,
  onManage,
  disabled = false,
}: MarketplaceIntegrationCardProps) => {
  const [logoError, setLogoError] = useState(false);
  const categoryConfig = CATEGORY_CONFIG[integration.category] || { 
    label: integration.category, 
    icon: '📦', 
    color: 'bg-muted text-muted-foreground' 
  };
  const controlsCount = getIntegrationControlsCount(integration.id);
  const frameworks = getIntegrationFrameworks(integration.id);

  const renderLogo = () => {
    // Manual entry uses icon instead of logo
    if (integration.id === 'manual-entry' || !integration.logo) {
      return (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload className="h-7 w-7 text-primary" />
        </div>
      );
    }

    // Logo failed to load, show fallback
    if (logoError) {
      return (
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
          <span className="text-3xl">{categoryConfig.icon}</span>
        </div>
      );
    }

    // Normal logo rendering
    return (
      <div className="w-14 h-14 rounded-xl bg-background border border-border/50 flex items-center justify-center p-2 group-hover:border-primary/30 transition-colors">
        <img 
          src={integration.logo} 
          alt={integration.name} 
          className="w-full h-full object-contain"
          onError={() => setLogoError(true)}
        />
      </div>
    );
  };

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <motion.div
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Card 
            className={`
              h-full cursor-pointer group relative overflow-hidden
              border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5
              transition-all duration-300
              ${disabled ? 'opacity-60 pointer-events-none' : ''}
              ${isConnected ? 'bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/30' : ''}
            `}
          >
            {/* Connected indicator */}
            {isConnected && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <Check className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-500">Conectado</span>
                </div>
              </div>
            )}

            {/* New/Beta badges */}
            {(integration.isNew || integration.isBeta) && !isConnected && (
              <div className="absolute top-3 right-3">
                {integration.isNew && (
                  <Badge className="bg-primary text-primary-foreground text-xs">
                    Novo
                  </Badge>
                )}
                {integration.isBeta && (
                  <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600 dark:text-yellow-400">
                    Beta
                  </Badge>
                )}
              </div>
            )}

            <CardContent className="p-6">
              {/* Logo */}
              <div className="mb-4">
                {renderLogo()}
              </div>

              {/* Name & Category */}
              <div className="mb-3">
                <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                  {integration.name}
                </h3>
                <Badge 
                  variant="secondary" 
                  className={`mt-2 text-xs ${categoryConfig.color}`}
                >
                  {categoryConfig.icon} {categoryConfig.label}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">
                {integration.description}
              </p>

              {/* Framework Badges */}
              {frameworks.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {frameworks.map(fw => (
                    <Badge 
                      key={fw} 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${FRAMEWORK_BADGE_CONFIG[fw]?.color || ''}`}
                    >
                      {fw}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Controls Count */}
              {controlsCount > 0 && (
                <div className="flex items-center gap-2 text-sm mb-4">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">{controlsCount}</span> controles automatizados
                  </span>
                </div>
              )}

              {/* Action Button */}
              <Button 
                variant={isConnected ? "outline" : "default"}
                className="w-full group-hover:shadow-md transition-shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  if (isConnected && onManage) {
                    onManage();
                  } else {
                    onConnect();
                  }
                }}
                disabled={disabled}
              >
                {isConnected ? (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </>
                ) : (
                  <>
                    Conectar
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </HoverCardTrigger>

      <HoverCardContent 
        side="right" 
        align="start" 
        className="w-80"
        sideOffset={8}
      >
        <IntegrationPopover integration={integration} />
      </HoverCardContent>
    </HoverCard>
  );
};
