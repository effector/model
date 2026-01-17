import { Store, combine } from 'effector';
import { Keyval, LensProxy } from './keyval';

// --- Unknown code, useless ---

export interface ListApi<M> {
  $items: Store<string[]>;
  filter: (
    fn: (instance: LensProxy<M>) => boolean | Store<boolean>,
  ) => ListApi<M>;
  sort: (fn: (a: LensProxy<M>, b: LensProxy<M>) => number) => ListApi<M>;
}

export function createListApi<M>(kv: Keyval<M>): ListApi<M> {
  return createListApiImpl(kv, kv.$items);
}

function createListApiImpl<M>(
  kv: Keyval<M>,
  $sourceIds: Store<string[]>,
): ListApi<M> {
  const api: ListApi<M> = {
    $items: $sourceIds,
    filter: (predicate) => {
      const $filteredIds = combine($sourceIds, kv.$state, (ids, state) => {
        return ids.filter((id) => {
          const itemState = state[id];
          if (!itemState) return false;

          const proxy = createSyncProxy(itemState);
          const result = predicate(proxy as any);

          if (result && typeof result === 'object' && 'getState' in result) {
            return (result as any).getState();
          }
          return result;
        });
      });

      return createListApiImpl(kv, $filteredIds);
    },
    sort: () => api,
  };
  return api;
}

function createSyncProxy(target: any): any {
  return new Proxy(target, {
    get: (obj, prop) => {
      const value = Reflect.get(obj, prop);

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return createSyncProxy(value);
      }

      return createMockStore(value);
    },
  });
}

function createMockStore(value: any) {
  return {
    getState: () => value,
    map: (fn: (v: any) => any) => createMockStore(fn(value)),
    watch: (fn: (v: any) => any) => {
      fn(value);
      return () => {};
    },
  };
}
