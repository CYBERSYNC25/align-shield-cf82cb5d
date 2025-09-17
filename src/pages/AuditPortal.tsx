import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import AuditStats from '@/components/audit/AuditStats';
import EvidenceLocker from '@/components/audit/EvidenceLocker';
import FrameworkChecklists from '@/components/audit/FrameworkChecklists';
import AuditorAccess from '@/components/audit/AuditorAccess';
import CreateAuditModal from '@/components/audit/CreateAuditModal';
import EvidenceUploadModal from '@/components/audit/EvidenceUploadModal';

const AuditPortal = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                Auditorias Contínuas
              </h1>
              <p className="text-muted-foreground">
                Cofre de evidências, checklists de conformidade e portal para auditores externos
              </p>
              <p className="text-xs text-primary/80 font-medium">
                💡 Use o botão "Upload de Evidência" ao lado para adicionar novas evidências
              </p>
            </div>
            <div className="flex gap-3">
              <EvidenceUploadModal />
              <CreateAuditModal />
            </div>
          </div>

          {/* Stats Overview */}
          <AuditStats />

          {/* Evidence Locker */}
          <EvidenceLocker />

          {/* Framework Checklists & Auditor Access */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FrameworkChecklists />
            <AuditorAccess />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuditPortal;