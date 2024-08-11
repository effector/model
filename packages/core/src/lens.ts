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
    };

function createLensStruct(
  struct: StructKeyval,
  pathDecl: PathDecl[],
  path: Array<KeyStore | string | number>,
  items: Store<any[]>,
) {
  const shape = {} as any;
  for (const key in struct.shape) {
    const item = struct.shape[key];
    if (item.type === 'structUnit') {
      switch (item.unit) {
        case 'store': {
          const $value = combine(
            [items, ...path],
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
                  case 'field': {
                    value = value[segment.value];
                    break;
                  }
                }
              }
              return value?.[key];
            },
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
          items,
        );
    }
  }
  return shape;
}

export function lens<Shape>(
  keyval: Keyval<any, any, any, Shape>,
  key: KeyStore | string | number,
): Shape {
  return createLensStruct(
    keyval.__struct,
    [{ type: 'index', pathIndex: 0 }],
    [key],
    keyval.$items,
  );
}
