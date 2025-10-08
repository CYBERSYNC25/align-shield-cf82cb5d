import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Database, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    supabase: boolean;
    database: boolean;
  }>({
    supabase: false,
    database: false
  });
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      // Verificar conexão com Supabase fazendo uma query simples
      const { error } = await supabase
        .from('frameworks')
        .select('count')
        .limit(1);
      
      const isConnected = !error;
      
      setConnectionStatus({
        supabase: isConnected,
        database: isConnected
      });

    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setConnectionStatus({
        supabase: false,
        database: false
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (connected: boolean) => {
    return (
      <Badge variant={connected ? "default" : "destructive"}>
        {connected ? "Conectado" : "Desconectado"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Status das Conexões
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={checkConnection}
            disabled={isChecking}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionStatus.supabase)}
            <span className="text-sm">Supabase Client</span>
          </div>
          {getStatusBadge(connectionStatus.supabase)}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionStatus.database)}
            <span className="text-sm">Base de Dados</span>
          </div>
          {getStatusBadge(connectionStatus.database)}
        </div>

        {!connectionStatus.supabase && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-400">
                <p className="font-medium">Supabase desconectado</p>
                <p className="text-xs mt-1">
                  Verifique sua conexão ou clique em atualizar.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatus;