import { useState, useEffect, useRef, useCallback } from 'react';
import api, { apiCache, CACHE_TTL } from './axios';

// Re-export for convenience so pages only need one import
export { CACHE_TTL };

/**
 * useApiCache — Stale-While-Revalidate hook for GET requests.
 *
 * @param {string|null} url     – Relative API endpoint (e.g. '/employees').
 *                                Pass null / false to skip fetching.
 * @param {object}      options – { ttl, enabled, defaultValue }
 *   ttl          – How long (ms) before cached data is considered stale.
 *                  Default: CACHE_TTL.MEDIUM (60 s).
 *   enabled      – Set false to pause fetching (e.g. until a required param is ready).
 *   defaultValue – Value returned before any data is fetched (null by default).
 *
 * @returns {{ data, loading, error, refresh }}
 *   data    – Current data (from cache or fresh fetch).
 *   loading – true only on the very first load (no cache exists yet).
 *   error   – Axios error object if the last fetch failed.
 *   refresh – () => void  — Busts cache for this URL and re-fetches immediately.
 *
 * ─── Behaviour ────────────────────────────────────────────────────────────
 *  ⏳ Cache miss  → shows loading spinner → fetches → caches → shows data.
 *  ✅ Cache fresh → returns data instantly, NO fetch, NO spinner.
 *  🔄 Cache stale → returns stale data instantly (no spinner),
 *                   silently refetches in the background, updates when done.
 *  🔁 Mutation    → axios interceptor busts related cache automatically;
 *                   call refresh() to also update this hook's local state.
 */
const useApiCache = (url, options = {}) => {
  const {
    ttl = CACHE_TTL.MEDIUM,
    enabled = true,
    defaultValue = null,
  } = options;

  const cacheKey = url || '';

  // ── Synchronous initialisation from cache ─────────────────────────────
  // Initialise state from cache *before* the first render so the component
  // never flickers through an empty/loading state on return visits.
  const [data, setData] = useState(() => {
    if (!cacheKey || !enabled) return defaultValue;
    const entry = apiCache.get(cacheKey);
    return entry ? entry.data : defaultValue;
  });

  const [loading, setLoading] = useState(() => {
    if (!cacheKey || !enabled) return false;
    return !apiCache.has(cacheKey); // loading only when there is NO cached entry
  });

  const [error, setError] = useState(null);
  const abortRef  = useRef(null);
  const mountedRef = useRef(true);

  // ── Core fetch function ───────────────────────────────────────────────
  const doFetch = useCallback(async (silent = false) => {
    if (!url || !enabled) return;

    // Cancel any previous in-flight request for this hook instance.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await api.get(url, { signal: controller.signal });
      if (controller.signal.aborted || !mountedRef.current) return;

      // Write to shared cache
      apiCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
      setData(response.data);
    } catch (err) {
      if (err?.code === 'ERR_CANCELED' || controller.signal.aborted) return;
      if (mountedRef.current) setError(err);
    } finally {
      if (!controller.signal.aborted && mountedRef.current) setLoading(false);
    }
  }, [url, enabled, cacheKey]);

  // ── Effect: decide whether to fetch on mount / url change ────────────
  useEffect(() => {
    mountedRef.current = true;

    if (!url || !enabled) return;

    const entry = apiCache.get(cacheKey);

    if (entry) {
      // ✅ Cache hit — serve data synchronously, no spinner.
      setData(entry.data);
      setLoading(false);

      // 🔄 If the entry is stale, re-validate silently in the background.
      if (Date.now() - entry.timestamp > ttl) {
        doFetch(true); // silent = true → no loading indicator
      }
    } else {
      // ⏳ Cache miss — first-time load, show spinner.
      doFetch(false);
    }

    return () => {
      mountedRef.current = false;
      if (abortRef.current) abortRef.current.abort();
    };
  }, [url, enabled, ttl]);

  // ── Public refresh ────────────────────────────────────────────────────
  /** Bust the cache for this URL and trigger an immediate (non-silent) re-fetch. */
  const refresh = useCallback(() => {
    if (cacheKey) apiCache.delete(cacheKey);
    return doFetch(false);
  }, [cacheKey, doFetch]);

  return { data, loading, error, refresh };
};

export default useApiCache;
