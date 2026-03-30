import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import TableOfContents from './TableOfContents';
import LegalFooter from './LegalFooter';
import { useState } from 'react';

interface Section {
  id: string;
  title: string;
}

interface OtherDoc {
  href: string;
  label: string;
  icon: 'terms' | 'privacy' | 'dpa';
}

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: Section[];
  otherDocs?: OtherDoc[];
  children: React.ReactNode;
}

const LegalPageLayout = ({
  title,
  subtitle,
  lastUpdated,
  sections,
  otherDocs = [],
  children,
}: LegalPageLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo e navegação */}
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <span className="font-bold text-lg hidden sm:inline">Compliance Sync</span>
              </Link>
              <span className="text-muted-foreground hidden sm:inline">/</span>
              <span className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-none">
                {title}
              </span>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar ao Início</span>
                </Button>
              </Link>

              {/* Menu mobile */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <div className="mt-6">
                    <TableOfContents sections={sections} otherDocs={otherDocs} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <TableOfContents sections={sections} otherDocs={otherDocs} />
            </div>
          </aside>

          {/* Conteúdo principal */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {/* Título da página */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground">{title}</h1>
              {subtitle && (
                <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground">
                Última atualização: {lastUpdated}
              </p>
            </div>

            {/* Seções */}
            <div className="divide-y divide-border/30">{children}</div>

            {/* Footer */}
            <LegalFooter lastUpdated={lastUpdated} />
          </main>
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;
