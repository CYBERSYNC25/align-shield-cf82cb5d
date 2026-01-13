import AuditorPortalHeader from '@/components/auditor/AuditorPortalHeader';
import AuditorComplianceSummary from '@/components/auditor/AuditorComplianceSummary';
import AuditorAssetInventory from '@/components/auditor/AuditorAssetInventory';
import AuditorEvidenceRepository from '@/components/auditor/AuditorEvidenceRepository';
import AuditReportExportButton from '@/components/auditor/AuditReportExportButton';
import { AuditorVerificationHistory } from '@/components/auditor/AuditorVerificationHistory';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Calendar, Clock } from 'lucide-react';
import { useParams } from 'react-router-dom';

const AuditorPortalPage = () => {
  const { auditId } = useParams();
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simplified Header - No Sidebar */}
      <AuditorPortalHeader />
      
      {/* Main Content - Full Width, No Sidebar */}
      <main className="flex-1 pt-16">
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
          
          {/* Welcome Banner */}
          <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">
                      Portal de Transparência
                    </h1>
                  </div>
                  <p className="text-muted-foreground max-w-xl">
                    Bem-vindo ao portal de auditoria da APOC. Aqui você pode validar todas as evidências 
                    de compliance em tempo real. Este é um ambiente de <strong>somente leitura</strong>.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {currentDate}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {currentTime}
                  </Badge>
                  {auditId && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      ID: {auditId.slice(0, 8)}...
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Dashboard */}
          <AuditorComplianceSummary />

          <Separator />

          {/* Two Column Layout for Inventory and Evidence */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Asset Inventory */}
            <AuditorAssetInventory />
            
            {/* Evidence Repository */}
            <AuditorEvidenceRepository />
          </div>

          <Separator />

          {/* Verification History - Proof of automated monitoring */}
          <AuditorVerificationHistory />

          <Separator />
          <Card className="bg-surface-elevated border-card-border">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Exportar Relatório Completo
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gere um relatório detalhado com o status de compliance, inventário de ativos 
                    e lista de controles para documentação de auditoria.
                  </p>
                </div>
                <div className="w-full md:w-auto md:min-w-[280px]">
                  <AuditReportExportButton />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer Notice */}
          <div className="text-center py-6 text-sm text-muted-foreground">
            <p>
              Este portal é uma visão somente-leitura do estado de compliance da organização.
            </p>
            <p className="mt-1">
              © {new Date().getFullYear()} APOC - Automated Platform for Online Compliance
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AuditorPortalPage;
