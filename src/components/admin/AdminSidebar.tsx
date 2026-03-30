import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FolderKanban, DollarSign, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Clientes', path: '/admin/clients', icon: Building2 },
  { label: 'Usuários', path: '/admin/users', icon: Users },
  { label: 'Grupos', path: '/admin/groups', icon: FolderKanban },
  { label: 'Financeiro', path: '/admin/financial', icon: DollarSign },
  { label: 'Logs', path: '/admin/logs', icon: ScrollText },
];

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen fixed left-0 top-0 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <FolderKanban className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">Compliance Sync Admin</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">Multi-Tenant Admin v1.0</p>
      </div>
    </aside>
  );
};

export default AdminSidebar;
