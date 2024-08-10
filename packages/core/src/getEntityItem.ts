import {
  EventCallable,
  Store,
  combine,
  createEvent,
  createStore,
  is,
  sample,
} from 'effector';

import type { EntityList } from './types';

export function getEntityItem<T, Api, Key extends string | number, Shape>(config: {
  source: EntityList<any, T, Api, Shape>;
  key: Store<string | number> | string | number;
  defaultValue: (key: Key) => T;
}): [Store<T>, Api];
export function getEntityItem<T, Api, Shape>(config: {
  source: EntityList<any, T, Api, Shape>;
  key: Store<string | number> | string | number;
}): [Store<T | null>, Api];
export function getEntityItem<T, Api, Shape>({
  source,
  key,
  defaultValue,
}: {
  source: EntityList<any, T, Api, Shape>;
  key: Store<string | number> | string | number;
  defaultValue?: (key: string | number) => T;
}) {
  const $key = is.store(key) ? key : createStore(key);
  const $defaultValue = combine($key, (key) =>
    defaultValue ? defaultValue(key) : null
  );
  const $item = combine(
    source.$keys,
    source.$items,
    $key,
    $defaultValue,
    (keys, items, key, defValue) => {
      const idx = keys.findIndex((e) => e === key);
      if (idx === -1) return defValue;
      return items[idx];
    }
  );
  const api = {} as any;
  for (const key in source.api) {
    const trigger = createEvent<any>();
    const target = source.api[key] as EventCallable<{
      key: string | number;
      data: any;
    }>;
    sample({
      clock: trigger,
      source: $key,
      fn: (key, data) => ({ key, data }),
      target,
    });
    api[key] = trigger;
  }
  return [$item, api];
}

type IsNever<T> = [T] extends [never] ? true : false;

type InternalIsUnion<T, U = T> = (
  // @link https://ghaiklor.github.io/type-challenges-solutions/en/medium-isunion.html
  IsNever<T> extends true
    ? false
    : T extends any
    ? [U] extends [T]
      ? false
      : true
    : never
) extends infer Result
  ? // In some cases `Result` will return `false | true` which is `boolean`,
    // that means `T` has at least two types and it's a union type,
    // so we will return `true` instead of `boolean`.
    boolean extends Result
    ? true
    : Result
  : never; // Should never happen

type IsUnion<T> = InternalIsUnion<T>;

type SingleKeyObject<ObjectType> = IsUnion<keyof ObjectType> extends true
  ? never
  : ObjectType;
