import { cn } from '@/lib/utils';

interface LegalSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const LegalSection = ({ id, title, children, className }: LegalSectionProps) => {
  return (
    <section
      id={id}
      className={cn('scroll-mt-24 py-8 first:pt-0', className)}
    >
      <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border/50">
        {title}
      </h2>
      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
};

export default LegalSection;
