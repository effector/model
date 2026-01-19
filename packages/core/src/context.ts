import { Store, createStore } from 'effector';
import type { StoreContext } from './types';

export function createContext<T>(defaultValue: T): StoreContext<T> {
  return {
    type: 'storeContext',
    __: defaultValue,
  };
}

export function readContext<T>(ctx: StoreContext<T>) {
  const $value = createStore(ctx.__);
  return $value;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export function setContext<T>(ctx: StoreContext<T>, value: Store<T> | T) {}
