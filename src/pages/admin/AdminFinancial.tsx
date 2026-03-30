import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Users } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const AdminFinancial = () => {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['admin-financial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, plan, monthly_value, status')
        .order('monthly_value', { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const totalRevenue = orgs.reduce((sum, o) => sum + (Number(o.monthly_value) || 0), 0);
  const activeClients = orgs.filter(o => o.status === 'active' || !o.status).length;
  const planCounts = orgs.reduce((acc: Record<string, number>, o) => {
    const plan = o.plan || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Visão financeira da plataforma</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{fmt(totalRevenue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeClients}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{fmt(activeClients > 0 ? totalRevenue / activeClients : 0)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Distribution by plan */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Plano</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 flex-wrap">
                  {Object.entries(planCounts).map(([plan, count]: [string, number]) => (
                    <div key={plan} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50">
                      <Badge variant="outline" className="capitalize">{plan}</Badge>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue table */}
            <Card>
              <CardHeader>
                <CardTitle>Receita por Cliente</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor Mensal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orgs.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{org.plan || 'free'}</Badge></TableCell>
                        <TableCell>
                          <Badge className={org.status === 'active' || !org.status
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                            {org.status === 'active' || !org.status ? 'Ativo' : org.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{fmt(Number(org.monthly_value) || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinancial;
