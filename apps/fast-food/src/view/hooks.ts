import { useMemo, useRef } from 'react';
import { useUnit } from 'effector-react';
import { select, isLens } from '@effector-model/core-experimental';
import { Store, is, createStore } from 'effector';

export function useLens<T>(lens: any, fallback: T): T {
  const storeRef = useRef<Store<T> | null>(null);
  const lensRef = useRef<any>(null);

  const $store = useMemo(() => {
    // 1. If it's already a store, just use it
    if (is.store(lens)) return lens;

    // 2. If it's not a lens, wrap fallback in a store
    if (!isLens(lens)) return createStore(fallback);

    // 3. Identification for memoization
    const pathStr = (lens as any).path?.join('.') || '';
    const lensId = is.store((lens as any).id)
      ? 'stable'
      : String((lens as any).id || '');

    if (
      storeRef.current &&
      lensRef.current &&
      ((lensRef.current as any).path?.join('.') || '') === pathStr &&
      (is.store(lensRef.current.id)
        ? 'stable'
        : String(lensRef.current.id || '')) === lensId
    ) {
      return storeRef.current;
    }

    // 4. Create new store from lens
    try {
      const s = select(lens).fallback(fallback);
      storeRef.current = s;
      lensRef.current = lens;
      return s;
    } catch (e) {
      console.warn('[useLens] Failed to create store from lens:', lens, e);
      return createStore(fallback);
    }
  }, [lens, fallback]);

  return useUnit($store);
}
