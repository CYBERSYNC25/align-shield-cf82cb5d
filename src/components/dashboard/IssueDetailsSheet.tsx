import { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw, 
  ShieldAlert,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ComplianceTest } from '@/hooks/useComplianceStatus';
import { getRemediationGuide } from '@/lib/remediation-guides';
import { AcceptRiskModal } from './AcceptRiskModal';

interface IssueDetailsSheetProps {
  test: ComplianceTest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INTEGRATION_LOGOS: Record<string, string> = {
  github: '🐙',
  cloudflare: '🌐',
  slack: '💬',
  google: '🔵',
  intune: '💻',
  aws: '☁️',
  auth0: '🔐',
  okta: '🔑',
  azure: '☁️',
};

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        label: 'Crítico',
        badgeVariant: 'destructive' as const
      };
    case 'high':
      return {
        icon: AlertTriangle,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        label: 'Alto',
        badgeVariant: 'default' as const
      };
    default:
      return {
        icon: ShieldAlert,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        label: 'Médio',
        badgeVariant: 'secondary' as const
      };
  }
}

export function IssueDetailsSheet({ test, open, onOpenChange }: IssueDetailsSheetProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAcceptRiskModal, setShowAcceptRiskModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!test) return null;

  const severityConfig = getSeverityConfig(test.severity);
  const SeverityIcon = severityConfig.icon;
  const guide = getRemediationGuide(test.id);
  const integrationLogo = INTEGRATION_LOGOS[test.integration.toLowerCase()] || '🔧';

  const handleVerifyFix = async () => {
    setIsVerifying(true);
    
    try {
      // Call sync function for the integration
      const { error } = await supabase.functions.invoke('sync-integration-data', {
        body: { integration: test.integration.toLowerCase() }
      });

      if (error) {
        throw error;
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['integration-data'] });
      await queryClient.invalidateQueries({ queryKey: ['integration-data-stats'] });

      toast({
        title: 'Verificação iniciada',
        description: 'Os dados estão sendo atualizados. O status será refletido em instantes.',
      });

      // Close sheet after successful verification
      setTimeout(() => {
        onOpenChange(false);
      }, 1500);

    } catch (error) {
      console.error('Error verifying fix:', error);
      toast({
        title: 'Erro na verificação',
        description: 'Não foi possível sincronizar os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAcceptRiskSuccess = () => {
    onOpenChange(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${severityConfig.bgColor}`}>
                  <SeverityIcon className={`h-5 w-5 ${severityConfig.color}`} />
                </div>
                <div>
                  <SheetTitle className="text-left">{test.title}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={severityConfig.badgeVariant}>
                      {severityConfig.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      {integrationLogo} {test.integration}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <SheetDescription className="text-left">
              {test.description}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {/* How to Fix Section */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Como Corrigir
                </h3>
                <div className={`rounded-lg border p-4 ${severityConfig.bgColor} ${severityConfig.borderColor}`}>
                  <ol className="space-y-2 text-sm">
                    {guide.steps.map((step, index) => (
                      <li key={index} className="flex gap-2">
                        <span className={`font-semibold ${severityConfig.color}`}>
                          {index + 1}.
                        </span>
                        <span className="text-foreground">{step}</span>
                      </li>
                    ))}
                  </ol>
                  
                  {guide.estimatedTime && (
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Tempo estimado: {guide.estimatedTime}</span>
                    </div>
                  )}
                </div>

                {guide.externalLink && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    asChild
                  >
                    <a 
                      href={guide.externalLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {guide.linkLabel || 'Abrir Console Externo'}
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                )}
              </div>

              <Separator />

              {/* Affected Resources Section */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-primary" />
                  Recursos Afetados ({test.affectedResources})
                </h3>
                
                {test.affectedItems && test.affectedItems.length > 0 ? (
                  <div className="space-y-2">
                    {test.affectedItems.slice(0, 10).map((item, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <span className="text-lg">{integrationLogo}</span>
                        <span className="font-mono text-xs flex-1 truncate">
                          {item}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                    {test.affectedItems.length > 10 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{test.affectedItems.length - 10} recursos adicionais
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {test.affectedResources} recurso(s) afetado(s)
                  </p>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="border-t pt-4 space-y-2">
            <Button 
              className="w-full"
              onClick={handleVerifyFix}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Verificar Correção
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
              onClick={() => setShowAcceptRiskModal(true)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Aceitar Risco / Criar Exceção
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AcceptRiskModal
        test={test}
        open={showAcceptRiskModal}
        onOpenChange={setShowAcceptRiskModal}
        onSuccess={handleAcceptRiskSuccess}
      />
    </>
  );
}
