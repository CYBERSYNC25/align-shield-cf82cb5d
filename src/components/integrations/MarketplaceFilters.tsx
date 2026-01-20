import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export type IntegrationCategory = 'cloud' | 'iam' | 'sdlc' | 'security' | 'productivity' | 'observability';
export type IntegrationStatus = 'all' | 'available' | 'connected' | 'coming_soon' | 'beta';

interface MarketplaceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: IntegrationCategory | 'all';
  onCategoryChange: (value: IntegrationCategory | 'all') => void;
  status: IntegrationStatus;
  onStatusChange: (value: IntegrationStatus) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

const CATEGORY_OPTIONS: { value: IntegrationCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'Todas Categorias', icon: '📁' },
  { value: 'cloud', label: 'Cloud', icon: '☁️' },
  { value: 'iam', label: 'IAM', icon: '🔐' },
  { value: 'sdlc', label: 'SDLC', icon: '🔄' },
  { value: 'security', label: 'Security', icon: '🛡️' },
  { value: 'productivity', label: 'Productivity', icon: '📊' },
  { value: 'observability', label: 'Observability', icon: '👁️' },
];

const STATUS_OPTIONS: { value: IntegrationStatus; label: string }[] = [
  { value: 'all', label: 'Todos Status' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'connected', label: 'Conectadas' },
  { value: 'coming_soon', label: 'Em Breve' },
  { value: 'beta', label: 'Beta' },
];

export const MarketplaceFilters = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  activeFiltersCount,
  onClearFilters,
}: MarketplaceFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar integrações..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 bg-background/50 border-border/50 focus:border-primary/50"
        />
        <AnimatePresence>
          {search && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted"
              onClick={() => onSearchChange('')}
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={(v) => onCategoryChange(v as IntegrationCategory | 'all')}>
          <SelectTrigger className="w-[180px] bg-background/50">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <span className="flex items-center gap-2">
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => onStatusChange(v as IntegrationStatus)}>
          <SelectTrigger className="w-[160px] bg-background/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar filtros
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {activeFiltersCount}
                </Badge>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
