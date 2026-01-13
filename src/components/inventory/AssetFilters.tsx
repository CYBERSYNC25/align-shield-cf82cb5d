import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, Users, Server, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AssetCategory } from '@/hooks/useAssetInventory';

export type FilterCategory = 'all' | AssetCategory;

interface AssetFiltersProps {
  counts: {
    total: number;
    identity: number;
    infrastructure: number;
    security: number;
    productivity: number;
  };
  onCategoryChange: (category: FilterCategory) => void;
  onSearchChange: (search: string) => void;
  selectedCategory: FilterCategory;
  searchQuery: string;
}

export function AssetFilters({
  counts,
  onCategoryChange,
  onSearchChange,
  selectedCategory,
  searchQuery,
}: AssetFiltersProps) {
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  const tabs = [
    { id: 'all' as FilterCategory, label: 'Tudo', icon: Package, count: counts.total },
    { id: 'identity' as FilterCategory, label: 'Identidades', icon: Users, count: counts.identity },
    { id: 'infrastructure' as FilterCategory, label: 'Infraestrutura', icon: Server, count: counts.infrastructure },
    { id: 'security' as FilterCategory, label: 'Segurança', icon: Shield, count: counts.security },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar ativos por nome..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) => onCategoryChange(value as FilterCategory)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4 h-auto p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                'flex items-center gap-2 py-2.5 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span
                className={cn(
                  'ml-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  selectedCategory === tab.id
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
