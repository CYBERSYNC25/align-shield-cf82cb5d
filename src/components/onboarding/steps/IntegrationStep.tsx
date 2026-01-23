import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StepContainer from '../shared/StepContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Integration {
  id: string;
  name: string;
  category: string;
  description: string;
  benefit: string;
  logo: string;
}

const popularIntegrations: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    category: 'SDLC',
    description: 'Repositórios, branch protection, vulnerabilidades',
    benefit: 'Detecta repos públicos e branches desprotegidas',
    logo: '🔗',
  },
  {
    id: 'aws',
    name: 'AWS',
    category: 'Cloud',
    description: 'IAM, S3, EC2, CloudTrail',
    benefit: 'Monitora buckets públicos e permissões',
    logo: '☁️',
  },
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    category: 'IAM',
    description: 'Usuários, grupos, Drive, MFA',
    benefit: 'Verifica MFA e acessos compartilhados',
    logo: '📧',
  },
  {
    id: 'azure-ad',
    name: 'Azure AD',
    category: 'IAM',
    description: 'Identidades, grupos, conditional access',
    benefit: 'Analisa usuários sem MFA e privilégios',
    logo: '🔵',
  },
];

interface IntegrationStepProps {
  connectedIntegration: string | null;
  onConnect: (integrationId: string) => void;
}

const IntegrationStep = ({ connectedIntegration, onConnect }: IntegrationStepProps) => {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = async (integrationId: string) => {
    setConnecting(integrationId);
    // Simula conexão (na realidade, abriria modal de conexão)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onConnect(integrationId);
    setConnecting(null);
  };

  return (
    <StepContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Conecte sua Primeira Integração</h2>
        <p className="text-muted-foreground">
          Escolha uma integração para começar. Você pode adicionar mais depois.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {popularIntegrations.map((integration, index) => {
          const isConnected = connectedIntegration === integration.id;
          const isConnecting = connecting === integration.id;

          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'relative p-6 rounded-xl border-2 transition-all duration-200',
                isConnected
                  ? 'border-green-500 bg-green-500/5'
                  : 'border-border bg-card hover:border-primary/50'
              )}
            >
              {/* Connected indicator */}
              {isConnected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                <div className="text-4xl">{integration.logo}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{integration.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {integration.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {integration.description}
                  </p>
                  <p className="text-xs text-primary">
                    ✨ {integration.benefit}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                {isConnected ? (
                  <Button variant="outline" className="w-full" disabled>
                    <Check className="w-4 h-4 mr-2" />
                    Conectado
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleConnect(integration.id)}
                    disabled={isConnecting || connectedIntegration !== null}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Conectar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-sm text-muted-foreground text-center"
      >
        {connectedIntegration ? (
          <span className="text-green-600">
            ✓ Integração conectada! Você pode avançar ou conectar mais.
          </span>
        ) : (
          'Você pode pular esta etapa e conectar integrações depois'
        )}
      </motion.p>
    </StepContainer>
  );
};

export default IntegrationStep;
