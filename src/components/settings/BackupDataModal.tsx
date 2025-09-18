import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Database, Download, FileText, Users, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BackupDataModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BackupDataModal = ({ open, onOpenChange }: BackupDataModalProps) => {
  const [selectedData, setSelectedData] = useState<string[]>(['profiles', 'documents']);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const dataTypes = [
    { id: 'profiles', label: 'Perfis de usuário', icon: Users, size: '2.3 MB' },
    { id: 'documents', label: 'Documentos e evidências', icon: FileText, size: '45.7 MB' },
    { id: 'policies', label: 'Políticas e procedimentos', icon: Shield, size: '8.1 MB' },
    { id: 'audit', label: 'Dados de auditoria', icon: Database, size: '12.4 MB' }
  ];

  const handleDataSelection = (dataId: string, checked: boolean) => {
    if (checked) {
      setSelectedData(prev => [...prev, dataId]);
    } else {
      setSelectedData(prev => prev.filter(id => id !== dataId));
    }
  };

  const handleBackup = async () => {
    if (selectedData.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de dados para backup",
        variant: "destructive"
      });
      return;
    }

    setIsBackingUp(true);
    setProgress(0);

    // Simulate backup progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          toast({
            title: "Sucesso",
            description: "Backup criado e baixado com sucesso!"
          });
          onOpenChange(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup de Dados
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione os tipos de dados que deseja incluir no backup:
          </p>

          <div className="space-y-3">
            {dataTypes.map((dataType) => {
              const IconComponent = dataType.icon;
              return (
                <Card key={dataType.id} className="border-2 hover:border-primary/20 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id={dataType.id}
                        checked={selectedData.includes(dataType.id)}
                        onCheckedChange={(checked) => 
                          handleDataSelection(dataType.id, checked as boolean)
                        }
                      />
                      <IconComponent className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <label 
                          htmlFor={dataType.id}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {dataType.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Tamanho: {dataType.size}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {isBackingUp && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4 animate-bounce" />
                Criando backup... {progress}%
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> O backup será baixado como um arquivo criptografado. 
              Mantenha-o em local seguro.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isBackingUp}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleBackup}
            disabled={isBackingUp || selectedData.length === 0}
          >
            {isBackingUp ? "Criando..." : "Criar Backup"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};