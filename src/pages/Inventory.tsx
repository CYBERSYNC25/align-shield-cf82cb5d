import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAssetInventory } from '@/hooks/useAssetInventory';
import { AssetFilters, FilterCategory } from '@/components/inventory/AssetFilters';
import { AssetInventoryTable } from '@/components/inventory/AssetInventoryTable';
import { ExportCSVButton } from '@/components/inventory/ExportCSVButton';
import { Package, Database, Plug, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';

export default function Inventory() {
  const navigate = useNavigate();
  const { assets, counts, hasRealData, isLoading } = useAssetInventory();

  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter assets based on category and search
  const filteredAssets = useMemo(() => {
    let result = assets;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((asset) => asset.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (asset) =>
          asset.name.toLowerCase().includes(query) ||
          asset.integrationName.toLowerCase().includes(query) ||
          asset.typeLabel.toLowerCase().includes(query)
      );
    }

    return result;
  }, [assets, selectedCategory, searchQuery]);

  // Calculate compliance stats
  const complianceStats = useMemo(() => {
    const total = filteredAssets.length;
    const pass = filteredAssets.filter((a) => a.complianceStatus === 'pass').length;
    const fail = filteredAssets.filter((a) => a.complianceStatus === 'fail').length;
    const notChecked = filteredAssets.filter((a) => a.complianceStatus === 'not-checked').length;
    return { total, pass, fail, notChecked };
  }, [filteredAssets]);

  return (
<div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <main className="flex-1 ml-72 min-h-[calc(100vh-4rem)] overflow-y-auto">
          <PageContainer>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Inventário de Ativos</h1>
                <p className="text-muted-foreground text-sm">
                  Visão centralizada de todos os recursos monitorados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasRealData && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Database className="h-3 w-3 mr-1" />
                  Dados Reais
                </Badge>
              )}
              <ExportCSVButton assets={filteredAssets} disabled={isLoading || !hasRealData} />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{counts.total}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Aprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-green-600">{complianceStats.pass}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Reprovados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-red-600">{complianceStats.fail}</span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <MinusCircle className="h-4 w-4 text-gray-500" />
                  Não Verificados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold text-gray-500">{complianceStats.notChecked}</span>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <AssetFilters
                counts={counts}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </CardContent>
          </Card>

          {/* Table or Empty State */}
          {hasRealData ? (
            <AssetInventoryTable assets={filteredAssets} isLoading={isLoading} />
          ) : (
            <Card>
              <CardContent className="py-16 text-center">
                <Plug className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum ativo encontrado</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Conecte suas integrações para visualizar o inventário completo de ativos
                  monitorados pelo APOC.
                </p>
                <Button onClick={() => navigate('/integrations')}>
                  <Database className="h-4 w-4 mr-2" />
                  Ir para Integrações
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Results count */}
          {hasRealData && (
            <p className="text-sm text-muted-foreground mt-4">
              Exibindo {filteredAssets.length} de {counts.total} ativos
            </p>
          )}
          </PageContainer>
          <Footer />
        </main>
      </div>
    </div>
  );
}
