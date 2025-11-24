import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Shield, 
  FileText, 
  Users, 
  AlertCircle, 
  Building2, 
  Database, 
  Settings,
  ChevronRight,
  Home,
  TrendingUp,
  ClipboardCheck,
  Scale,
  AlertTriangle,
  FileCheck2,
  UserCheck,
  ShieldCheck,
  Target,
  Activity
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string | number;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/'
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: ShieldCheck,
    children: [
      {
        id: 'controls',
        label: 'Controles & Frameworks',
        icon: Shield,
        href: '/controls'
      },
      {
        id: 'readiness',
        label: 'Prontidão',
        icon: Target,
        href: '/readiness',
        badge: 'Novo'
      },
      {
        id: 'audit',
        label: 'Auditorias',
        icon: ClipboardCheck,
        href: '/audit'
      }
    ]
  },
  {
    id: 'governance',
    label: 'Governança',
    icon: Scale,
    children: [
      {
        id: 'policies',
        label: 'Políticas & Treinamentos',
        icon: FileText,
        href: '/policies',
        badge: 'Novo'
      },
      {
        id: 'access-reviews',
        label: 'Revisões de Acesso',
        icon: UserCheck,
        href: '/access-reviews',
        badge: 3
      }
    ]
  },
  {
    id: 'risk-management',
    label: 'Gestão de Riscos',
    icon: AlertTriangle,
    children: [
      {
        id: 'risks',
        label: 'Riscos & Fornecedores',
        icon: AlertCircle,
        href: '/risks'
      },
      {
        id: 'incidents',
        label: 'Incidentes & Continuidade',
        icon: Building2,
        href: '/incidents'
      }
    ]
  },
  {
    id: 'data',
    label: 'Integrações & Dados',
    icon: Database,
    children: [
      {
        id: 'integrations',
        label: 'Hub de Integrações',
        icon: Database,
        href: '/integrations'
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: Activity,
        href: '/analytics',
        badge: 'Novo'
      },
      {
        id: 'reports',
        label: 'Relatórios',
        icon: BarChart3,
        href: '/reports'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    href: '/settings'
  }
];

const Sidebar = () => {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand group containing active route
  useEffect(() => {
    const findParentWithActiveChild = (items: SidebarItem[]): string | null => {
      for (const item of items) {
        if (item.children) {
          const hasActiveChild = item.children.some(
            child => child.href === location.pathname
          );
          if (hasActiveChild) return item.id;
        }
      }
      return null;
    };

    const activeParent = findParentWithActiveChild(sidebarItems);
    if (activeParent && !expandedItems.includes(activeParent)) {
      setExpandedItems(prev => [...prev, activeParent]);
    }
  }, [location.pathname]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveRoute = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = isActiveRoute(item.href);
    
    const content = (
      <>
        <item.icon className={cn('h-4 w-4 mr-3', level > 0 && 'h-3 w-3')} />
        <span className="flex-1 truncate">{item.label}</span>
        
        {item.badge && (
          <span className={cn(
            'ml-2 px-2 py-0.5 text-xs rounded-full',
            typeof item.badge === 'number' ? 'bg-primary text-primary-foreground' : 'bg-warning text-warning-foreground'
          )}>
            {item.badge}
          </span>
        )}
        
        {hasChildren && (
          <ChevronRight 
            className={cn(
              'h-4 w-4 ml-2 transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        )}
      </>
    );
    
    return (
      <div key={item.id}>
        {item.href ? (
          <NavLink
            to={item.href}
            className={({ isActive: navIsActive }) => cn(
              'w-full justify-start text-left h-10 px-3 mb-1 rounded-md transition-colors flex items-center',
              level > 0 && 'ml-4 text-sm',
              (navIsActive || isActive) 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {content}
          </NavLink>
        ) : (
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start text-left h-10 px-3 mb-1',
              level > 0 && 'ml-4 text-sm'
            )}
            onClick={() => hasChildren && toggleExpanded(item.id)}
          >
            {content}
          </Button>
        )}
        
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {item.children?.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-surface-elevated border-r border-card-border h-screen sticky top-16 overflow-y-auto">
      {/* APOC Branding */}
      <div className="p-4 border-b border-card-border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">APOC</h2>
            <p className="text-xs text-muted-foreground leading-tight">
              Automated Platform for<br />Online Compliance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-1">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </div>
    </aside>
  );
};

export default Sidebar;