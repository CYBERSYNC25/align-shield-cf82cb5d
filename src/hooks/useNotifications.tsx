import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  priority: 'low' | 'normal' | 'high';
  read: boolean;
  action_url?: string;
  action_label?: string;
  related_table?: string;
  related_id?: string;
  metadata?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Subscribe to real-time notifications
    if (user) {
      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification;
              setNotifications(prev => [newNotification, ...prev]);
              
              // Show toast for critical notifications
              if (newNotification.priority === 'high' || newNotification.type === 'danger') {
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                  variant: newNotification.type === 'danger' ? 'destructive' : 'default'
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              setNotifications(prev => 
                prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
              );
            } else if (payload.eventType === 'DELETE') {
              setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  const createDemoNotification = async () => {
    if (!user) return;

    const demoNotifications = [
      {
        title: 'Auditoria Concluída',
        message: 'A auditoria SOC 2 foi finalizada com sucesso. Todos os controles foram verificados.',
        type: 'success' as const,
        priority: 'normal' as const
      },
      {
        title: 'Controle Crítico Falhou',
        message: 'O controle de backup automático falhou na última execução. Ação imediata necessária.',
        type: 'danger' as const,
        priority: 'high' as const
      },
      {
        title: 'Nova Política Disponível',
        message: 'A política de segurança da informação foi atualizada. Revise as mudanças.',
        type: 'info' as const,
        priority: 'low' as const
      },
      {
        title: 'Revisão de Acesso Pendente',
        message: 'Há 15 acessos pendentes de revisão no sistema HR. Prazo: 3 dias.',
        type: 'warning' as const,
        priority: 'normal' as const
      }
    ];

    const randomDemo = demoNotifications[Math.floor(Math.random() * demoNotifications.length)];

    try {
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: user.id,
        p_title: randomDemo.title,
        p_message: randomDemo.message,
        p_type: randomDemo.type,
        p_priority: randomDemo.priority
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao criar notificação demo:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const recentNotifications = notifications.slice(0, 5);

  return {
    notifications,
    recentNotifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createDemoNotification,
    refetch: fetchNotifications
  };
};