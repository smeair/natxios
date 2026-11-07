import { useCallback, useEffect, useState } from 'react';
import { getFactOfDay } from '../lib/api.js';

export default function useFactOfDay() {
  const [state, setState] = useState({ status: 'loading', data: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading' }));
    try {
      setState({ status: 'ready', data: await getFactOfDay() });
    } catch {
      setState((s) => ({ ...s, status: 'error' }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
