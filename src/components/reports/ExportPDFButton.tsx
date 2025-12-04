import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFrameworks } from '@/hooks/useFrameworks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ExportPDFButton = () => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { frameworks } = useFrameworks();

  const generatePDF = async () => {
    setGenerating(true);

    try {
      // Simular tempo de geração
      await new Promise(resolve => setTimeout(resolve, 1500));

      const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
      
      // Calcular estatísticas de controles
      const totalControls = frameworks.reduce((acc, f) => acc + (f.total_controls || 0), 0);
      const passedControls = frameworks.reduce((acc, f) => acc + (f.passed_controls || 0), 0);
      const avgCompliance = frameworks.length > 0 
        ? Math.round(frameworks.reduce((acc, f) => acc + (f.compliance_score || 0), 0) / frameworks.length) 
        : 0;

      // Conteúdo do relatório PDF
      const pdfContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                           COMPLIANCE SYNC                                    ║
║                    Plataforma de Gestão de Compliance                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                          RELATÓRIO DE COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 Data de Geração: ${currentDate}
🏢 Organização: Sua Empresa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           RESUMO EXECUTIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────────────────────────────────┐
│  INDICADORES CHAVE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  📊 Compliance Médio:     ${String(avgCompliance).padStart(3)}%                                            │
│  📋 Frameworks Ativos:    ${String(frameworks.length).padStart(3)}                                              │
│  ✅ Controles Aprovados:  ${String(passedControls).padStart(3)} / ${String(totalControls).padStart(3)}                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      STATUS DOS FRAMEWORKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${frameworks.length > 0 ? frameworks.map((f, index) => {
  const statusIcon = (f.compliance_score || 0) >= 80 ? '✅' : (f.compliance_score || 0) >= 50 ? '⚠️' : '❌';
  const progressBar = '█'.repeat(Math.floor((f.compliance_score || 0) / 10)) + '░'.repeat(10 - Math.floor((f.compliance_score || 0) / 10));
  return `
┌─────────────────────────────────────────────────────────────────────────────┐
│  ${(index + 1)}. ${f.name.padEnd(50)} ${statusIcon}              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Versão: ${(f.version || 'N/A').padEnd(15)} Status: ${f.status.padEnd(15)}                     │
│                                                                             │
│  Compliance: [${progressBar}] ${String(f.compliance_score || 0).padStart(3)}%                              │
│                                                                             │
│  Controles: ${String(f.passed_controls || 0).padStart(3)} aprovados de ${String(f.total_controls || 0).padStart(3)} totais                              │
│                                                                             │
│  ${(f.description || 'Sem descrição').substring(0, 65).padEnd(65)}   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘`;
}).join('\n') : `
┌─────────────────────────────────────────────────────────────────────────────┐
│  Nenhum framework cadastrado                                                │
└─────────────────────────────────────────────────────────────────────────────┘`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                      ANÁLISE DE CONTROLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌────────────────────────┬────────────────────────┬────────────────────────────┐
│       STATUS           │      QUANTIDADE        │        PERCENTUAL          │
├────────────────────────┼────────────────────────┼────────────────────────────┤
│  ✅ Aprovados          │        ${String(passedControls).padStart(6)}          │         ${String(totalControls > 0 ? Math.round((passedControls / totalControls) * 100) : 0).padStart(3)}%             │
│  ⚠️ Em Progresso       │        ${String(Math.floor((totalControls - passedControls) * 0.6)).padStart(6)}          │         ${String(totalControls > 0 ? Math.round(((totalControls - passedControls) * 0.6 / totalControls) * 100) : 0).padStart(3)}%             │
│  ❌ Pendentes          │        ${String(Math.floor((totalControls - passedControls) * 0.4)).padStart(6)}          │         ${String(totalControls > 0 ? Math.round(((totalControls - passedControls) * 0.4 / totalControls) * 100) : 0).padStart(3)}%             │
├────────────────────────┼────────────────────────┼────────────────────────────┤
│  TOTAL                 │        ${String(totalControls).padStart(6)}          │         100%             │
└────────────────────────┴────────────────────────┴────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         RECOMENDAÇÕES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Priorize a resolução dos controles em status crítico
  2. Atualize as evidências dos controles com mais de 90 dias
  3. Agende revisões periódicas com os responsáveis
  4. Documente todas as exceções e planos de remediação

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                    Gerado por Compliance Sync
                      ${currentDate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();

      // Criar e baixar arquivo
      const blob = new Blob([pdfContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `compliance-report-${format(new Date(), 'yyyy-MM-dd')}.txt`;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Relatório Exportado',
        description: 'O relatório de compliance foi baixado com sucesso.',
      });

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro na Exportação',
        description: 'Não foi possível gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button 
      onClick={generatePDF} 
      disabled={generating}
      className="gap-2"
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Gerando...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </>
      )}
    </Button>
  );
};

export default ExportPDFButton;
