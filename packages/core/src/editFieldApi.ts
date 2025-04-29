import { type Store } from 'effector';

import type { Keyval, KeyOrKeys, Model, StoreDef } from './types';

export function createEditFieldApi<Input, Enriched, Output, Api, Shape>(
  keyField: keyof Input | null,
  kvModel:
    | Model<
        {
          [K in keyof Input]?: Store<Input[K]> | StoreDef<Input[K]>;
        },
        Output,
        Api,
        Shape
      >
    | undefined,
  editApiUpdate: Keyval<Input, Enriched, Api, Shape>['edit']['update'],
): Keyval<Input, Enriched, Api, Shape>['editField'] {
  const editField = {} as any;

  //TODO add support for generated keys
  if (kvModel && keyField) {
    const structShape = kvModel.__struct!.shape;
    for (const field in structShape) {
      const fieldStruct = structShape[field];
      if (fieldStruct.type === 'structUnit') {
        // derived stores are not supported
        if (fieldStruct.unit === 'store' && fieldStruct.derived) {
          continue;
        }
        const fieldEditor = editApiUpdate.prepend(
          (upd: { key: KeyOrKeys; data: any }) => {
            const keySet = Array.isArray(upd.key) ? upd.key : [upd.key];
            const dataSet: Array<any> = Array.isArray(upd.key)
              ? upd.data
              : [upd.data];
            const results = [] as Partial<Input>[];
            for (let i = 0; i < keySet.length; i++) {
              const keyValue = keySet[i];
              const dataValue = dataSet[i];
              const item = {} as Partial<Input>;
              //@ts-expect-error
              item[keyField] = keyValue;
              //@ts-expect-error
              item[field] = dataValue;
              results.push(item);
            }
            return results;
          },
        );
        editField[field] = fieldEditor;
      } else {
        // TODO keyval support
      }
    }
  }

  return editField;
}
