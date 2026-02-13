import { Card, CardContent } from '@/components/ui/card';
import { FileCheck } from 'lucide-react';
import SendRemindersModal from '@/components/policies/SendRemindersModal';

const AttestationTracking = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Rastreamento de Atestos
        </h2>
        <SendRemindersModal />
      </div>

      <Card className="bg-surface-elevated border-card-border">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Nenhuma campanha de atesto em andamento
          </h3>
          <p className="text-sm text-muted-foreground">
            Quando você criar campanhas de atesto para políticas ou treinamentos, elas aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttestationTracking;
