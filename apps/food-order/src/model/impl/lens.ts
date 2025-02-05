import { Store, createStore } from 'effector';
import { LensItem, LensStore } from './types';

export function lensRead<T>(lens: LensStore<T> | LensItem<T>): Store<T> {
  return createStore(null as T);
}
