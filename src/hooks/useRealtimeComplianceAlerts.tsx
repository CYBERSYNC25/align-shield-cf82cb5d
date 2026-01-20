import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UseRealtimeComplianceAlertsResult {
  isConnected: boolean;
  lastUpdate: Date | null;
  secondsAgo: number;
  relativeTime: string | null;
  newAlertIds: string[];
  clearNewAlerts: () => void;
}

export function useRealtimeComplianceAlerts(): UseRealtimeComplianceAlertsResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  const [newAlertIds, setNewAlertIds] = useState<string[]>([]);

  // Subscription to compliance_alerts table
  useEffect(() => {
    if (!user?.id) return;

    console.log('[Realtime] Setting up compliance_updates channel...');

    const channel = supabase
      .channel('compliance_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'compliance_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Realtime] Compliance alert update:', payload);
          
          // Invalidate React Query cache
          queryClient.invalidateQueries({ queryKey: ['compliance-alerts'] });
          queryClient.invalidateQueries({ queryKey: ['compliance-status'] });
          
          // Update timestamp
          setLastUpdate(new Date());
          
          // Handle new failing tests
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as {
              id: string;
              new_status: string;
              rule_title: string;
              integration_name: string;
              severity: string;
            };
            
            if (newAlert.new_status === 'fail') {
              toast.error('Nova Falha de Compliance Detectada', {
                description: `${newAlert.rule_title} - ${newAlert.integration_name}`,
                duration: 5000,
              });
              
              setNewAlertIds(prev => [...prev, newAlert.id]);
              
              // Clear highlight after 5 seconds
              setTimeout(() => {
                setNewAlertIds(prev => prev.filter(id => id !== newAlert.id));
              }, 5000);
            }
          }

          // Handle resolved alerts
          if (payload.eventType === 'UPDATE') {
            const updatedAlert = payload.new as {
              resolved: boolean;
              rule_title: string;
            };
            
            if (updatedAlert.resolved) {
              toast.success('Alerta Resolvido', {
                description: updatedAlert.rule_title,
                duration: 3000,
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          setLastUpdate(new Date());
        }
      });

    return () => {
      console.log('[Realtime] Cleaning up compliance_updates channel');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Timer for seconds ago counter
  useEffect(() => {
    if (!lastUpdate) return;
    
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdate.getTime()) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastUpdate]);

  const clearNewAlerts = useCallback(() => {
    setNewAlertIds([]);
  }, []);

  // Format relative time string
  const getRelativeTime = useCallback((): string | null => {
    if (!lastUpdate) return null;
    
    if (secondsAgo < 60) return `${secondsAgo}s`;
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m`;
    return `${Math.floor(secondsAgo / 3600)}h`;
  }, [secondsAgo, lastUpdate]);

  return {
    isConnected,
    lastUpdate,
    secondsAgo,
    relativeTime: getRelativeTime(),
    newAlertIds,
    clearNewAlerts,
  };
}
