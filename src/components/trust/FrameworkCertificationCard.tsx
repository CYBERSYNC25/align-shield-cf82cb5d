import { Shield, ExternalLink, Award, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FrameworkCertificationCardProps {
  name: string;
  displayName?: string | null;
  certificationDate: string | null;
  certificateUrl: string | null;
  complianceScore: number | null;
  passedControls: number | null;
  totalControls: number | null;
  primaryColor?: string;
}

const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
  if (score >= 80) return "default";
  if (score >= 60) return "secondary";
  return "destructive";
};

export const FrameworkCertificationCard = ({
  name,
  displayName,
  certificationDate,
  certificateUrl,
  complianceScore,
  passedControls,
  totalControls,
  primaryColor,
}: FrameworkCertificationCardProps) => {
  const score = complianceScore ?? 0;
  const passed = passedControls ?? 0;
  const total = totalControls ?? 0;
  const progress = total > 0 ? (passed / total) * 100 : 0;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg"
              style={{ 
                backgroundColor: primaryColor ? `${primaryColor}20` : 'hsl(var(--primary) / 0.1)',
              }}
            >
              <Shield 
                className="h-6 w-6" 
                style={{ color: primaryColor || 'hsl(var(--primary))' }}
              />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {displayName || name}
              </h3>
              {displayName && displayName !== name && (
                <p className="text-xs text-muted-foreground">{name}</p>
              )}
            </div>
          </div>
          <Badge variant={getScoreBadgeVariant(score)}>
            {score}%
          </Badge>
        </div>

        {/* Certification date */}
        {certificationDate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span>
              Certificado em {format(new Date(certificationDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {/* Controls progress */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Controles implementados</span>
            <span className="font-medium text-foreground">{passed}/{total}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Certificate link */}
        {certificateUrl && (
          <a
            href={certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
            style={{ color: primaryColor || 'hsl(var(--primary))' }}
          >
            <Award className="h-4 w-4" />
            Ver Certificado
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
};
