import { useState } from "react";
import { Bell, Mail, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ComingSoonIntegration {
  id: string;
  name: string;
  description: string;
  logo?: string;
  category: string;
}

interface ComingSoonSectionProps {
  integrations: ComingSoonIntegration[];
}

export const ComingSoonSection = ({ integrations }: ComingSoonSectionProps) => {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Por favor, insira um email válido');
      return;
    }

    setIsSubscribing(true);
    // Simulate subscription
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Inscrito com sucesso! Você será notificado sobre novas integrações.');
    setEmail('');
    setIsSubscribing(false);
  };

  if (integrations.length === 0) return null;

  return (
    <div className="space-y-6">
      {/* Newsletter Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-dashed border-primary/30">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    Seja notificado sobre novas integrações
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receba um email quando adicionarmos novos conectores ao marketplace
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                  />
                </div>
                <Button onClick={handleSubscribe} disabled={isSubscribing}>
                  {isSubscribing ? 'Inscrevendo...' : 'Inscrever'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Coming Soon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
          >
            <Card className="relative overflow-hidden opacity-60 hover:opacity-80 transition-opacity cursor-not-allowed">
              {/* Coming Soon Badge */}
              <div className="absolute top-3 right-3 z-10">
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  Em Breve
                </Badge>
              </div>

              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {integration.logo ? (
                    <img 
                      src={integration.logo} 
                      alt={integration.name} 
                      className="w-12 h-12 rounded-lg grayscale"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <span className="text-2xl grayscale">📦</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {integration.description}
                    </p>
                  </div>
                </div>
              </CardContent>

              {/* Overlay Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-muted/20 pointer-events-none" />
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
