import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
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
  
  // Get first audit for visualizer (or create mock)
  const currentAudit = audits[0] || {
    id: 'demo',
    name: 'Demo Audit',
    framework: 'SOC 2',
    status: 'in_progress' as const,
    progress: 45,
    start_date: '2024-01-15',
    end_date: '2024-03-15',
    auditor: 'Demo Auditor',
    user_id: 'demo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

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
            </div>
            <div className="flex gap-3">
              <EvidenceUploadModal />
              <CreateAuditModal />
            </div>
          </div>

          {/* Stats Overview */}
          <AuditStats />

          {/* Workflow & Report Generation */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AuditWorkflowVisualizer audit={currentAudit} />
            <AuditReportGenerator audit={currentAudit} />
          </div>

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