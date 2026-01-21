import { useState, useMemo, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  pageSize?: number;
}

interface UsePaginationResult<T> {
  // Current page data
  paginatedItems: T[];
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  
  // Navigation
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Status
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  
  // Range info (for display)
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const { initialPage = 1, pageSize = 20 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page is within valid bounds
  const validPage = useMemo(() => {
    if (currentPage < 1) return 1;
    if (currentPage > totalPages) return totalPages;
    return currentPage;
  }, [currentPage, totalPages]);

  // Reset to page 1 if items change significantly
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(() => {
    return items.slice(startIndex, endIndex);
  }, [items, startIndex, endIndex]);

  const setPage = useCallback((page: number) => {
    const validatedPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validatedPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    setPage(validPage + 1);
  }, [validPage, setPage]);

  const prevPage = useCallback(() => {
    setPage(validPage - 1);
  }, [validPage, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  return {
    paginatedItems,
    currentPage: validPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNextPage: validPage < totalPages,
    hasPrevPage: validPage > 1,
    isFirstPage: validPage === 1,
    isLastPage: validPage === totalPages,
    startIndex: startIndex + 1, // 1-indexed for display
    endIndex,
  };
}

export default usePagination;
