import { ReactNode } from 'react';
import { usePagination } from '@/hooks/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

interface PaginatedListProps<T> {
  items: T[];
  pageSize?: number;
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
  showPageInfo?: boolean;
  paginationPosition?: 'top' | 'bottom' | 'both';
}

export function PaginatedList<T>({
  items,
  pageSize = 20,
  renderItem,
  emptyState,
  className,
  showPageInfo = true,
  paginationPosition = 'bottom',
}: PaginatedListProps<T>) {
  const {
    paginatedItems,
    currentPage,
    totalPages,
    totalItems,
    setPage,
    hasNextPage,
    hasPrevPage,
    startIndex,
    endIndex,
  } = usePagination(items, { pageSize });

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Generate page numbers to show
    const getPageNumbers = () => {
      const pages: (number | 'ellipsis')[] = [];
      const maxVisible = 5;

      if (totalPages <= maxVisible) {
        // Show all pages
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        if (currentPage > 3) {
          pages.push('ellipsis');
        }

        // Show pages around current
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }

        if (currentPage < totalPages - 2) {
          pages.push('ellipsis');
        }

        // Always show last page
        if (!pages.includes(totalPages)) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
        {showPageInfo && (
          <p className="text-sm text-muted-foreground">
            Mostrando {startIndex} a {endIndex} de {totalItems} itens
          </p>
        )}
        
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => hasPrevPage && setPage(currentPage - 1)}
                className={cn(
                  'cursor-pointer',
                  !hasPrevPage && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>

            {getPageNumbers().map((page, idx) => (
              <PaginationItem key={idx}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setPage(page)}
                    isActive={page === currentPage}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => hasNextPage && setPage(currentPage + 1)}
                className={cn(
                  'cursor-pointer',
                  !hasNextPage && 'pointer-events-none opacity-50'
                )}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <div className={className}>
      {(paginationPosition === 'top' || paginationPosition === 'both') && 
        renderPagination()
      }
      
      <div className="space-y-4">
        {paginatedItems.map((item, index) => renderItem(item, index))}
      </div>

      {(paginationPosition === 'bottom' || paginationPosition === 'both') && 
        renderPagination()
      }
    </div>
  );
}

export default PaginatedList;
