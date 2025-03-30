import { combine, Store } from 'effector';
import { Keyval, KeyStore, LensStore, LensEvent, StructKeyval } from './types';

type PathDecl =
  | {
      type: 'index';
      /** position of index value in path itself */
      pathIndex: number;
    }
  | {
      type: 'field';
      value: string;
    }
  | {
      type: 'has';
      /** position of index value in path itself */
      pathIndex: number;
    };

function createPathReaderStore(
  struct: StructKeyval,
  pathDecl: PathDecl[],
  path: Array<KeyStore | string | number>,
  $items: Store<any[]>,
) {
  const isHas =
    pathDecl.length > 0 && pathDecl[pathDecl.length - 1].type === 'has';
  const $value = combine(
    [$items, ...path],
    ([items, ...pathKeysRaw]) => {
      const pathKeys = pathKeysRaw as Array<string | number>;
      let value: any = items;
      for (const segment of pathDecl) {
        if (value === undefined) return undefined;
        switch (segment.type) {
          case 'index': {
            const id = pathKeys[segment.pathIndex];
            value = value.find((e: any) => struct.getKey(e) === id);
            break;
          }
          case 'has': {
            const id = pathKeys[segment.pathIndex];
            value = value.findIndex((e: any) => struct.getKey(e) === id) !== -1;
            break;
          }
          case 'field': {
            value = value[segment.value];
            break;
          }
        }
      }
      return isHas ? !!value : value;
    },
    { skipVoid: false },
  );
  return $value;
}

function createLensStruct(
  struct: StructKeyval,
  pathDecl: PathDecl[],
  path: Array<KeyStore | string | number>,
  $items: Store<any[]>,
) {
  const shape = {} as any;
  for (const key in struct.shape) {
    const item = struct.shape[key];
    if (item.type === 'structUnit') {
      switch (item.unit) {
        case 'store': {
          const $value = createPathReaderStore(
            struct,
            [...pathDecl, { type: 'field', value: key }],
            path,
            $items,
          );
          shape[key] = {
            __type: 'lensStore',
            store: $value,
          } as LensStore<any>;
          break;
        }
        case 'event': {
          shape[key] = {
            __type: 'lensEvent',
            __value: null,
          } as LensEvent<any>;
          break;
        }
        case 'effect': {
          console.error('effects are not supported in lens');
          break;
        }
      }
    } else {
      shape[key] = (childKey: KeyStore | string | number) =>
        createLensStruct(
          item,
          [
            ...pathDecl,
            { type: 'field', value: key },
            { type: 'index', pathIndex: path.length },
          ],
          [...path, childKey],
          $items,
        );
      shape[key].itemStore = (childKey: KeyStore | string | number) =>
        createPathReaderStore(
          struct,
          [
            ...pathDecl,
            { type: 'field', value: key },
            { type: 'index', pathIndex: path.length },
          ],
          [...path, childKey],
          $items,
        );
      shape[key].has = (childKey: KeyStore | string | number) =>
        createPathReaderStore(
          struct,
          [
            ...pathDecl,
            { type: 'field', value: key },
            { type: 'has', pathIndex: path.length },
          ],
          [...path, childKey],
          $items,
        );
    }
  }
  return shape;
}

export function lens<Shape>(
  keyval: Keyval<any, any, any, Shape>,
  key: KeyStore | string | number,
): Shape;
export function lens<T, Shape>(
  keyval: Keyval<any, T, any, Shape>,
): {
  item(key: KeyStore): Shape;
  itemStore(key: KeyStore): Store<T>;
  has(key: KeyStore): Store<boolean>;
};
export function lens<T, Shape>(
  keyval: Keyval<any, T, any, Shape>,
  key?: KeyStore | string | number,
) {
  if (key === undefined) {
    return {
      item(key: KeyStore) {
        return createLensStruct(
          keyval.__struct,
          [{ type: 'index', pathIndex: 0 }],
          [key],
          keyval.$items,
        );
      },
      itemStore(key: KeyStore) {
        return createPathReaderStore(
          keyval.__struct,
          [{ type: 'index', pathIndex: 0 }],
          [key],
          keyval.$items,
        );
      },
      has(key: KeyStore) {
        return createPathReaderStore(
          keyval.__struct,
          [{ type: 'has', pathIndex: 0 }],
          [key],
          keyval.$items,
        );
      },
    };
  } else {
    return createLensStruct(
      keyval.__struct,
      [{ type: 'index', pathIndex: 0 }],
      [key],
      keyval.$items,
    );
  }
}
