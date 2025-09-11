import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRisks } from '@/hooks/useRisks';
import VendorTable from './VendorTable';
import { 
  Plus, 
  Table,
  Grid
} from 'lucide-react';

const VendorManagement = () => {
  const { vendors, loading } = useRisks();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-7 bg-muted rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="h-16 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Gestão de Fornecedores
        </h2>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table" className="gap-2">
            <Table className="h-4 w-4" />
            Tabela
          </TabsTrigger>
          <TabsTrigger value="cards" className="gap-2">
            <Grid className="h-4 w-4" />
            Cards
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="table" className="space-y-4">
          <VendorTable />
        </TabsContent>
        
        <TabsContent value="cards" className="space-y-4 max-h-[500px] overflow-y-auto">
          <div className="text-sm text-muted-foreground mb-4">
            Visualização em cards (versão anterior)
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorManagement;