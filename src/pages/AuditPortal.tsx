import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import AuditStats from '@/components/audit/AuditStats';
import EvidenceLocker from '@/components/audit/EvidenceLocker';
import FrameworkChecklists from '@/components/audit/FrameworkChecklists';
import AuditorAccess from '@/components/audit/AuditorAccess';
import CreateAuditModal from '@/components/audit/CreateAuditModal';
import EvidenceUploadModal from '@/components/audit/EvidenceUploadModal';
import AuditWorkflowVisualizer from '@/components/audit/AuditWorkflowVisualizer';
import AuditReportGenerator from '@/components/audit/AuditReportGenerator';
import { useAudits } from '@/hooks/useAudits';

const AuditPortal = () => {
  const { audits } = useAudits();
  const currentAudit = audits[0] ?? null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
            {/* Grid Layout Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Page Header - Full Width */}
              <div className="col-span-full">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-foreground truncate">
                      Auditorias Contínuas
                    </h1>
                    <p className="text-muted-foreground line-clamp-2">
                      Cofre de evidências, checklists de conformidade e portal para auditores externos
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <EvidenceUploadModal />
                    <CreateAuditModal />
                  </div>
                </div>
              </div>

              {/* Stats Overview - Full Width */}
              <div className="col-span-full">
                <AuditStats />
              </div>

              {/* Evidence Locker - 8 cols on xl */}
              <div className="col-span-full xl:col-span-8">
                <EvidenceLocker />
              </div>
              
              {/* Framework Checklists - 4 cols on xl */}
              <div className="col-span-full xl:col-span-4">
                <FrameworkChecklists />
              </div>

              {/* Workflow & Report Generation - 2 columns on xl */}
              <div className="col-span-full xl:col-span-6">
                {currentAudit ? (
                  <AuditWorkflowVisualizer audit={currentAudit} />
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-8 text-center text-muted-foreground">
                    <p className="font-medium">Nenhuma auditoria</p>
                    <p className="text-sm mt-1">Crie uma auditoria para visualizar o fluxo e o progresso.</p>
                  </div>
                )}
              </div>
              <div className="col-span-full xl:col-span-6">
                {currentAudit ? (
                  <AuditReportGenerator audit={currentAudit} />
                ) : (
                  <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 p-8 text-center text-muted-foreground">
                    <p className="font-medium">Nenhuma auditoria</p>
                    <p className="text-sm mt-1">Crie uma auditoria para gerar relatórios.</p>
                  </div>
                )}
              </div>

              {/* Auditor Access - Full Width */}
              <div className="col-span-full">
                <AuditorAccess />
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default AuditPortal;
