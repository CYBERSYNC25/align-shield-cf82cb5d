import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  FileText,
  ClipboardList
} from 'lucide-react';

interface ViewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
}

const ViewAssessmentModal = ({ isOpen, onClose, vendorName }: ViewAssessmentModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Avaliação de Risco - {vendorName}
          </DialogTitle>
          <DialogDescription>
            Visualize o progresso e respostas da avaliação de risco do fornecedor
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Nenhuma avaliação realizada
          </h3>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Nenhuma avaliação de risco foi realizada para o fornecedor "{vendorName}". 
            Inicie uma avaliação para coletar dados de compliance do fornecedor.
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onClose} className="ml-auto">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAssessmentModal;
