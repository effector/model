import { EntityList, KeyStore } from './types';

export function lens<Shape>(
  entityList: EntityList<any, any, any, Shape>,
  key: KeyStore,
) {
  return entityList.__lens;
}
