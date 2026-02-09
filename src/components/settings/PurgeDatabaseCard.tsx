import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CATEGORIES = [
  { id: 'compliance', label: 'Compliance (alertas, testes, checks)', icon: '🛡️' },
  { id: 'risks', label: 'Riscos, Fornecedores e Avaliações', icon: '⚠️' },
  { id: 'incidents', label: 'Incidentes, Playbooks e BCP', icon: '🚨' },
  { id: 'tasks', label: 'Tarefas', icon: '📋' },
  { id: 'evidence', label: 'Evidências', icon: '📎' },
  { id: 'controls', label: 'Controles', icon: '🔧' },
  { id: 'frameworks', label: 'Frameworks', icon: '📐' },
  { id: 'policies', label: 'Políticas', icon: '📜' },
  { id: 'notifications', label: 'Notificações', icon: '🔔' },
  { id: 'audits', label: 'Auditorias e Logs de Auditoria', icon: '📊' },
  { id: 'integrations', label: 'Dados de Integrações', icon: '🔗' },
  { id: 'logs', label: 'Logs do Sistema', icon: '📝' },
];

export function PurgeDatabaseCard() {
  const [selected, setSelected] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [results, setResults] = useState<Record<string, number> | null>(null);
  const { toast } = useToast();

  const fetchCounts = async () => {
    setLoadingCounts(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/purge-user-data`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await res.json();
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error('Error fetching counts:', err);
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const toggleCategory = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
    setResults(null);
  };

  const selectAll = () => {
    setSelected(CATEGORIES.map(c => c.id));
    setResults(null);
  };

  const totalSelected = selected.reduce((sum, cat) => sum + (counts[cat] ?? 0), 0);
  const canPurge = selected.length > 0 && confirmation === 'LIMPAR';

  const handlePurge = async () => {
    if (!canPurge) return;
    setLoading(true);
    setResults(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `https://ofbyxnpprwwuieabwhdo.supabase.co/functions/v1/purge-user-data`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categories: selected }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setResults(data.deleted);
        const totalDeleted = Object.values(data.deleted as Record<string, number>).reduce((a, b) => a + b, 0);
        toast({
          title: 'Dados removidos',
          description: `${totalDeleted} registro(s) excluído(s) com sucesso.`,
        });
        setSelected([]);
        setConfirmation('');
        fetchCounts();
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Purge error:', err);
      toast({
        title: 'Erro ao limpar dados',
        description: 'Não foi possível excluir os dados. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trash2 className="w-5 h-5 text-destructive" />
          Limpar Dados
        </CardTitle>
        <CardDescription>
          Remova dados mockados ou inseridos manualmente para preparar a plataforma para uso real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Selecionar Tudo
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchCounts} disabled={loadingCounts}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loadingCounts ? 'animate-spin' : ''}`} />
            Atualizar Contagens
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIES.map(cat => (
            <label
              key={cat.id}
              className="flex items-center gap-3 p-2 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selected.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
              />
              <span className="text-sm flex-1">{cat.icon} {cat.label}</span>
              <Badge variant="secondary" className="text-xs">
                {loadingCounts ? '...' : counts[cat.id] ?? 0}
              </Badge>
            </label>
          ))}
        </div>

        {selected.length > 0 && (
          <>
            <Separator />
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {totalSelected} registro(s) serão excluídos permanentemente
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta ação não pode ser desfeita. Digite <strong>LIMPAR</strong> para confirmar.
              </p>
              <Input
                value={confirmation}
                onChange={e => setConfirmation(e.target.value)}
                placeholder='Digite "LIMPAR" para confirmar'
                className="max-w-xs"
              />
              <Button
                variant="destructive"
                disabled={!canPurge || loading}
                onClick={handlePurge}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Dados Selecionados
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {results && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm font-medium text-foreground">Resultado:</p>
            {Object.entries(results).map(([cat, count]) => (
              <p key={cat} className="text-xs text-muted-foreground">
                {CATEGORIES.find(c => c.id === cat)?.label ?? cat}: {count} removido(s)
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
