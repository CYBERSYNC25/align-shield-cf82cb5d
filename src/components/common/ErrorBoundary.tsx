import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { createLogger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';

const logger = createLogger('ErrorBoundary');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    logger.error('Uncaught error in component tree', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Persist error to centralized logging system
    this.persistErrorToBackend(error, errorInfo);
  }

  private async persistErrorToBackend(error: Error, errorInfo: ErrorInfo) {
    try {
      await supabase.functions.invoke('log-event', {
        body: {
          level: 'critical',
          source: 'frontend',
          message: `React Error Boundary: ${error.message}`,
          stack_trace: error.stack,
          component_name: 'ErrorBoundary',
          metadata: {
            componentStack: errorInfo.componentStack,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            timestamp: new Date().toISOString(),
          }
        }
      });
    } catch (e) {
      console.error('Failed to persist error to backend:', e);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                
                <h2 className="text-xl font-semibold text-foreground">
                  Algo deu errado
                </h2>
                
                <p className="text-muted-foreground">
                  Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
                </p>

                {import.meta.env.DEV && this.state.error && (
                  <details className="w-full text-left mt-4">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Detalhes técnicos
                    </summary>
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                      {this.state.error.message}
                      {'\n\n'}
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                <div className="flex flex-col sm:flex-row gap-2 w-full pt-4">
                  <Button
                    variant="outline"
                    onClick={this.handleRetry}
                    className="flex-1 gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                  <Button
                    onClick={this.handleGoHome}
                    className="flex-1 gap-2"
                  >
                    <Home className="h-4 w-4" />
                    Voltar ao Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Smaller boundary for sections within a page
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    logger.error('Uncaught error in section', {
      error: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  Erro ao carregar esta seção
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={this.handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;
