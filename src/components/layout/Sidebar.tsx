import { cn } from '@/lib/utils';
import { 
  BarChart3, 
  Shield, 
  FileText, 
  Users, 
  AlertCircle, 
  Building, 
  Database, 
  Settings,
  ChevronRight,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    active: true
  },
  {
    id: 'compliance',
    label: 'Postura de Conformidade',
    icon: Shield,
    badge: '87%'
  },
  {
    id: 'controls',
    label: 'Controles & Frameworks',
    icon: BarChart3,
    children: [
      { id: 'soc2', label: 'SOC 2 Type II', icon: Shield },
      { id: 'iso27001', label: 'ISO 27001', icon: Shield },
      { id: 'lgpd', label: 'LGPD', icon: Shield },
      { id: 'gdpr', label: 'GDPR', icon: Shield }
    ]
  },
  {
    id: 'integrations',
    label: 'Hub de Integrações',
    icon: Database,
    badge: 12
  },
  {
    id: 'policies',
    label: 'Políticas & Treinamentos',
    icon: FileText,
    badge: 'Novo'
  },
  {
    id: 'access-reviews',
    label: 'Revisões de Acesso',
    icon: Users,
    badge: 3
  },
  {
    id: 'risks',
    label: 'Riscos & Fornecedores',
    icon: AlertCircle
  },
  {
    id: 'incidents',
    label: 'Incidentes & Continuidade',
    icon: Building
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings
  }
];

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['controls']);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    
    return (
      <div key={item.id}>
        <Button
          variant={item.active ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start text-left h-10 px-3 mb-1',
            level > 0 && 'ml-4 text-sm',
            item.active && 'bg-primary/10 text-primary border-primary/20'
          )}
          onClick={() => hasChildren && toggleExpanded(item.id)}
        >
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
        </Button>
        
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
      <div className="p-4 space-y-1">
        {sidebarItems.map(item => renderSidebarItem(item))}
      </div>
    </aside>
  );
};

export default Sidebar;