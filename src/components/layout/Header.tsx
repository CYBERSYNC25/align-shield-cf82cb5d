import { Bell, Search, Settings, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import complianceSyncLogo from '@/assets/compliance-sync-logo.png';

const Header = () => {
  return (
    <header className="h-16 bg-surface-elevated border-b border-card-border flex items-center justify-between px-6 sticky top-0 z-50">
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center space-x-3">
          <img 
            src={complianceSyncLogo} 
            alt="ComplianceSync" 
            className="h-8 w-8 rounded-lg"
          />
          <div>
            <h1 className="text-xl font-bold text-foreground">ComplianceSync</h1>
            <p className="text-xs text-muted-foreground">Conformidade & Segurança Contínua</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 flex-1 justify-center max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar controles, políticas, evidências..." 
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-1 justify-end">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-danger rounded-full flex items-center justify-center">
            <span className="text-xs text-danger-foreground font-medium">3</span>
          </span>
        </Button>

        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground">JD</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-medium">João Silva</p>
                <p className="text-xs text-muted-foreground">Acme Corp</p>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;