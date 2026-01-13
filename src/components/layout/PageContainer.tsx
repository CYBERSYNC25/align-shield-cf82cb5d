import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  preventOverflow?: boolean;
}

/**
 * PageContainer - Componente wrapper reutilizável para consistência de layout
 * 
 * Aplica:
 * - max-w-[1600px] para limitar largura em monitores ultrawide
 * - mx-auto para centralizar
 * - Padding horizontal responsivo
 * - Espaçamento vertical consistente
 */
const PageContainer = ({ children, className, preventOverflow = false }: PageContainerProps) => {
  return (
    <div className={cn(
      "w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-8",
      preventOverflow && "overflow-x-hidden",
      className
    )}>
      {children}
    </div>
  );
};

export default PageContainer;
