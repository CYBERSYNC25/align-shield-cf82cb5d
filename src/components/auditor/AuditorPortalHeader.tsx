import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Eye } from 'lucide-react';

const AuditorPortalHeader = () => {
  return (
    <header className="h-16 bg-surface-elevated border-b border-border fixed top-0 left-0 right-0 z-50">
      <div className="h-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-wide text-foreground">APOC</span>
        </div>

        {/* Read-Only Badge */}
        <Badge 
          variant="outline" 
          className="bg-info/10 text-info border-info/30 px-3 py-1.5 text-xs sm:text-sm font-medium"
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          <span className="hidden sm:inline">VISÃO DO AUDITOR EXTERNO - </span>
          MODO LEITURA
        </Badge>
      </div>
    </header>
  );
};

export default AuditorPortalHeader;
