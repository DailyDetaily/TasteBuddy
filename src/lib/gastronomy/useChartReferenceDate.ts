import { useEffect, useState, useMemo } from 'react';

/** Refresh date-based aggregates on day/time-zone changes without touching saved records. */
export function useChartReferenceDate(revision?: unknown) {
  const [reference, setReference] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setReference(previous => {
      const now = new Date();
      return previous.toDateString() === now.toDateString() && previous.getTimezoneOffset() === now.getTimezoneOffset() ? previous : now;
    });
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  return useMemo(() => new Date(), [reference, revision]);
}
