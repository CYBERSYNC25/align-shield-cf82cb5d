import { Bell, Search, Settings, User, ChevronDown, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
    <header className="h-16 bg-surface-elevated/95 backdrop-blur-sm border-b border-card-border/50 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      {/* Logo & Brand */}
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center space-x-3 hover-glow rounded-lg p-2 transition-all duration-200">
          <div className="relative">
            <img 
              src={complianceSyncLogo} 
              alt="ComplianceSync" 
              className="h-9 w-9 rounded-lg shadow-sm"
            />
            <div className="absolute -top-1 -right-1">
              <Shield className="h-4 w-4 text-success drop-shadow-sm" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground bg-gradient-primary bg-clip-text text-transparent">
              ComplianceSync
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Conformidade & Segurança Contínua
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4 flex-1 justify-center max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar controles, políticas, evidências..." 
            className="pl-10 bg-background/80 border-border/60 focus:bg-background focus:border-primary/60 transition-all duration-200 shadow-sm hover:shadow-md"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Badge variant="outline" className="text-xs px-2 py-1 bg-muted/50">
              ⌘K
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center space-x-3 flex-1 justify-end">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover-scale">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger rounded-full flex items-center justify-center animate-pulse">
            <span className="text-[10px] text-danger-foreground font-bold">3</span>
          </span>
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="hover-scale">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 hover:bg-muted/50 hover-scale rounded-lg">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                  JS
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold text-foreground">João Silva</p>
                <p className="text-xs text-muted-foreground">Administrador • Acme Corp</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 bg-surface-elevated/95 backdrop-blur-sm border-card-border/50 shadow-lg"
          >
            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">JS</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">João Silva</p>
                  <p className="text-xs text-muted-foreground">joao.silva@acme.com</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="hover:bg-muted/80">
              <User className="mr-3 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-muted/80">
              <Settings className="mr-3 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuItem className="hover:bg-muted/80">
              <Shield className="mr-3 h-4 w-4" />
              Segurança
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger hover:bg-danger/10 hover:text-danger font-medium">
              Sair da Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;