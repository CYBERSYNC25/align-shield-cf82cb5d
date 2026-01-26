import { useForm, UseFormReturn, FieldValues, DefaultValues, Path, PathValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DOMPurify from 'dompurify';
import { useCallback } from 'react';

interface UseSecureFormOptions<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  sanitize?: boolean;
  onSubmit: (data: T) => Promise<void> | void;
}

interface UseSecureFormReturn<T extends FieldValues> extends UseFormReturn<T> {
  handleSecureSubmit: (e?: React.FormEvent) => Promise<void>;
  setSecureValue: <K extends Path<T>>(name: K, value: PathValue<T, K>) => void;
}

/**
 * Secure form hook with built-in validation and sanitization
 * 
 * Features:
 * - Zod schema validation
 * - Automatic HTML sanitization (XSS prevention)
 * - Null byte removal
 * - Whitespace trimming
 * - Double validation on submit
 */
export function useSecureForm<T extends FieldValues>({
  schema,
  defaultValues,
  sanitize = true,
  onSubmit,
}: UseSecureFormOptions<T>): UseSecureFormReturn<T> {
  const form = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });

  const sanitizeValue = useCallback((value: unknown): unknown => {
    if (!sanitize) return value;
    
    if (typeof value === 'string') {
      let sanitized = value.trim();
      sanitized = sanitized.replace(/\0/g, '');
      sanitized = DOMPurify.sanitize(sanitized, { ALLOWED_TAGS: [] });
      return sanitized;
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)])
      );
    }
    
    return value;
  }, [sanitize]);

  const setSecureValue = useCallback(<K extends Path<T>>(name: K, value: PathValue<T, K>) => {
    const sanitized = sanitizeValue(value) as PathValue<T, K>;
    form.setValue(name, sanitized, { shouldValidate: true });
  }, [form, sanitizeValue]);

  const handleSecureSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    await form.handleSubmit(async (data) => {
      const sanitizedData = sanitizeValue(data) as T;
      
      const result = schema.safeParse(sanitizedData);
      if (!result.success) {
        console.error('Post-sanitization validation failed:', result.error);
        return;
      }
      
      await onSubmit(result.data);
    })(e);
  }, [form, sanitizeValue, schema, onSubmit]);

  return {
    ...form,
    handleSecureSubmit,
    setSecureValue,
  };
}
