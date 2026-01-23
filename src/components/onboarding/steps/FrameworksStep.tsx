import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import StepContainer from '../shared/StepContainer';
import { Badge } from '@/components/ui/badge';

interface Framework {
  id: string;
  name: string;
  description: string;
  icon: string;
  popular: boolean;
  controlsCount: number;
}

const availableFrameworks: Framework[] = [
  {
    id: 'soc2',
    name: 'SOC 2 Type II',
    description: 'System and Organization Controls para serviços',
    icon: '🛡️',
    popular: true,
    controlsCount: 64,
  },
  {
    id: 'iso27001',
    name: 'ISO 27001:2022',
    description: 'Sistema de Gestão de Segurança da Informação',
    icon: '📋',
    popular: true,
    controlsCount: 114,
  },
  {
    id: 'lgpd',
    name: 'LGPD',
    description: 'Lei Geral de Proteção de Dados',
    icon: '🇧🇷',
    popular: true,
    controlsCount: 42,
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    description: 'General Data Protection Regulation (UE)',
    icon: '🇪🇺',
    popular: false,
    controlsCount: 38,
  },
  {
    id: 'pci-dss',
    name: 'PCI DSS',
    description: 'Payment Card Industry Data Security Standard',
    icon: '💳',
    popular: false,
    controlsCount: 251,
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    description: 'Health Insurance Portability and Accountability',
    icon: '🏥',
    popular: false,
    controlsCount: 75,
  },
];

interface FrameworksStepProps {
  selectedFrameworks: string[];
  onSelect: (frameworks: string[]) => void;
}

const FrameworksStep = ({ selectedFrameworks, onSelect }: FrameworksStepProps) => {
  const toggleFramework = (id: string) => {
    if (selectedFrameworks.includes(id)) {
      onSelect(selectedFrameworks.filter((f) => f !== id));
    } else {
      onSelect([...selectedFrameworks, id]);
    }
  };

  return (
    <StepContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Escolha seus Frameworks</h2>
        <p className="text-muted-foreground">
          Selecione os frameworks de compliance que você deseja monitorar.
          Você pode adicionar mais depois.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {availableFrameworks.map((framework, index) => {
          const isSelected = selectedFrameworks.includes(framework.id);

          return (
            <motion.button
              key={framework.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleFramework(framework.id)}
              className={cn(
                'relative p-6 rounded-xl border-2 text-left transition-all duration-200',
                'hover:border-primary/50 hover:shadow-md',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-md'
                  : 'border-border bg-card'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}

              {/* Popular badge */}
              {framework.popular && (
                <Badge
                  variant="secondary"
                  className="absolute top-3 left-3 gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Popular
                </Badge>
              )}

              <div className="text-4xl mb-4 mt-4">{framework.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{framework.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {framework.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {framework.controlsCount} controles
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Selection feedback */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        {selectedFrameworks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Selecione pelo menos 1 framework para continuar
          </p>
        ) : (
          <p className="text-sm text-primary">
            ✓ {selectedFrameworks.length} framework(s) selecionado(s)
          </p>
        )}
      </motion.div>
    </StepContainer>
  );
};

export default FrameworksStep;
