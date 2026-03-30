import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useComplianceStatus } from '@/hooks/useComplianceStatus';
import { useAssetInventory } from '@/hooks/useAssetInventory';
import { useFrameworks } from '@/hooks/useFrameworks';

const AuditReportExportButton = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { score, passingTests, failingTests, totalTests } = useComplianceStatus();
  const { assets, counts } = useAssetInventory();
  const { frameworks, controls } = useFrameworks();

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));

      const now = new Date();
      const dateStr = now.toLocaleDateString('pt-BR');
      const timeStr = now.toLocaleTimeString('pt-BR');

      // Build report content
      const reportContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                    APOC - RELATÓRIO DE AUDITORIA                             ║
║                    Automated Platform for Online Compliance                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────┐
│ INFORMAÇÕES DO RELATÓRIO                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ Data de Geração: ${dateStr} às ${timeStr}                                    
│ Tipo: Visão do Auditor Externo                                               
│ Formato: Relatório de Compliance                                             
└──────────────────────────────────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              RESUMO EXECUTIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                                                                         │
  │   SCORE DE COMPLIANCE: ${score}%                                        
  │   ${score >= 80 ? '✅ Status: BOM' : score >= 60 ? '⚠️ Status: ATENÇÃO' : '❌ Status: CRÍTICO'}
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  Testes de Segurança:
  • Total de Testes: ${totalTests}
  • Testes Passando: ${passingTests.length} ✓
  • Testes Falhando: ${failingTests.length} ✗

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            INVENTÁRIO DE ATIVOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Total de Ativos Monitorados: ${counts.total}

  Por Categoria:
  ├── Identidades (Usuários): ${counts.identity}
  ├── Infraestrutura (Repos, Domains, Buckets): ${counts.infrastructure}
  ├── Segurança (Dispositivos): ${counts.security}
  └── Produtividade (Canais, Projetos): ${counts.productivity}

${assets.length > 0 ? `
  Amostra de Ativos (primeiros 10):
  ${assets.slice(0, 10).map((asset, i) => `  ${i + 1}. ${asset.name} (${asset.typeLabel}) - ${asset.integrationName}`).join('\n')}
` : '  Nenhum ativo coletado.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                           FRAMEWORKS DE COMPLIANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Frameworks Ativos: ${frameworks.length}

${frameworks.map(fw => {
  const fwControls = controls.filter(c => c.framework_id === fw.id);
  const passed = fwControls.filter(c => c.status === 'passed').length;
  const total = fwControls.length;
  const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
  return `
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ ${fw.name} ${fw.version ? `(${fw.version})` : ''}
  ├─────────────────────────────────────────────────────────────────────────┤
  │ Controles: ${passed}/${total} aprovados (${percentage}%)
  │ Status: ${fw.status}
  └─────────────────────────────────────────────────────────────────────────┘`;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                              TESTES FALHANDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${failingTests.length > 0 ? failingTests.map((test, i) => `
  ${i + 1}. [${test.severity.toUpperCase()}] ${test.title}
     Recursos Afetados: ${test.affectedItems.length}
     ${test.affectedItems.slice(0, 3).map(item => `     • ${item}`).join('\n')}
     ${test.affectedItems.length > 3 ? `     ... e mais ${test.affectedItems.length - 3} recursos` : ''}
`).join('\n') : '  ✅ Nenhum teste falhando no momento.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                            LISTA DE CONTROLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${controls.slice(0, 20).map(control => {
  const fw = frameworks.find(f => f.id === control.framework_id);
  const statusIcon = control.status === 'passed' ? '✓' : control.status === 'failed' ? '✗' : '○';
  return `  [${statusIcon}] ${control.code} - ${control.title}
      Framework: ${fw?.name || 'N/A'} | Status: ${control.status}`;
}).join('\n\n')}

${controls.length > 20 ? `\n  ... e mais ${controls.length - 20} controles\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Relatório gerado automaticamente pela plataforma Compliance Sync.
  Este documento é uma visão somente-leitura do estado de compliance.

  © ${now.getFullYear()} Compliance Sync - Plataforma de Compliance

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

      // Create and download file
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `APOC-Relatorio-Auditoria-${dateStr.replace(/\//g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Relatório Gerado",
        description: "O relatório de auditoria foi baixado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao gerar relatório",
        description: "Ocorreu um erro ao gerar o relatório. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      size="lg" 
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      onClick={generateReport}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Gerando Relatório...
        </>
      ) : (
        <>
          <FileText className="h-5 w-5 mr-2" />
          Gerar Relatório de Auditoria
        </>
      )}
    </Button>
  );
};

export default AuditReportExportButton;
