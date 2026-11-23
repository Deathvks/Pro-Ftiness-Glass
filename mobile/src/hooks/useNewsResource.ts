import { useEffect, useEffectEvent, useState } from 'react';

const newsCache = new Map<string, unknown>();
const MAX_ENTRIES = 36;

export function useNewsResource<T>(key: string, load: () => Promise<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ key: string; version: number; data?: T; error?: Error }>();
  const request = useEffectEvent(load);
  useEffect(() => {
    if (!key) return;
    let active = true;
    void request().then(data => {
      if (!active) return;
      newsCache.delete(key);
      newsCache.set(key, data);
      if (newsCache.size > MAX_ENTRIES) {
        const oldest = newsCache.keys().next().value;
        if (oldest) newsCache.delete(oldest);
      }
      setResult({ key, version, data });
    }, error => {
      if (active) setResult({ key, version, error });
    });
    return () => { active = false; };
  }, [key, version]);

  const matching = result?.key === key ? result : undefined;
  return {
    data: matching?.data ?? newsCache.get(key) as T | undefined,
    error: matching?.version === version ? matching.error : undefined,
    loading: Boolean(key) && matching?.version !== version,
    reload: () => setVersion(current => current + 1),
  };
}
