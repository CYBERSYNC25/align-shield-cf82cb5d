import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import StepContainer from '../shared/StepContainer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScanResults } from '@/hooks/useOnboardingWizard';

type ScanState = 'idle' | 'running' | 'completed' | 'error';

const scanMessages = [
  'Iniciando análise de compliance...',
  'Verificando configurações de segurança...',
  'Analisando políticas de acesso...',
  'Aplicando regras de frameworks...',
  'Calculando score de conformidade...',
  'Finalizando relatório...',
];

interface FirstScanStepProps {
  scanCompleted: boolean;
  scanResults: ScanResults | null;
  onScanComplete: (results: ScanResults) => void;
}

const FirstScanStep = ({ scanCompleted, scanResults, onScanComplete }: FirstScanStepProps) => {
  const [scanState, setScanState] = useState<ScanState>(scanCompleted ? 'completed' : 'idle');
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [results, setResults] = useState<ScanResults | null>(scanResults);

  const runScan = async () => {
    setScanState('running');
    setProgress(0);
    setCurrentMessage(0);

    // Simula progresso do scan
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setProgress(i);
      if (i % 20 === 0 && i < 100) {
        setCurrentMessage((prev) => Math.min(prev + 1, scanMessages.length - 1));
      }
    }

    // Gera resultados simulados
    const simulatedResults: ScanResults = {
      score: 72 + Math.floor(Math.random() * 20),
      passing: 10 + Math.floor(Math.random() * 8),
      failing: 2 + Math.floor(Math.random() * 5),
    };

    setResults(simulatedResults);
    setScanState('completed');
    onScanComplete(simulatedResults);
  };

  const retryScan = () => {
    setResults(null);
    setScanState('idle');
  };

  // Se já completou anteriormente
  useEffect(() => {
    if (scanCompleted && scanResults) {
      setResults(scanResults);
      setScanState('completed');
    }
  }, [scanCompleted, scanResults]);

  return (
    <StepContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Seu Primeiro Scan</h2>
        <p className="text-muted-foreground">
          Execute uma análise de compliance para ver seu status atual
        </p>
      </motion.div>

      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {/* Idle state */}
          {scanState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Play className="w-12 h-12 text-primary" />
              </div>
              <p className="text-muted-foreground mb-6">
                Clique no botão para iniciar a análise de compliance
              </p>
              <Button size="lg" onClick={runScan} className="gap-2">
                <Play className="w-5 h-5" />
                Executar Primeiro Scan
              </Button>
            </motion.div>
          )}

          {/* Running state */}
          {scanState === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6"
              >
                <Loader2 className="w-12 h-12 text-primary" />
              </motion.div>

              <Progress value={progress} className="h-3 mb-4" />

              <motion.p
                key={currentMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-muted-foreground"
              >
                {scanMessages[currentMessage]}
              </motion.p>

              <p className="text-sm text-muted-foreground mt-2">
                {progress}% completo
              </p>
            </motion.div>
          )}

          {/* Completed state */}
          {scanState === 'completed' && results && (
            <motion.div
              key="completed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                <h3 className="text-xl font-semibold">Scan Concluído!</h3>
                <p className="text-muted-foreground">
                  Veja os resultados da sua análise de compliance
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="pt-6 text-center">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {results.score}%
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Score de Compliance
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Passing Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-green-500/5 border-green-500/20">
                    <CardContent className="pt-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-5xl font-bold text-green-600">
                          {results.passing}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Controles Passando
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Failing Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-destructive/5 border-destructive/20">
                    <CardContent className="pt-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                        <span className="text-5xl font-bold text-destructive">
                          {results.failing}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Issues Detectadas
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-center"
              >
                <Button variant="ghost" size="sm" onClick={retryScan} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Executar novamente
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* Error state */}
          {scanState === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Erro no Scan</h3>
              <p className="text-muted-foreground mb-6">
                Ocorreu um erro ao executar o scan. Tente novamente.
              </p>
              <Button onClick={runScan} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepContainer>
  );
};

export default FirstScanStep;
