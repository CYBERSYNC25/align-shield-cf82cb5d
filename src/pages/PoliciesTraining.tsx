import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import PoliciesLibrary from '@/components/policies/PoliciesLibrary';
import TrainingPrograms from '@/components/policies/TrainingPrograms';
import AttestationTracking from '@/components/policies/AttestationTracking';
import PoliciesStats from '@/components/policies/PoliciesStats';

const PoliciesTraining = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Page Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Políticas & Treinamentos
            </h1>
            <p className="text-muted-foreground">
              Gestão de políticas organizacionais, treinamentos obrigatórios e coleta de atestos
            </p>
          </div>

          {/* Stats Overview */}
          <PoliciesStats />

          {/* Policies Library */}
          <PoliciesLibrary />

          {/* Training Programs */}
          <TrainingPrograms />

          {/* Attestation Tracking */}
          <AttestationTracking />
        </main>
      </div>
    </div>
  );
};

export default PoliciesTraining;