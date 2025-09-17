import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Eye, 
  Download,
  X
} from 'lucide-react';
import { useAudits } from '@/hooks/useAudits';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import EvidenceViewModal from './EvidenceViewModal';

const SearchEvidenceModal = () => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEvidence, setSelectedEvidence] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  
  const { evidence } = useAudits();

  const filteredEvidence = evidence.filter(item => {
    // Verificação defensiva para evitar erros com objetos null
    if (!item || typeof item !== 'object') return false;
    if (!item.name || !item.type) return false;
    
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.uploaded_by || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      verified: { label: 'Verificado', className: 'bg-success/10 text-success border-success/20' },
      collected: { label: 'Coletado', className: 'bg-info/10 text-info border-info/20' },
      pending: { label: 'Pendente', className: 'bg-warning/10 text-warning border-warning/20' },
      archived: { label: 'Arquivado', className: 'bg-muted/10 text-muted-foreground border-muted/20' }
    };
    
    const conf = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="outline" className={conf.className}>
        {conf.label}
      </Badge>
    );
  };

  const getFileIcon = (type: string) => {
    if (type.includes('PDF')) return '📋';
    if (type.includes('Excel') || type.includes('CSV')) return '📊';
    if (type.includes('Word')) return '📄';
    if (type.includes('Image')) return '🖼️';
    if (type.includes('JSON')) return '☁️';
    return '📄';
  };

  const handleViewEvidence = (evidenceItem: any) => {
    setSelectedEvidence(evidenceItem);
    setViewModalOpen(true);
  };

  const handleDownload = async (evidenceItem: any) => {
    if (!evidenceItem.file_url) return;
    
    try {
      const response = await fetch(evidenceItem.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = evidenceItem.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Buscar Evidências
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar e Filtrar Evidências
            </DialogTitle>
            <DialogDescription>
              Encontre evidências específicas usando filtros e pesquisa
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar por nome, tipo ou responsável..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="shrink-0"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de arquivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="Excel">Excel</SelectItem>
                      <SelectItem value="Word">Word</SelectItem>
                      <SelectItem value="Image">Imagem</SelectItem>
                      <SelectItem value="JSON">JSON</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="Log">Log</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="verified">Verificado</SelectItem>
                      <SelectItem value="collected">Coletado</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {filteredEvidence.length} evidência(s) encontrada(s)
                  </span>
                </div>
                
                {(searchTerm || typeFilter !== 'all' || statusFilter !== 'all') && (
                  <Badge variant="outline" className="gap-1">
                    Filtros ativos: {[
                      searchTerm && 'busca',
                      typeFilter !== 'all' && 'tipo',
                      statusFilter !== 'all' && 'status'
                    ].filter(Boolean).join(', ')}
                  </Badge>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {filteredEvidence.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Nenhuma evidência encontrada
                  </h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou termos de busca
                  </p>
                </div>
              ) : (
                filteredEvidence.map((item) => {
                  // Verificação defensiva antes de renderizar
                  if (!item || !item.id) return null;
                  
                  // Criar objeto seguro
                  const safeItem = {
                    id: item.id,
                    name: item.name || 'Evidência sem nome',
                    type: item.type || 'Tipo desconhecido',
                    uploaded_by: item.uploaded_by || 'Sistema',
                    created_at: item.created_at || new Date().toISOString()
                  };
                  
                  return (
                    <Card key={safeItem.id} className="bg-surface-elevated border-card-border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-lg">
                              {getFileIcon(safeItem.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-foreground truncate">
                                {safeItem.name}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {safeItem.type} • Por {safeItem.uploaded_by}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {(() => {
                                  try {
                                    return format(new Date(safeItem.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
                                  } catch {
                                    return 'Data inválida';
                                  }
                                })()}
                              </p>
                            </div>
                          </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {getStatusBadge(item.status)}
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEvidence(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(item)}
                              className="h-8 w-8 p-0"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Fechar
              </Button>
              {filteredEvidence.length > 0 && (
                <Button onClick={() => {
                  // Export all filtered results
                  console.log('Exportar resultados:', filteredEvidence);
                }}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Resultados
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Evidence View Modal */}
      {selectedEvidence && (
        <EvidenceViewModal
          evidence={selectedEvidence}
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
        />
      )}
    </>
  );
};

export default SearchEvidenceModal;