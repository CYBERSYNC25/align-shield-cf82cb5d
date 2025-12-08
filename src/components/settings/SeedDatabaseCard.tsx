import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SeedDatabaseCard() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('seed-compliance-data');

      if (error) {
        throw error;
      }

      if (data?.success) {
        setSeedResult({
          success: true,
          message: `Banco populado com sucesso! ${data.data?.frameworks || 0} frameworks e ${data.data?.controls || 0} controles criados.`
        });
        toast({
          title: 'Banco de dados populado',
          description: 'Os frameworks padrão foram carregados com sucesso.',
        });
      } else {
        setSeedResult({
          success: false,
          message: data?.message || 'Não foi possível popular o banco de dados.'
        });
        toast({
          title: 'Aviso',
          description: data?.message || 'Os frameworks já existem no banco de dados.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Seed error:', error);
      setSeedResult({
        success: false,
        message: error.message || 'Erro ao popular o banco de dados.'
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível popular o banco de dados.',
        variant: 'destructive',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dados de Compliance
        </CardTitle>
        <CardDescription>
          Carregue os frameworks padrão (ISO 27001, LGPD, SOC 2) com seus controles para começar a monitorar a conformidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Frameworks incluídos:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• <strong>ISO 27001:2022</strong> - 93 controles do Anexo A</li>
            <li>• <strong>LGPD</strong> - 25+ controles baseados na Lei 13.709/2018</li>
            <li>• <strong>SOC 2 Type II</strong> - 50+ controles dos Trust Service Criteria</li>
          </ul>
        </div>

        {seedResult && (
          <Alert variant={seedResult.success ? 'default' : 'destructive'}>
            {seedResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{seedResult.message}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleSeedDatabase}
          disabled={isSeeding}
          className="w-full"
        >
          {isSeeding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Carregando dados...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Popular Banco com Frameworks Padrão
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
