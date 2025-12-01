import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const COOLDOWN_MS = 60000; // 60 segundos entre alertas

export const useNetworkAlerts = (isOnline: boolean) => {
  const { user } = useAuth();
  const wasOnlineRef = useRef<boolean | null>(null);
  const lastOfflineAlertRef = useRef<number>(0);
  const lastOnlineAlertRef = useRef<number>(0);

  useEffect(() => {
    // Ignora a primeira renderização (inicialização)
    if (wasOnlineRef.current === null) {
      wasOnlineRef.current = isOnline;
      return;
    }

    // Detecta transição: Online → Offline
    const transitionedToOffline = wasOnlineRef.current === true && isOnline === false;
    
    // Detecta transição: Offline → Online (recuperação)
    const transitionedToOnline = wasOnlineRef.current === false && isOnline === true;

    if (transitionedToOffline && user) {
      const now = Date.now();
      const timeSinceLastAlert = now - lastOfflineAlertRef.current;

      // Cooldown anti-spam: só cria alerta se passou 60s
      if (timeSinceLastAlert > COOLDOWN_MS) {
        createOfflineNotification(user.id);
        lastOfflineAlertRef.current = now;
      }
    }

    if (transitionedToOnline && user) {
      const now = Date.now();
      const timeSinceLastAlert = now - lastOnlineAlertRef.current;

      // Cooldown anti-spam para notificação de recuperação
      if (timeSinceLastAlert > COOLDOWN_MS) {
        createOnlineNotification(user.id);
        lastOnlineAlertRef.current = now;
      }
    }

    // Atualiza o estado anterior
    wasOnlineRef.current = isOnline;
  }, [isOnline, user]);

  const createOfflineNotification = async (userId: string) => {
    const currentTime = format(new Date(), 'HH:mm:ss');
    
    try {
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: '🔴 Alerta Crítico: Dispositivo Offline',
        p_message: `O Agente MikroTik parou de enviar dados às ${currentTime}. Verifique a conexão do dispositivo.`,
        p_type: 'danger',
        p_priority: 'high',
        p_related_table: 'device_logs',
        p_metadata: {
          event: 'device_offline',
          detected_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Erro ao criar notificação de offline:', error);
      } else {
        console.log('✅ Notificação de offline criada com sucesso às', currentTime);
      }
    } catch (err) {
      console.error('Exceção ao criar notificação:', err);
    }
  };

  const createOnlineNotification = async (userId: string) => {
    const currentTime = format(new Date(), 'HH:mm:ss');
    
    try {
      const { error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: '🟢 Agente de Monitoramento Recuperado',
        p_message: `O Agente MikroTik voltou a enviar dados às ${currentTime}. Conexão restabelecida com sucesso.`,
        p_type: 'success',
        p_priority: 'normal',
        p_related_table: 'device_logs',
        p_metadata: {
          event: 'device_online',
          recovered_at: new Date().toISOString()
        }
      });

      if (error) {
        console.error('Erro ao criar notificação de recuperação:', error);
      } else {
        console.log('✅ Notificação de recuperação criada com sucesso às', currentTime);
      }
    } catch (err) {
      console.error('Exceção ao criar notificação de recuperação:', err);
    }
  };
};
