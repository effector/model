import {
  Store,
  Event,
  Effect,
  createEffect,
  createEvent,
  createStore,
} from 'effector';

type Descriptor = 'store' | 'event' | 'effect';

type TypeMap = {
  store: Store<any>;
  event: Event<any>;
  effect: Effect<any, any, any>;
};

export let currentSkipLazyCb = true;
export let isRoot = true;

export function callInLazyStack<T extends () => any>(
  fn: T,
  skipLazyCb: boolean,
): ReturnType<T> {
  const prevLazyCb = currentSkipLazyCb;
  const prevIsRoot = isRoot;
  currentSkipLazyCb = skipLazyCb;
  isRoot = false;
  const result = fn();
  currentSkipLazyCb = prevLazyCb;
  isRoot = prevIsRoot;
  return result;
}

export function lazy<T>(creator: () => Store<T>): Store<T>;
export function lazy<
  S extends { [key: string]: Descriptor },
  R extends { [K in keyof S]: TypeMap[S[K]] },
>(shape: S, creator: () => R): R;
export function lazy<
  S extends readonly Descriptor[],
  R extends { [K in keyof S]: TypeMap[S[K]] },
>(shape: S, creator: () => R): R;

export function lazy(shapeRaw: any, creatorRaw?: () => any): any {
  const isSingle = typeof shapeRaw === 'function';
  const shape = isSingle ? { single: 'store' } : shapeRaw;
  const creator: () => any = isSingle ? shapeRaw : creatorRaw;
  if (currentSkipLazyCb) {
    const result = Array.isArray(shape) ? [] : ({} as any);
    for (const key in shape) {
      switch (shape[key]) {
        case 'store':
          result[key] = createStore(null, { serialize: 'ignore' }).map(
            (x: any) => x,
          );
          break;
        case 'event':
          result[key] = createEvent();
          break;
        case 'effect':
          result[key] = createEffect(() => {});
          break;
      }
    }
    return isSingle ? result.single : result;
  } else {
    return creator();
  }
}
