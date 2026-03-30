import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Calendar, User, FileCheck, AlertCircle, Sun, Moon, Lock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTheme } from "next-themes";

import { useTrustCenterData } from "@/hooks/useTrustCenterData";
import { ComplianceGaugeChart } from "@/components/trust/ComplianceGaugeChart";
import { FrameworkCertificationCard } from "@/components/trust/FrameworkCertificationCard";
import { ControlsCategoryAccordion } from "@/components/trust/ControlsCategoryAccordion";
import { RequestAccessModal } from "@/components/trust/RequestAccessModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

// Skeleton component for loading state
const TrustCenterSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      {/* Gauge skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-64 w-64 rounded-full" />
      </div>

      {/* Frameworks grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>

      {/* Controls skeleton */}
      <Skeleton className="h-64 w-full rounded-lg" />

      {/* Footer skeleton */}
      <Skeleton className="h-16 w-full rounded-lg" />
    </div>
  </div>
);

// Not Found component
const TrustCenterNotFound = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4 px-4">
      <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Trust Center não encontrado</h1>
      <p className="text-muted-foreground max-w-md">
        O Trust Center que você está procurando não existe ou não está disponível publicamente.
      </p>
      <Link to="/">
        <Button variant="outline" className="mt-4">
          Voltar ao Início
        </Button>
      </Link>
    </div>
  </div>
);

// Theme toggle button
const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-full"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
};

// Main Trust Center content
const TrustCenterContent = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error } = useTrustCenterData(slug);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  // Update SEO meta tags dynamically
  useEffect(() => {
    if (data) {
      // Title
      document.title = data.seo_title || `${data.company_slug} - Trust Center`;

      // Meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        "content",
        data.seo_description || `Visualize o status de compliance de ${data.company_slug}`
      );

      // OG Title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement("meta");
        ogTitle.setAttribute("property", "og:title");
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute("content", data.seo_title || `${data.company_slug} - Trust Center`);

      // OG Description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement("meta");
        ogDesc.setAttribute("property", "og:description");
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute(
        "content",
        data.seo_description || `Visualize o status de compliance de ${data.company_slug}`
      );
    }

    // Cleanup
    return () => {
      document.title = "Compliance Sync - Compliance Platform";
    };
  }, [data]);

  if (isLoading) {
    return <TrustCenterSkeleton />;
  }

  if (error || !data) {
    return <TrustCenterNotFound />;
  }

  const primaryColor = data.primary_color || "hsl(var(--primary))";

  return (
    <div 
      className="min-h-screen bg-background"
      style={{ "--trust-primary": primaryColor } as React.CSSProperties}
    >
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            {data.logo_url ? (
              <img
                src={data.logo_url}
                alt={`${data.company_slug} logo`}
                className="h-12 w-12 md:h-16 md:w-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div 
                className="h-12 w-12 md:h-16 md:w-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <ShieldCheck 
                  className="h-6 w-6 md:h-8 md:w-8" 
                  style={{ color: primaryColor }}
                />
              </div>
            )}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground capitalize">
                {data.company_slug.replace(/-/g, " ")}
              </h1>
              <p className="text-sm text-muted-foreground">Trust Center</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Custom Message */}
        {data.custom_message && (
          <Card className="mb-8 border-border/50">
            <CardContent className="p-4 md:p-6">
              <p className="text-muted-foreground text-sm md:text-base">
                {data.custom_message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Compliance Score */}
        {data.show_score && data.compliance_score !== null && (
          <section className="mb-10 md:mb-12">
            <div className="flex justify-center">
              <ComplianceGaugeChart 
                score={data.compliance_score} 
                primaryColor={primaryColor}
              />
            </div>
          </section>
        )}

        {/* Frameworks Grid */}
        {data.show_frameworks && data.public_frameworks && data.public_frameworks.length > 0 && (
          <section className="mb-10 md:mb-12">
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-4 md:mb-6">
              Frameworks & Certificações
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.public_frameworks.map((framework, index) => (
                <FrameworkCertificationCard
                  key={index}
                  name={framework.name}
                  displayName={framework.display_name}
                  certificationDate={framework.certification_date}
                  certificateUrl={framework.certificate_url}
                  complianceScore={framework.compliance_score}
                  passedControls={framework.passed_controls}
                  totalControls={framework.total_controls}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          </section>
        )}

        {/* Controls Summary */}
        {data.show_controls && data.controls_summary && (
          <section className="mb-10 md:mb-12">
            <ControlsCategoryAccordion 
              controlsSummary={data.controls_summary}
              primaryColor={primaryColor}
            />
          </section>
        )}

        {/* Last Audit */}
        {data.show_last_audit && data.last_audit && (
          <section className="mb-10 md:mb-12">
            <Card className="border-border/50">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <FileCheck 
                      className="h-5 w-5" 
                      style={{ color: primaryColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      Última Auditoria
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-foreground">
                        <span className="text-muted-foreground">Framework:</span>{" "}
                        {data.last_audit.framework}
                      </p>
                      <p className="text-foreground">
                        <span className="text-muted-foreground">Status:</span>{" "}
                        <span className="capitalize">{data.last_audit.status}</span>
                      </p>
                      {data.last_audit.end_date && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(new Date(data.last_audit.end_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                      )}
                      {data.last_audit.auditor && (
                        <p className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3.5 w-3.5" />
                          {data.last_audit.auditor}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Request Access Button */}
        <section className="mb-10 md:mb-12 flex justify-center">
          <Button
            size="lg"
            onClick={() => setRequestModalOpen(true)}
            className="gap-2"
            style={{
              backgroundColor: primaryColor,
              borderColor: primaryColor,
            }}
          >
            <Lock className="h-4 w-4" />
            Solicitar Acesso
          </Button>
        </section>

        {/* Footer */}
        <footer className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            {data.last_updated && (
              <>
                Atualizado em{" "}
                {format(new Date(data.last_updated), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by{" "}
            <a 
              href="https://compliancesync.com.br" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              APOC
            </a>
          </p>
        </footer>

        {/* Request Access Modal */}
        <RequestAccessModal
          companySlug={data.company_slug}
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          primaryColor={primaryColor}
        />
      </div>
    </div>
  );
};

// Wrapper with ThemeProvider for standalone page
const TrustCenter = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="trust-center-theme">
      <TrustCenterContent />
    </ThemeProvider>
  );
};

export default TrustCenter;
