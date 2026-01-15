import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('IncidentsTest');

const IncidentsTest = () => {
  useEffect(() => {
    logger.debug('IncidentsTest component mounted successfully');
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold">Teste - Página de Incidentes</h1>
      <p className="mt-4">Se você consegue ver esta página, o roteamento está funcionando.</p>
      <p className="mt-2">Verifique o console para logs de debug.</p>
    </div>
  );
};

export default IncidentsTest;