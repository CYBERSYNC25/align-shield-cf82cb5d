import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, DollarSign, Activity } from 'lucide-react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const [orgsRes, profilesRes, adminsRes] = await Promise.all([
        supabase.from('organizations').select('id, plan, monthly_value, status'),
        supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
        supabase.from('platform_admins' as any).select('id', { count: 'exact', head: true }),
      ]);

      const orgs = (orgsRes.data || []) as any[];
      const activeOrgs = orgs.filter((o: any) => o.status === 'active' || !o.status);
      const totalRevenue = orgs.reduce((sum: number, o: any) => sum + (Number(o.monthly_value) || 0), 0);

      return {
        totalClients: orgs.length,
        activeClients: activeOrgs.length,
        totalUsers: profilesRes.count || 0,
        totalAdmins: adminsRes.count || 0,
        totalRevenue,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da plataforma multi-tenant</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Cadastrados</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalClients || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.activeClients || 0} ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Totais</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">em todos os tenants</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">valor recorrente</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats?.totalAdmins || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">da plataforma</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
