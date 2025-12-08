import { useState } from 'react';
import { Search, Settings, User, ChevronDown, Shield, LogOut, ShieldCheck } from 'lucide-react';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import { ModeToggle } from '@/components/theme/ModeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const { user, signOut } = useAuth();

  const getUserInitials = () => {
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    return user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Usuário';
  };

  const getUserCompany = () => {
    return user?.user_metadata?.organization || 'Empresa';
  };

  return (
    <header className="h-16 bg-surface-elevated/95 backdrop-blur-sm border-b border-card-border/50 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      {/* Logo & Brand - Enterprise Security Identity */}
      <div className="flex items-center space-x-4 flex-1">
        <div className="flex items-center space-x-3 hover-glow rounded-lg p-2 transition-all duration-200">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide text-foreground">
              APOC
            </h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">
              Security & Compliance Platform
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
        <NotificationCenter />

        {/* Theme Toggle */}
        <ModeToggle />

        {/* Settings */}
        <Button variant="ghost" size="icon" className="hover-scale">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 hover:bg-muted/50 hover-scale rounded-lg">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all duration-200">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-semibold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-foreground">{getUserName()}</p>
                  <p className="text-xs text-muted-foreground">Administrador • {getUserCompany()}</p>
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
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{getUserName()}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
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
            <DropdownMenuItem 
              className="text-danger hover:bg-danger/10 hover:text-danger font-medium"
              onClick={signOut}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Sair da Conta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        ) : (
          <Button className="hover-scale" onClick={() => window.location.href = '/auth'}>
            <User className="h-4 w-4 mr-2" />
            Entrar
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;