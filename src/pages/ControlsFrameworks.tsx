import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import FrameworksOverview from '@/components/controls/FrameworksOverview';
import ControlsMatrix from '@/components/controls/ControlsMatrix';
import GapAssessment from '@/components/controls/GapAssessment';
import CreateControlModal from '@/components/controls/CreateControlModal';

const ControlsFrameworks = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-6 overflow-auto">
          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Page Header - Full Width */}
            <div className="col-span-full">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    Controles e Frameworks
                  </h1>
                  <p className="text-muted-foreground">
                    Mapeamento de controles de segurança e avaliação de conformidade por framework
                  </p>
                </div>
                <CreateControlModal />
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
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default ControlsFrameworks;