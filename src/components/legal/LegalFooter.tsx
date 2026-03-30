import { Link } from 'react-router-dom';
import { Printer, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegalFooterProps {
  lastUpdated: string;
}

const LegalFooter = ({ lastUpdated }: LegalFooterProps) => {
  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-12 pt-8 border-t border-border/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          <p>Última atualização: {lastUpdated}</p>
          <p className="mt-1">
            © {new Date().getFullYear()} Compliance Sync Systems. Todos os direitos reservados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={scrollToTop}
            className="gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Voltar ao topo
          </Button>
        </div>
      </div>

      {/* Links rápidos */}
      <div className="mt-6 pt-4 border-t border-border/30 flex flex-wrap gap-4 text-sm">
        <Link
          to="/legal/terms"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Termos de Serviço
        </Link>
        <Link
          to="/legal/privacy"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Política de Privacidade
        </Link>
        <Link
          to="/legal/dpa"
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          Acordo de Processamento de Dados
        </Link>
      </div>
    </footer>
  );
};

export default LegalFooter;
