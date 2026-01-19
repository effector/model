import { useMemo, useRef } from 'react';
import { useUnit } from 'effector-react';
import { select, isLens, Lens } from '@effector-model/core-experimental';
import { Store, is, createStore } from 'effector';

export function useLens<T>(lens: Lens | Store<T> | T, fallback: T): T {
  const storeRef = useRef<Store<T> | null>(null);
  const lensRef = useRef<Lens | null>(null);

  const $store = useMemo(() => {
    // 1. If it's already a store, just use it
    if (is.store(lens)) return lens as Store<T>;

    // 2. If it's not a lens, wrap fallback in a store
    if (!isLens(lens)) {
      if (
        process.env.NODE_ENV !== 'production' &&
        lens !== null &&
        typeof lens === 'object'
      ) {
        console.error(
          '[useLens] Received an object that is neither a Lens nor a Store. Did you mean to use useLens(item.facets.something)? Received:',
          lens,
        );
      }
      return createStore(fallback);
    }

    const l = lens as Lens;

    // 3. Identification for memoization
    const pathStr = l.path?.join('.') || '';
    const lensId = is.store(l.id) ? 'stable' : String(l.id || '');

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
      const s = select(lens).fallback(fallback) as Store<T>;
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
