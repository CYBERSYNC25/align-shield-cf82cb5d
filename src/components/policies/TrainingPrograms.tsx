import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import CreateTrainingModal from '@/components/policies/CreateTrainingModal';

const TrainingPrograms = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Programas de Treinamento
        </h2>
        <CreateTrainingModal />
      </div>

      <Card className="bg-surface-elevated border-card-border">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhum programa de treinamento cadastrado
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Crie um programa de treinamento para capacitar seus colaboradores em segurança e compliance.
          </p>
          <CreateTrainingModal />
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainingPrograms;
