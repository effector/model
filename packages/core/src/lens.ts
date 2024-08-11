import { Keyval, KeyStore } from './types';

export function lens<Shape>(
  keyval: Keyval<any, any, any, Shape>,
  key: KeyStore,
) {
  return keyval.__lens;
}
