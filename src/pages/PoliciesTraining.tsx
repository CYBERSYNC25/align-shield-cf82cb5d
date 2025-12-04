import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PoliciesLibrary from '@/components/policies/PoliciesLibrary';
import TrainingPrograms from '@/components/policies/TrainingPrograms';
import AttestationTracking from '@/components/policies/AttestationTracking';
import PoliciesStats from '@/components/policies/PoliciesStats';
import CreatePolicyModal from '@/components/policies/CreatePolicyModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';

const PoliciesTraining = () => {
  const { isViewer, canEditResources } = useUserRoles();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Viewer Alert */}
            {isViewer() && !canEditResources() && (
              <div className="col-span-full">
                <Alert variant="default" className="bg-info/10 border-info/20">
                  <Info className="h-4 w-4 text-info" />
                  <AlertDescription className="text-info">
                    Você está visualizando como observador. Apenas administradores podem criar ou editar conteúdos.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Page Header - Full Width */}
            <div className="col-span-full">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Políticas & Treinamentos
                  </h1>
                  <p className="text-muted-foreground">
                    Gestão de políticas organizacionais, treinamentos obrigatórios e coleta de atestos
                  </p>
                </div>
                {canEditResources() && <CreatePolicyModal />}
              </div>
            </div>

            {/* Stats Overview - Full Width */}
            <div className="col-span-full">
              <PoliciesStats />
            </div>

            {/* Policies Library - Full Width */}
            <div className="col-span-full">
              <PoliciesLibrary />
            </div>

            {/* Training Programs - Full Width */}
            <div className="col-span-full">
              <TrainingPrograms />
            </div>

            {/* Attestation Tracking - Full Width */}
            <div className="col-span-full">
              <AttestationTracking />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default PoliciesTraining;