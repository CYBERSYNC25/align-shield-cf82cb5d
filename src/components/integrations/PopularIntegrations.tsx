import { Star, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface PopularIntegrationsProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const PopularIntegrations = ({ 
  title = "Integrações Populares",
  subtitle = "As mais utilizadas pela comunidade",
  children 
}: PopularIntegrationsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-yellow-500/10">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          {subtitle}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </motion.div>
  );
};
