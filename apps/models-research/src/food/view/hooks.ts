import { useMemo, useRef } from 'react';
import { useUnit } from 'effector-react';
import { select } from '@effector-model/core-experimental';
import { Store } from 'effector';

export function useLens<T>(lens: any, fallback: T): T {
  const storeRef = useRef<Store<T> | null>(null);
  const lensRef = useRef<any>(null);

  const $store = useMemo(() => {
    // Check if lens is structurally equal to previous
    if (
      storeRef.current &&
      lensRef.current &&
      lensRef.current.path.join('.') === lens.path.join('.') &&
      lensRef.current.id === lens.id // id store is usually stable
    ) {
      return storeRef.current;
    }

    const s = select(lens).fallback(fallback);
    storeRef.current = s;
    lensRef.current = lens;
    return s;
  }, [lens.path.join('.'), lens.id, fallback]);

  return useUnit($store);
}
