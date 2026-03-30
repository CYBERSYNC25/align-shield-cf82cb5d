import { ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-border/50 bg-surface-elevated/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Brand & Copyright */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                © {currentYear} <span className="font-bold">Compliance Sync Systems</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Automated Platform for Online Compliance
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Documentação
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Suporte
            </a>
            <Link to="/legal/privacy" className="hover:text-primary transition-colors">
              Privacidade
            </Link>
            <Link to="/legal/terms" className="hover:text-primary transition-colors">
              Termos de Uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
