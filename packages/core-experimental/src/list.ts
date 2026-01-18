import {
  Store,
  combine,
  EventCallable,
  createEvent,
  createEffect,
  sample,
} from 'effector';
import { Keyval, LensProxy, InferKeyvalInput } from './keyval';

// --- Unknown code, useless ---

export interface Cursor<M> {
  $items: Store<string[]>;
  filter: (
    fn: (instance: LensProxy<M>) => boolean | Store<boolean>,
  ) => Cursor<M>;
  sort: (fn: (a: LensProxy<M>, b: LensProxy<M>) => number) => Cursor<M>;
  remove: EventCallable<void>;
  map: <T>(fn: (item: LensProxy<M>) => T) => Store<T[]>;

  // Pagination
  slice: (start: number, end?: number) => Cursor<M>;
  take: (n: number) => Cursor<M>;
  skip: (n: number) => Cursor<M>;

  // Mutation
  update: EventCallable<{
    input?: Partial<InferKeyvalInput<M>>;
    state?: Record<string, unknown>;
  }>;

  // Processing
  forEach: (fn: (item: LensProxy<M>) => void) => EventCallable<void>;

  // Aggregation
  $size: Store<number>;
  $isEmpty: Store<boolean>;
  some: (fn: (instance: LensProxy<M>) => boolean) => Store<boolean>;
  every: (fn: (instance: LensProxy<M>) => boolean) => Store<boolean>;

  // Set Operations
  union: (other: Cursor<M>) => Cursor<M>;
  intersection: (other: Cursor<M>) => Cursor<M>;
}

export function createCursor<M>(kv: Keyval<M>): Cursor<M> {
  return createCursorImpl(kv, kv.$items);
}

function createCursorImpl<M>(
  kv: Keyval<M>,
  $sourceIds: Store<string[]>,
): Cursor<M> {
  const remove = createEvent();

  const removeFx = createEffect((ids: string[]) => {
    ids.forEach((id) => kv.remove(id));
  });

  sample({
    clock: remove,
    source: $sourceIds,
    target: removeFx,
  });

  const update = createEvent<{
    input?: Partial<InferKeyvalInput<M>>;
    state?: Record<string, unknown>;
  }>();
  const updateFx = createEffect(
    ({
      ids,
      payload,
    }: {
      ids: string[];
      payload: {
        input?: Partial<InferKeyvalInput<M>>;
        state?: Record<string, unknown>;
      };
    }) => {
      ids.forEach((id) => kv.update({ id, ...payload }));
    },
  );

  sample({
    clock: update,
    source: $sourceIds,
    fn: (ids, payload) => ({ ids, payload }),
    target: updateFx,
  });

  const api: Cursor<M> = {
    $items: $sourceIds,
    remove,
    update,
    $size: $sourceIds.map((s) => s.length),
    $isEmpty: $sourceIds.map((s) => s.length === 0),

    slice: (start, end) =>
      createCursorImpl(
        kv,
        $sourceIds.map((ids) => ids.slice(start, end)),
      ),
    take: (n) =>
      createCursorImpl(
        kv,
        $sourceIds.map((ids) => ids.slice(0, n)),
      ),
    skip: (n) =>
      createCursorImpl(
        kv,
        $sourceIds.map((ids) => ids.slice(n)),
      ),

    forEach: (fn) => {
      const trigger = createEvent<void>();
      const fx = createEffect(
        ({ ids, state }: { ids: string[]; state: Record<string, unknown> }) => {
          ids.forEach((id) => {
            if (!state[id]) return;
            const proxy = createValueProxy(state[id]);
            fn(proxy as LensProxy<M>);
          });
        },
      );
      sample({
        clock: trigger,
        source: { ids: $sourceIds, state: kv.$state },
        target: fx,
      });
      return trigger;
    },

    some: (predicate) =>
      combine($sourceIds, kv.$state, (ids, state) => {
        return ids.some((id) => {
          const itemState = state[id];
          if (!itemState) return false;
          const proxy = createSyncProxy(itemState);
          const result = predicate(proxy as LensProxy<M>);
          if (result && typeof result === 'object' && 'getState' in result) {
            return (result as unknown as MockStore<boolean>).getState();
          }
          return result;
        });
      }),

    every: (predicate) =>
      combine($sourceIds, kv.$state, (ids, state) => {
        return ids.every((id) => {
          const itemState = state[id];
          if (!itemState) return false;
          const proxy = createSyncProxy(itemState);
          const result = predicate(proxy as LensProxy<M>);
          if (result && typeof result === 'object' && 'getState' in result) {
            return (result as unknown as MockStore<boolean>).getState();
          }
          return result;
        });
      }),

    union: (other) => {
      const $union = combine($sourceIds, other.$items, (a, b) => {
        return Array.from(new Set([...a, ...b]));
      });
      return createCursorImpl(kv, $union);
    },

    intersection: (other) => {
      const $intersection = combine($sourceIds, other.$items, (a, b) => {
        return a.filter((x) => b.includes(x));
      });
      return createCursorImpl(kv, $intersection);
    },

    map: <T>(fn: (item: LensProxy<M>) => T) => {
      return combine($sourceIds, kv.$state, (ids, state) => {
        return ids.map((id) => {
          const itemState = state[id];
          // Graceful handling for missing state (though shouldn't happen if id is in list)
          if (!itemState) return null as unknown;

          const proxy = createValueProxy(itemState);
          const result = fn(proxy as LensProxy<M>);

          if (result && typeof result === 'object' && 'getState' in result) {
            return (result as unknown as MockStore<unknown>).getState();
          }
          return result;
        });
      }) as unknown as Store<T[]>;
    },
    filter: (predicate) => {
      const $filteredIds = combine($sourceIds, kv.$state, (ids, state) => {
        return ids.filter((id) => {
          const itemState = state[id];
          if (!itemState) return false;

          const proxy = createSyncProxy(itemState);
          const result = predicate(proxy as LensProxy<M>);

          if (result && typeof result === 'object' && 'getState' in result) {
            return (result as unknown as MockStore<boolean>).getState();
          }
          return result;
        });
      });

      return createCursorImpl(kv, $filteredIds);
    },
    sort: (comparator) => {
      const $sortedIds = combine($sourceIds, kv.$state, (ids, state) => {
        return [...ids].sort((aId, bId) => {
          const stateA = state[aId];
          const stateB = state[bId];
          if (!stateA) return 0;
          if (!stateB) return 0;

          const proxyA = createValueProxy(stateA) as LensProxy<M>;
          const proxyB = createValueProxy(stateB) as LensProxy<M>;

          return comparator(proxyA, proxyB);
        });
      });
      return createCursorImpl(kv, $sortedIds);
    },
  };
  return api;
}

function createValueProxy(target: object): unknown {
  return new Proxy(target, {
    get: (obj, prop) => {
      const value = Reflect.get(obj, prop);

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return createValueProxy(value);
      }

      return value;
    },
  });
}

function createSyncProxy(target: object): unknown {
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

interface MockStore<T> {
  getState: () => T;
  map: <R>(fn: (v: T) => R) => MockStore<R>;
  watch: (fn: (v: T) => void) => () => void;
}

function createMockStore<T>(value: T): MockStore<T> {
  return {
    getState: () => value,
    map: (fn) => createMockStore(fn(value)),
    watch: (fn) => {
      fn(value);
      return () => {};
    },
  };
}
