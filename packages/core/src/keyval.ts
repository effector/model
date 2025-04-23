import {
  createStore,
  type Store,
  type StoreWritable,
  type Event,
} from 'effector';

import type {
  Keyval,
  Model,
  StoreDef,
  Show,
  ConvertToLensShape,
  StructKeyval,
  ListState,
} from './types';
import { model } from './model';
import type { SetOptional } from './setOptional';
import { lazyInit } from './lazyInit';
import { createEditApi } from './editApi';
import { createEditFieldApi } from './editFieldApi';
import { createInstanceApi } from './instanceApi';

export function keyval<
  ReactiveState,
  FullState extends {
    [K in keyof ReactiveState]: ReactiveState[K] extends Keyval<
      any,
      infer V,
      any,
      any
    >
      ? V[]
      : ReactiveState[K] extends Store<infer V>
        ? V
        : never;
  },
  WritableState extends {
    [K in {
      [P in keyof ReactiveState]: ReactiveState[P] extends Keyval<
        any,
        any,
        any,
        any
      >
        ? P
        : ReactiveState[P] extends StoreWritable<any>
          ? P
          : never;
    }[keyof ReactiveState]]: ReactiveState[K] extends Keyval<
      infer V,
      any,
      any,
      any
    >
      ? V[]
      : ReactiveState[K] extends StoreWritable<infer V>
        ? V
        : never;
  },
  Api = {},
  OptionalFields extends keyof WritableState = never,
>(
  create: (config: { onMount: Event<void> }) => {
    state: ReactiveState;
    api?: Api;
    key: keyof ReactiveState;
    optional?: ReadonlyArray<OptionalFields>;
  },
): Keyval<
  SetOptional<WritableState, OptionalFields>,
  FullState,
  Api,
  Show<ConvertToLensShape<ReactiveState & Api>>
>;
export function keyval<T, Shape>(options: {
  key: ((entity: T) => string | number) | keyof T;
  shape: Shape;
}): Keyval<T, T, {}, ConvertToLensShape<Shape>>;
export function keyval<T>(options: {
  key: ((entity: T) => string | number) | keyof T;
}): Keyval<T, T, {}, {}>;
export function keyval<Input, ModelEnhance, Api, Shape>(
  options:
    | {
        key: ((entity: Input) => string | number) | keyof Input;
        shape?: Shape;
        props?: any;
        create?: any;
      }
    | Function,
): Keyval<Input, Input & ModelEnhance, Api, Shape> {
  return lazyInit(
    {
      type: 0,
      api: 0,
      __lens: 0,
      __struct: 0,
      $items: 0,
      $keys: 0,
      defaultState: 0,
      edit: 0,
      editField: 0,
    } as any as Keyval<Input, Input & ModelEnhance, Api, Shape>,
    () => {
      let create:
        | void
        | ((config: { onMount: Event<void> }) => {
            state: unknown;
            api?: unknown;
            key: string;
            optional?: string[];
          });
      // @ts-expect-error bad implementation
      let getKeyRaw;
      let shape: Shape;
      if (typeof options === 'function') {
        create = options as any;
      } else {
        ({ key: getKeyRaw, shape = {} as Shape, create } = options);
      }
      type Enriched = Input & ModelEnhance;
      type Output = {
        [K in keyof ModelEnhance]:
          | Store<ModelEnhance[K]>
          | Keyval<any, ModelEnhance[K], any, any>;
      };
      let kvModel:
        | Model<
            {
              [K in keyof Input]?: Store<Input[K]> | StoreDef<Input[K]>;
            },
            Output,
            Api,
            Shape
          >
        | undefined;
      type KeyvalListState = ListState<Enriched, Output, Api>;
      if (create) {
        // @ts-expect-error typecast
        kvModel = model({ create });
      }

      const getKey = !kvModel
        ? typeof getKeyRaw === 'function'
          ? getKeyRaw
          : // @ts-expect-error bad implementation
            (entity: Input) => entity[getKeyRaw] as string | number
        : (entity: Input) => entity[kvModel.keyField] as string | number;
      const keyField = !kvModel
        ? typeof getKeyRaw === 'function' || getKeyRaw === undefined
          ? null
          : getKeyRaw
        : kvModel.keyField;
      const $entities = createStore<KeyvalListState>({
        items: [],
        instances: [],
        keys: [],
      });

      const api = createInstanceApi($entities, kvModel);
      const editApi = createEditApi($entities, getKey, keyField, api, kvModel);
      const editField = createEditFieldApi(keyField, kvModel, editApi.update);

      const structShape = kvModel
        ? ({
            type: 'structKeyval',
            getKey,
            shape: kvModel.__struct!.shape,
            defaultItem: kvModel.defaultState ?? null,
          } as StructKeyval)
        : shape!
          ? ({
              type: 'structKeyval',
              getKey,
              shape: {},
              // TODO add support for .itemStore
              defaultItem: null,
            } as StructKeyval)
          : (null as any as StructKeyval);

      return {
        type: 'keyval',
        api: api as any,
        // @ts-expect-error bad implementation
        __lens: shape,
        __struct: structShape,
        $items: $entities.map(({ items }) => items),
        $keys: $entities.map(({ keys }) => keys),
        defaultState: (kvModel?.defaultState ?? null) as any,
        edit: editApi,
        editField,
      };
    },
  );
}
