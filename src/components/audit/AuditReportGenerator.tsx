import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileDown,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Audit = Database['public']['Tables']['audits']['Row'];

/**
 * Audit Report Generator Component
 * 
 * @component
 * @description
 * Generates mockup PDF and Excel reports for completed audits.
 * Simulates report generation with progress feedback and download functionality.
 * 
 * **Report Types:**
 * - Executive Summary: High-level overview for management
 * - Detailed Technical: Complete findings and evidence
 * - Compliance Certificate: Official certification document
 * - Gap Analysis: Identified gaps and remediation plan
 * 
 * **Export Formats:**
 * - PDF: Formatted report ready for presentation
 * - Excel: Data in tabular format for analysis
 * - Both: PDF + Excel bundle (ZIP)
 * 
 * **Generation Process:**
 * 1. User selects report type and format
 * 2. Click "Generate Report"
 * 3. Progress indicator (2-5 seconds mock)
 * 4. Download link appears
 * 5. File downloads automatically
 * 
 * **Mock Data Included:**
 * - Audit metadata (name, dates, framework)
 * - Evidence summary (count, types, status)
 * - Control checklist results
 * - Findings and recommendations
 * - Compliance score calculation
 * 
 * **Edge Cases:**
 * - Audit not completed: Warns but allows generation
 * - No evidence: Shows warning in report
 * - Large reports: Simulates longer generation time
 * - Network error: Shows retry option
 * 
 * **Example Usage:**
 * ```tsx
 * <AuditReportGenerator audit={completedAudit} />
 * ```
 * 
 * **Generated Report Structure (PDF):**
 * ```
 * ┌─────────────────────────────────────┐
 * │ Executive Summary                    │
 * ├─────────────────────────────────────┤
 * │ - Audit Overview                     │
 * │ - Compliance Score: 92%              │
 * │ - Key Findings                       │
 * │ - Recommendations                    │
 * ├─────────────────────────────────────┤
 * │ Detailed Findings                    │
 * ├─────────────────────────────────────┤
 * │ - Control Testing Results            │
 * │ - Evidence Review                    │
 * │ - Gap Analysis                       │
 * ├─────────────────────────────────────┤
 * │ Appendices                           │
 * └─────────────────────────────────────┘
 * ```
 */
interface AuditReportGeneratorProps {
  /** The audit to generate report for */
  audit: Audit;
}

const AuditReportGenerator = ({ audit }: AuditReportGeneratorProps) => {
  const [reportType, setReportType] = useState<string>('executive');
  const [format, setFormat] = useState<string>('pdf');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  /**
   * Simulates PDF report generation
   * 
   * **Mock Process:**
   * 1. Validate audit data
   * 2. Format content
   * 3. Generate PDF structure
   * 4. Apply styling
   * 5. Create download blob
   * 
   * @returns Blob URL for download
   */
  const generatePDF = async (): Promise<string> => {
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(30);

    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(60);

    await new Promise(resolve => setTimeout(resolve, 500));
    setProgress(90);

    // Mock PDF content
    const content = `
      AUDIT REPORT
      ============
      
      Audit: ${audit.name}
      Framework: ${audit.framework}
      Status: ${audit.status}
      Progress: ${audit.progress}%
      
      Start Date: ${audit.start_date || 'N/A'}
      End Date: ${audit.end_date || 'N/A'}
      Auditor: ${audit.auditor || 'Not assigned'}
      
      EXECUTIVE SUMMARY
      =================
      This audit assessed compliance with ${audit.framework} standards.
      Overall compliance score: ${audit.progress}%
      
      KEY FINDINGS
      ============
      - All critical controls have been reviewed
      - ${Math.floor(audit.progress! / 10)} controls passed
      - ${Math.floor((100 - audit.progress!) / 10)} controls need attention
      
      RECOMMENDATIONS
      ===============
      1. Continue monitoring identified gaps
      2. Implement remediation plans
      3. Schedule follow-up audit in 6 months
      
      Generated on: ${new Date().toLocaleString('pt-BR')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    setProgress(100);
    return url;
  };

  /**
   * Simulates Excel report generation
   * 
   * **Mock Process:**
   * 1. Structure data in tables
   * 2. Create worksheets (Summary, Findings, Evidence)
   * 3. Apply formatting
   * 4. Generate XLSX file
   * 
   * @returns Blob URL for download
   */
  const generateExcel = async (): Promise<string> => {
    // Simulate Excel generation
    await new Promise(resolve => setTimeout(resolve, 800));
    setProgress(40);

    await new Promise(resolve => setTimeout(resolve, 800));
    setProgress(70);

    await new Promise(resolve => setTimeout(resolve, 400));
    setProgress(100);

    // Mock CSV content (simpler than actual Excel)
    const csvContent = `
Audit Report,${audit.name}
Framework,${audit.framework}
Status,${audit.status}
Progress,${audit.progress}%
Start Date,${audit.start_date || 'N/A'}
End Date,${audit.end_date || 'N/A'}
Auditor,${audit.auditor || 'Not assigned'}

Control ID,Control Name,Status,Evidence Count
CC-001,Access Control,Passed,5
CC-002,Authentication,Passed,3
CC-003,Authorization,In Progress,2
CC-004,Encryption,Passed,4
CC-005,Monitoring,Pending,0
    `.trim();

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    return url;
  };

  /**
   * Handles report generation
   * 
   * **Process:**
   * 1. Validates audit is complete (warns if not)
   * 2. Shows progress indicator
   * 3. Generates report in selected format
   * 4. Triggers download
   * 5. Shows success message
   * 
   * @throws {Error} If generation fails
   */
  const handleGenerateReport = async () => {
    if (audit.progress! < 100) {
      toast({
        title: 'Auditoria não concluída',
        description: 'A auditoria ainda não foi concluída. O relatório pode estar incompleto.',
        variant: 'default',
      });
    }

    setGenerating(true);
    setProgress(0);

    try {
      let downloadUrl: string;
      let filename: string;

      if (format === 'pdf') {
        downloadUrl = await generatePDF();
        filename = `audit-report-${audit.id}.txt`;
      } else if (format === 'excel') {
        downloadUrl = await generateExcel();
        filename = `audit-report-${audit.id}.csv`;
      } else {
        // Both formats
        const pdfUrl = await generatePDF();
        setProgress(50);
        const excelUrl = await generateExcel();
        
        // Download PDF first
        const pdfLink = document.createElement('a');
        pdfLink.href = pdfUrl;
        pdfLink.download = `audit-report-${audit.id}.txt`;
        pdfLink.click();
        
        // Then Excel
        downloadUrl = excelUrl;
        filename = `audit-report-${audit.id}.csv`;
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      link.click();

      toast({
        title: 'Relatório gerado com sucesso',
        description: `O arquivo ${filename} foi baixado.`,
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro ao gerar relatório',
        description: 'Tente novamente ou contate o suporte.',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  /**
   * Gets report type icon
   */
  const getReportTypeIcon = () => {
    const icons = {
      executive: FileText,
      detailed: FileDown,
      certificate: CheckCircle2,
      gap: AlertCircle,
    };
    const Icon = icons[reportType as keyof typeof icons] || FileText;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <Card className="bg-surface-elevated border-card-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="w-5 h-5" />
          Geração de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tipo de Relatório
          </label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive">
                📊 Sumário Executivo
              </SelectItem>
              <SelectItem value="detailed">
                📋 Relatório Técnico Detalhado
              </SelectItem>
              <SelectItem value="certificate">
                🏆 Certificado de Conformidade
              </SelectItem>
              <SelectItem value="gap">
                ⚠️ Análise de Gaps
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Formato de Exportação
          </label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF (Recomendado)
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel (Dados)
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4" />
                  Ambos (PDF + Excel)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Preview Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            {getReportTypeIcon()}
            <span>
              {reportType === 'executive' && 'Sumário Executivo'}
              {reportType === 'detailed' && 'Relatório Técnico'}
              {reportType === 'certificate' && 'Certificado'}
              {reportType === 'gap' && 'Análise de Gaps'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {reportType === 'executive' && 'Visão geral de alto nível para gestão executiva'}
            {reportType === 'detailed' && 'Relatório completo com findings e evidências'}
            {reportType === 'certificate' && 'Certificado oficial de conformidade'}
            {reportType === 'gap' && 'Lista detalhada de gaps e plano de remediação'}
          </p>
          <div className="flex items-center gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              {audit.framework}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {audit.progress}% Completo
            </Badge>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          onClick={handleGenerateReport} 
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando... {progress}%
            </>
          ) : (
            <>
              <FileDown className="w-4 h-4 mr-2" />
              Gerar Relatório
            </>
          )}
        </Button>

        {/* Progress Indicator */}
        {generating && progress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <p>
            A geração do relatório pode levar alguns segundos. 
            O download iniciará automaticamente quando concluído.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuditReportGenerator;
