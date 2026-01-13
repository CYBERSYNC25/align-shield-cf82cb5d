import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuditorPortalHeader from '@/components/auditor/AuditorPortalHeader';
import AuditorComplianceSummary from '@/components/auditor/AuditorComplianceSummary';
import AuditorAssetInventory from '@/components/auditor/AuditorAssetInventory';
import AuditorEvidenceRepository from '@/components/auditor/AuditorEvidenceRepository';
import AuditReportExportButton from '@/components/auditor/AuditReportExportButton';
import { AuditorVerificationHistory } from '@/components/auditor/AuditorVerificationHistory';
import { AuditorMTTRCard } from '@/components/auditor/AuditorMTTRCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Calendar, Clock, AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useValidateAuditorToken } from '@/hooks/useAuditorAccess';
import { LoadingSpinner } from '@/components/common';
import { Button } from '@/components/ui/button';

interface TokenPermissions {
  view_evidence?: boolean;
  view_inventory?: boolean;
  view_history?: boolean;
  viewAssets?: boolean;
  viewEvidence?: boolean;
  viewControls?: boolean;
  downloadReports?: boolean;
}

const AuditorPortalPage = () => {
  const { auditId } = useParams();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  
  const validateResult = useValidateAuditorToken(tokenFromUrl || '');
  const tokenData = validateResult.data;
  const isValidating = validateResult.isLoading;
  
  const currentDate = new Date().toLocaleDateString('pt-BR');
  const currentTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Parse permissions from token data (handle both snake_case and camelCase)
  const rawPerms = tokenData?.permissions as TokenPermissions || {};
  const permissions = {
    viewAssets: rawPerms.viewAssets ?? rawPerms.view_inventory ?? true,
    viewEvidence: rawPerms.viewEvidence ?? rawPerms.view_evidence ?? true,
    viewControls: rawPerms.viewControls ?? true,
    downloadReports: rawPerms.downloadReports ?? true,
  };

  // If there's a token in the URL, we need to validate it
  if (tokenFromUrl) {
    // Still validating
    if (isValidating) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-muted-foreground">Validando credenciais de acesso...</p>
          </div>
        </div>
      );
    }

    // Token invalid or expired
    if (!tokenData) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="py-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Acesso Negado</h2>
              <p className="text-muted-foreground">
                O link de acesso é inválido ou expirou. Por favor, solicite um novo link ao administrador.
              </p>
              <div className="pt-4">
                <Button variant="outline" onClick={() => window.close()}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

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
                    {tokenData && (
                      <Badge variant="secondary" className="gap-1 ml-2">
                        <Lock className="h-3 w-3" />
                        Acesso Validado
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground max-w-xl">
                    {tokenData ? (
                      <>
                        Bem-vindo, <strong>{tokenData.auditorName}</strong>
                        {tokenData.companyName && <> da <strong>{tokenData.companyName}</strong></>}. 
                        Este é um ambiente de <strong>somente leitura</strong> para auditoria de compliance.
                      </>
                    ) : (
                      <>
                        Bem-vindo ao portal de auditoria da APOC. Aqui você pode validar todas as evidências 
                        de compliance em tempo real. Este é um ambiente de <strong>somente leitura</strong>.
                      </>
                    )}
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
                  {tokenData?.auditType && (
                    <Badge variant="default" className="capitalize">
                      {tokenData.auditType}
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Token expiration warning */}
              {tokenData?.expiresAt && (
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Link válido até: {new Date(tokenData.expiresAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permissions Notice */}
          {tokenData && (
            <Card className="bg-muted/30">
              <CardContent className="py-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Permissões do Link</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {permissions.viewAssets && (
                    <Badge variant="outline" className="text-xs">Visualizar Ativos</Badge>
                  )}
                  {permissions.viewEvidence && (
                    <Badge variant="outline" className="text-xs">Visualizar Evidências</Badge>
                  )}
                  {permissions.viewControls && (
                    <Badge variant="outline" className="text-xs">Visualizar Controles</Badge>
                  )}
                  {permissions.downloadReports && (
                    <Badge variant="outline" className="text-xs">Baixar Relatórios</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance Dashboard */}
          <AuditorComplianceSummary />

          <Separator />

          {/* Two Column Layout for Inventory and Evidence */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Asset Inventory */}
            {(!tokenData || permissions.viewAssets) && <AuditorAssetInventory />}
            
            {/* Evidence Repository */}
            {(!tokenData || permissions.viewEvidence) && <AuditorEvidenceRepository />}
          </div>

          <Separator />

          {/* Verification History - Proof of automated monitoring */}
          <AuditorVerificationHistory />

          <Separator />

          {/* MTTR Metrics - Proof of response agility */}
          <AuditorMTTRCard />

          <Separator />
          
          {/* Export Report Section */}
          {(!tokenData || permissions.downloadReports) && (
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
          )}

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
