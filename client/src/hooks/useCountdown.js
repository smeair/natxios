import { useEffect, useState } from 'react';

/** "5h 12m" until the given ISO time, updated every 30 seconds. */
export default function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return undefined;
    const t = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, [target]);
  if (!target) return '';
  const ms = Math.max(0, new Date(target).getTime() - now);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.max(1, Math.ceil((ms % 3_600_000) / 60_000));
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
