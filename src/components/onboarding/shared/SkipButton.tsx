import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface SkipButtonProps {
  onSkip: () => void;
  isUpdating: boolean;
}

const SkipButton = ({ onSkip, isUpdating }: SkipButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          disabled={isUpdating}
        >
          <X className="w-4 h-4 mr-1" />
          Pular
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Pular o Onboarding?</AlertDialogTitle>
          <AlertDialogDescription>
            Você poderá refazer este tutorial a qualquer momento em Configurações.
            Recomendamos completá-lo para aproveitar melhor a plataforma.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar Tutorial</AlertDialogCancel>
          <AlertDialogAction onClick={onSkip}>Pular</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SkipButton;
