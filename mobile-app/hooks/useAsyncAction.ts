import { useState, useCallback } from 'react';

export const useAsyncAction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    onSuccess?: (data: T) => void | Promise<void>,
    onError?: (err: string) => void
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      await onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Algo deu errado';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, execute, reset };
};
