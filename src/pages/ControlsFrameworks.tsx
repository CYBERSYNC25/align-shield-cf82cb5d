import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import FrameworksOverview from '@/components/controls/FrameworksOverview';
import ControlsMatrix from '@/components/controls/ControlsMatrix';
import GapAssessment from '@/components/controls/GapAssessment';
import CreateControlModal from '@/components/controls/CreateControlModal';
import CreateFrameworkModal from '@/components/controls/CreateFrameworkModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useUserRoles } from '@/hooks/useUserRoles';

const ControlsFrameworks = () => {
  const { isViewer, canEditResources } = useUserRoles();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1 pt-16">
        <Sidebar />
        
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
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
                    <h1 className="text-3xl font-bold text-foreground truncate">
                      Controles e Frameworks
                    </h1>
                    <p className="text-muted-foreground line-clamp-2">
                      Mapeamento de controles de segurança e avaliação de conformidade por framework
                    </p>
                  </div>
                  {canEditResources() && (
                  <div className="flex gap-2">
                    <CreateFrameworkModal />
                    <CreateControlModal />
                  </div>
                )}
                </div>
              </div>

              {/* Frameworks Overview - Full Width */}
              <div className="col-span-full">
                <FrameworksOverview />
              </div>

              {/* Gap Assessment - Full Width */}
              <div className="col-span-full">
                <GapAssessment />
              </div>

              {/* Controls Matrix - Full Width */}
              <div className="col-span-full">
                <ControlsMatrix />
              </div>
            </div>
          </PageContainer>
          
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default ControlsFrameworks;
