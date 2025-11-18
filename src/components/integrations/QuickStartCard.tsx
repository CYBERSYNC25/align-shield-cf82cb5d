import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Rocket, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';

export const QuickStartCard = () => {
  const { hasCompleted, startTour, resetTour } = useOnboardingTour();

  const quickTips = [
    'Escolha integrações na aba Catálogo',
    'Configure OAuth em poucos cliques',
    'Teste conexões antes de usar',
    'Monitore webhooks em tempo real',
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Início Rápido</CardTitle>
          </div>
          {hasCompleted && (
            <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
              <CheckCircle2 className="h-3 w-3" />
              Completo
            </Badge>
          )}
        </div>
        <CardDescription>
          {hasCompleted 
            ? 'Já conhece o Hub? Revise o tour quando precisar.'
            : 'Primeira vez aqui? Veja um tour rápido das funcionalidades.'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Tips */}
        <div className="space-y-2">
          {quickTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{tip}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-2 pt-2">
          {hasCompleted ? (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={resetTour}
              >
                <Rocket className="h-4 w-4" />
                Refazer Tour
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                asChild
              >
                <a 
                  href="https://docs.complice.app/integrations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <BookOpen className="h-4 w-4" />
                  Ver Documentação
                </a>
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={startTour}
              >
                <Rocket className="h-4 w-4" />
                Iniciar Tour
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                asChild
              >
                <a 
                  href="https://docs.complice.app/integrations" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <HelpCircle className="h-4 w-4" />
                  Ajuda
                </a>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
