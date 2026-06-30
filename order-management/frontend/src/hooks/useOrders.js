import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrders } from '../api/client';

/**
 * Encapsulates orders-list data fetching: filter state, loading/error states,
 * pagination, and a manual refresh trigger. Kept separate from the table
 * component so the component stays purely presentational.
 */
export function useOrders({ status, search, page, limit }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  // Tracks in-flight requests so a slow earlier request can't overwrite
  // the result of a more recent one (e.g. user switches filters quickly).
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchOrders({ status, search, page, limit });
      if (requestId !== requestIdRef.current) return; // stale response, ignore
      setOrders(result.data);
      setPagination(result.pagination);
      setLastUpdatedAt(new Date());
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || 'Failed to load orders');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [status, search, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  return { orders, pagination, isLoading, error, lastUpdatedAt, refresh: load };
}
