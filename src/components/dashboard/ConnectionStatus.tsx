import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Database, AlertCircle } from 'lucide-react';

const ConnectionStatus = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    supabase: boolean;
    database: boolean;
    environment: boolean;
  }>({
    supabase: false,
    database: false,
    environment: false
  });

  const checkConnection = async () => {
    try {
      // Verificar variáveis de ambiente
      const hasEnvVars = import.meta.env.VITE_SUPABASE_URL && 
        import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
        import.meta.env.VITE_SUPABASE_ANON_KEY && 
        import.meta.env.VITE_SUPABASE_ANON_KEY !== 'placeholder-key';

      // Verificar conexão com Supabase
      let supabaseConnected = false;
      let databaseConnected = false;

      if (hasEnvVars) {
        try {
          // Tentar fazer uma query simples para verificar a conexão
          const { data, error } = await supabase
            .from('frameworks')
            .select('count')
            .limit(1);
          
          supabaseConnected = !error;
          databaseConnected = !error;
          
          if (error) {
            console.log('Conexão Supabase:', error.message);
          }
        } catch (err) {
          console.log('Erro na verificação:', err);
        }
      }

      setConnectionStatus({
        environment: hasEnvVars,
        supabase: supabaseConnected,
        database: databaseConnected
      });

    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
    }
  };

  useEffect(() => {
    checkConnection();
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
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Status das Conexões
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionStatus.environment)}
            <span className="text-sm">Variáveis de Ambiente</span>
          </div>
          {getStatusBadge(connectionStatus.environment)}
        </div>
        
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

        {!connectionStatus.environment && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">Supabase não configurado</p>
                <p className="text-xs mt-1">
                  Clique no botão verde "Supabase" no canto superior direito para conectar.
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