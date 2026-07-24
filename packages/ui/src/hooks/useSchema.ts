import { useCallback, useEffect, useState } from 'react';
import type { DatabaseSchema } from '@querydash/types';

export function useSchema(datasourceId?: string, apiBaseUrl = '', getAuthHeaders?: () => Record<string, string>) {
  const [schema, setSchema] = useState<DatabaseSchema>();
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!datasourceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/datasources/${datasourceId}/schema`, {
        headers: getAuthHeaders?.(),
      });
      if (res.ok) {
        setSchema(await res.json());
      }
    } finally {
      setLoading(false);
    }
    // getAuthHeaders is read fresh via the ref-free closure; it's stable per caller (module-level function) in practice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datasourceId, apiBaseUrl]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { schema, loading, refresh };
}
