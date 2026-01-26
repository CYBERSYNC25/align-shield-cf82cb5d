import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Asset } from '@/hooks/useAssetInventory';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { escapeCSV } from '@/lib/security/textSanitizer';

interface ExportCSVButtonProps {
  assets: Asset[];
  disabled?: boolean;
}

function formatComplianceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pass: 'Aprovado',
    fail: 'Reprovado',
    'not-checked': 'Não Verificado',
  };
  return statusMap[status] || status;
}

export function ExportCSVButton({ assets, disabled }: ExportCSVButtonProps) {
  const { toast } = useToast();

  const handleExport = () => {
    if (assets.length === 0) {
      toast({
        title: 'Nenhum ativo para exportar',
        description: 'Conecte integrações para coletar dados.',
        variant: 'destructive',
      });
      return;
    }

    // CSV Headers
    const headers = [
      'Ativo',
      'Tipo',
      'Categoria',
      'Origem',
      'Status Compliance',
      'Problemas',
      'Última Sincronização',
    ];

    // CSV Rows
    const rows = assets.map((asset) => [
      escapeCSV(asset.name),
      escapeCSV(asset.typeLabel),
      escapeCSV(asset.category),
      escapeCSV(asset.integrationName),
      escapeCSV(formatComplianceStatus(asset.complianceStatus)),
      escapeCSV(asset.complianceIssues.join('; ') || '-'),
      escapeCSV(format(asset.lastSynced, "dd/MM/yyyy HH:mm", { locale: ptBR })),
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventario_ativos_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: 'Exportação concluída',
      description: `${assets.length} ativos exportados com sucesso.`,
    });
  };

  return (
    <Button onClick={handleExport} disabled={disabled} variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Exportar CSV
    </Button>
  );
}
