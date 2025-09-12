import { Bell, Eye, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { 
    recentNotifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success text-success-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';  
      case 'danger': return 'bg-danger text-danger-foreground';
      case 'info': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover-scale">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-danger rounded-full flex items-center justify-center animate-pulse">
              <span className="text-[10px] text-danger-foreground font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto bg-surface-elevated/95 backdrop-blur-sm border-card-border/50 shadow-lg"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificações</span>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} nova{unreadCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
              Ver todas
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {recentNotifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            Nenhuma notificação
          </div>
        ) : (
          <>
            {recentNotifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className="flex items-start space-x-3 p-3 hover:bg-muted/50 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                      {notification.title}
                    </p>
                    {!notification.read && (
                      <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${getTypeColor(notification.type)}`} variant="secondary">
                      {notification.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {!notification.read && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification.id);
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Marcar como lida
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DropdownMenuItem>
            ))}
            
            <DropdownMenuSeparator />
            
            <div className="p-2 flex justify-between">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Marcar todas como lidas
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter;