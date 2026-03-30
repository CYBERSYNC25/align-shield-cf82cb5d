import { motion } from 'framer-motion';
import { Shield, Zap, Eye, Bell, Sparkles } from 'lucide-react';
import StepContainer from '../shared/StepContainer';

const features = [
  {
    icon: Shield,
    title: 'Compliance Automatizado',
    description: 'Monitore ISO 27001, SOC 2 e LGPD automaticamente',
  },
  {
    icon: Zap,
    title: 'Integrações Nativas',
    description: 'Conecte AWS, GitHub, Google e mais em minutos',
  },
  {
    icon: Eye,
    title: 'Visibilidade Total',
    description: 'Dashboard unificado de riscos e conformidade',
  },
  {
    icon: Bell,
    title: 'Alertas Proativos',
    description: 'Notificações em tempo real de desvios de compliance',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const WelcomeStep = () => {
  return (
    <StepContainer className="text-center">
      {/* Logo animation */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
          <Sparkles className="w-10 h-10 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold mb-4"
      >
        Bem-vindo ao <span className="text-primary">Compliance Sync</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xl text-muted-foreground mb-12 max-w-2xl"
      >
        Sua plataforma de Governança, Risco e Compliance automatizada.
        Vamos configurar tudo em poucos minutos!
      </motion.p>

      {/* Features grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl"
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.title}
              variants={item}
              className="p-6 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-sm text-muted-foreground"
      >
        ⏱️ Este setup leva aproximadamente 2-3 minutos
      </motion.p>
    </StepContainer>
  );
};

export default WelcomeStep;
