import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X } from 'lucide-react';

interface AdvancedFiltersModalProps {
  children: React.ReactNode;
}

const AdvancedFiltersModal = ({ children }: AdvancedFiltersModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    frameworks: [] as string[],
    statuses: [] as string[],
    categories: [] as string[],
    riskLevels: [] as string[],
    automationStatus: [] as string[],
    coverageMin: '',
    coverageMax: '',
    evidencesMin: '',
    evidencesMax: '',
    owner: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const handleApplyFilters = () => {
    console.log('Aplicando filtros:', filters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({
      searchTerm: '',
      frameworks: [],
      statuses: [],
      categories: [],
      riskLevels: [],
      automationStatus: [],
      coverageMin: '',
      coverageMax: '',
      evidencesMin: '',
      evidencesMax: '',
    owner: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleCheckboxChange = (field: keyof typeof filters, value: string, checked: boolean) => {
    const currentArray = filters[field] as string[];
    if (checked) {
      setFilters({
        ...filters,
        [field]: [...currentArray, value]
      });
    } else {
      setFilters({
        ...filters,
        [field]: currentArray.filter(item => item !== value)
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros Avançados
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search">Busca Geral</Label>
            <Input
              id="search"
              placeholder="Buscar por título, descrição ou código..."
              value={filters.searchTerm}
              onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frameworks */}
            <div className="space-y-3">
              <Label>Frameworks</Label>
              <div className="space-y-2">
                {['SOC 2', 'ISO 27001', 'LGPD', 'GDPR', 'NIST', 'CIS'].map((framework) => (
                  <div key={framework} className="flex items-center space-x-2">
                    <Checkbox
                      id={`framework-${framework}`}
                      checked={filters.frameworks.includes(framework)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('frameworks', framework, checked as boolean)
                      }
                    />
                    <Label htmlFor={`framework-${framework}`} className="text-sm font-normal">
                      {framework}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="space-y-3">
              <Label>Status de Implementação</Label>
              <div className="space-y-2">
                {[
                  { value: 'implemented', label: 'Implementado' },
                  { value: 'partial', label: 'Parcial' },
                  { value: 'missing', label: 'Pendente' },
                  { value: 'na', label: 'Não Aplicável' }
                ].map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status.value}`}
                      checked={filters.statuses.includes(status.value)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('statuses', status.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`status-${status.value}`} className="text-sm font-normal">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label>Categorias</Label>
              <div className="space-y-2">
                {[
                  'Controle de Acesso',
                  'Gestão de Ativos',
                  'Privacidade',
                  'Segurança Técnica',
                  'Continuidade de Negócios',
                  'Auditoria e Monitoramento'
                ].map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('categories', category, checked as boolean)
                      }
                    />
                    <Label htmlFor={`category-${category}`} className="text-sm font-normal">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Levels */}
            <div className="space-y-3">
              <Label>Nível de Risco</Label>
              <div className="space-y-2">
                {[
                  { value: 'high', label: 'Alto' },
                  { value: 'medium', label: 'Médio' },
                  { value: 'low', label: 'Baixo' }
                ].map((risk) => (
                  <div key={risk.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`risk-${risk.value}`}
                      checked={filters.riskLevels.includes(risk.value)}
                      onCheckedChange={(checked) => 
                        handleCheckboxChange('riskLevels', risk.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={`risk-${risk.value}`} className="text-sm font-normal">
                      {risk.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coverage Range */}
          <div className="space-y-3">
            <Label>Faixa de Cobertura (%)</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="coverage-min" className="text-sm text-muted-foreground">Mínimo</Label>
                <Input
                  id="coverage-min"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={filters.coverageMin}
                  onChange={(e) => setFilters({ ...filters, coverageMin: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="coverage-max" className="text-sm text-muted-foreground">Máximo</Label>
                <Input
                  id="coverage-max"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="100"
                  value={filters.coverageMax}
                  onChange={(e) => setFilters({ ...filters, coverageMax: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Owner */}
          <div className="space-y-2">
            <Label htmlFor="owner">Responsável</Label>
            <Select value={filters.owner} onValueChange={(value) => setFilters({ ...filters, owner: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="DevOps Team">DevOps Team</SelectItem>
                <SelectItem value="Security Team">Security Team</SelectItem>
                <SelectItem value="Data Team">Data Team</SelectItem>
                <SelectItem value="Legal Team">Legal Team</SelectItem>
                <SelectItem value="Compliance Team">Compliance Team</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label>Período de Atualização</Label>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="date-from" className="text-sm text-muted-foreground">De</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="date-to" className="text-sm text-muted-foreground">Até</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={handleClearFilters} className="gap-2">
            <X className="w-4 h-4" />
            Limpar Filtros
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdvancedFiltersModal;