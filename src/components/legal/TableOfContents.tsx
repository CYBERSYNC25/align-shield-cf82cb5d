import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { FileText, ScrollText, Shield } from 'lucide-react';

interface Section {
  id: string;
  title: string;
}

interface OtherDoc {
  href: string;
  label: string;
  icon: 'terms' | 'privacy' | 'dpa';
}

interface TableOfContentsProps {
  sections: Section[];
  otherDocs?: OtherDoc[];
}

const docIcons = {
  terms: ScrollText,
  privacy: Shield,
  dpa: FileText,
};

const TableOfContents = ({ sections, otherDocs = [] }: TableOfContentsProps) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const location = useLocation();

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(section.id);
              }
            });
          },
          {
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0,
          }
        );
        observer.observe(element);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav className="space-y-6">
      {/* Seções do documento atual */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Índice</h3>
        <ul className="space-y-1">
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
                  activeSection === section.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground'
                )}
              >
                <span className="mr-2 text-xs opacity-60">{index + 1}.</span>
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Links para outros documentos */}
      {otherDocs.length > 0 && (
        <div className="pt-4 border-t border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Outros Documentos
          </h3>
          <ul className="space-y-1">
            {otherDocs.map((doc) => {
              const Icon = docIcons[doc.icon];
              const isActive = location.pathname === doc.href;
              
              return (
                <li key={doc.href}>
                  <Link
                    to={doc.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                      'hover:bg-muted/50',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {doc.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default TableOfContents;
