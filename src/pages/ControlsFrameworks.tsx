import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import FrameworksOverview from '@/components/controls/FrameworksOverview';
import ControlsMatrix from '@/components/controls/ControlsMatrix';
import GapAssessment from '@/components/controls/GapAssessment';

const ControlsFrameworks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Controles e Frameworks
            </h1>
            <p className="text-muted-foreground">
              Mapeamento de controles de segurança e avaliação de conformidade por framework
            </p>
          </div>

          {/* Frameworks Overview */}
          <FrameworksOverview />

          {/* Gap Assessment */}
          <GapAssessment />

          {/* Controls Matrix */}
          <ControlsMatrix />
        </main>
      </div>
    </div>
  );
};

export default ControlsFrameworks;