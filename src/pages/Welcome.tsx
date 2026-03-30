import { Link } from "react-router-dom";
import { Network, ShieldCheck, FileCheck2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Welcome = () => {
  const features = [
    {
      icon: Network,
      title: "Integração Real",
      description: "Conecte AWS, Azure, Google Workspace e até MikroTik para coletar evidências reais"
    },
    {
      icon: ShieldCheck,
      title: "Gestão Completa de GRC",
      description: "Controles, riscos, auditorias, incidentes e políticas em uma única plataforma"
    },
    {
      icon: FileCheck2,
      title: "Pronto para Auditar",
      description: "Gere relatórios de conformidade com um clique — aceitos por auditores e reguladores"
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="text-primary">Compliance Sync</span>
            </h1>
          </div>

          {/* Tagline */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight">
            GRC enterprise para empresas que levam{" "}
            <span className="text-primary">compliance a sério</span>
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatize frameworks como LGPD, ISO 27001 e SOC 2 com integração direta à sua infraestrutura
          </p>

          {/* CTA Button */}
          <div className="pt-4">
            <Button asChild size="lg" className="gap-2 text-base px-8 py-6">
              <Link to="/auth">
                Criar conta
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-20 md:mt-28 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="bg-card/50 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <CardContent className="pt-6 pb-6 px-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 APOC. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="hover:text-foreground cursor-pointer transition-colors">LGPD</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">ISO 27001</span>
            <span className="hover:text-foreground cursor-pointer transition-colors">SOC 2</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
