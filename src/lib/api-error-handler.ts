/**
 * Standardized API error extraction for Edge Functions
 */
export const extractApiError = (error: unknown): string => {
  // Handle FunctionsHttpError from Supabase
  if (error && typeof error === 'object' && 'message' in error) {
    const err = error as { message: string; context?: { body?: string } };
    
    // Try to parse nested error from Edge Function response
    if (err.context?.body) {
      try {
        const parsed = JSON.parse(err.context.body);
        return parsed.error || parsed.message || err.message;
      } catch {
        return err.message;
      }
    }
    
    // Try to parse if message is JSON
    try {
      const parsed = JSON.parse(err.message);
      return parsed.error || parsed.message || err.message;
    } catch {
      return err.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Erro desconhecido. Tente novamente.';
};

/**
 * Extract success message from API response
 */
export const extractApiMessage = (data: unknown): string | null => {
  if (data && typeof data === 'object' && 'message' in data) {
    return (data as { message: string }).message;
  }
  return null;
};
