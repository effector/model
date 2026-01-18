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
import { isKeyval } from './define';

export function keyval<
  ReactiveState,
  FullState extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof ReactiveState]: ReactiveState[K] extends Keyval<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      infer V,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >
      ? V[]
      : ReactiveState[K] extends Store<infer V>
        ? V
        : never;
  },
  WritableState extends {
    [K in {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [P in keyof ReactiveState]: ReactiveState[P] extends Keyval<
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        any
      >
        ? P
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ReactiveState[P] extends StoreWritable<any>
          ? P
          : never;
    }[keyof ReactiveState]]: ReactiveState[K] extends Keyval<
      infer V,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >
      ? V[]
      : ReactiveState[K] extends StoreWritable<infer V>
        ? V
        : never;
  },
  Api = Record<string, unknown>,
  OptionalFields extends keyof WritableState = never,
>(
  create: () => {
    state: ReactiveState;
    api?: Api;
    key: keyof ReactiveState;
    optional?: ReadonlyArray<OptionalFields>;
    onMount?: Event<void>;
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
}): Keyval<T, T, Record<string, never>, ConvertToLensShape<Shape>>;
export function keyval<T>(options: {
  key: ((entity: T) => string | number) | keyof T;
}): Keyval<T, T, Record<string, never>, Record<string, never>>;
export function keyval<Input, Output, Api, Shape>(
  keyval: Keyval<Input, Output, Api, Shape>,
): Keyval<Input, Output, Api, Shape>;
export function keyval<Input, ModelEnhance, Api, Shape>(
  options:
    | {
        key: ((entity: Input) => string | number) | keyof Input;
        shape?: Shape;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props?: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        create?: any;
      }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    | Function
    | Keyval<Input, Input & ModelEnhance, Api, Shape>,
): Keyval<Input, Input & ModelEnhance, Api, Shape> {
  if (isKeyval(options)) {
    return options.clone(true, options.cloneOf || options);
  }

  type Enriched = Input & ModelEnhance;
  type Output = {
    [K in keyof ModelEnhance]:
      | Store<ModelEnhance[K]>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      | Keyval<any, ModelEnhance[K], any, any>;
  };
  type KeyvalListState = ListState<Enriched, Output, Api>;

  const init = (
    isClone: boolean,
    cloneOf: Keyval<Input, Enriched, Api, Shape> | null,
  ) => {
    const $entities = createStore<KeyvalListState>({
      items: [],
      instances: [],
      keys: [],
    });
    const $items = $entities.map(({ items }) => items);
    const $keys = $entities.map(({ keys }) => keys);
    let getKeyRaw:
      | keyof Input
      | ((entity: Input) => string | number)
      | undefined;
    let create:
      | void
      | ((config: { onMount: Event<void> }) => {
          state: unknown;
          api?: unknown;
          key: string;
          optional?: string[];
        });
    let shape: Shape;
    if (typeof options === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create = options as any;
    } else {
      ({
        key: getKeyRaw,
        shape = {} as Shape,
        create,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = options as Exclude<typeof options, Keyval<any, any, any, any>>);
    }
    const {
      getKey: getKeyClone,
      keyField: keyFieldClone,
      structShape: structShapeClone,
      defaultState: defaultStateClone,
    } = cloneOf?.getCloneData() ?? {};
    return lazyInit(
      {
        type: 'keyval',
        api: 0,
        __lens: 0,
        __struct: structShapeClone,
        $items,
        $keys,
        __$listState: $entities,
        defaultState: defaultStateClone,
        edit: 0,
        editField: 0,
        clone: init,
        isClone,
        cloneOf,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getCloneData: cloneOf?.getCloneData ?? (() => null as any),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any as Keyval<Input, Input & ModelEnhance, Api, Shape>,
      () => {
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

        if (create) {
          // @ts-expect-error typecast
          kvModel = model({ create, isClone });
        }
        const getKey =
          getKeyClone ??
          (!kvModel
            ? typeof getKeyRaw === 'function'
              ? getKeyRaw
              : // @ts-expect-error bad implementation
                (entity: Input) => entity[getKeyRaw] as string | number
            : (entity: Input) => entity[kvModel.keyField] as string | number);
        const keyField =
          keyFieldClone ??
          (!kvModel
            ? typeof getKeyRaw === 'function' || getKeyRaw === undefined
              ? null
              : getKeyRaw
            : kvModel.keyField);
        const structShape =
          structShapeClone ??
          (kvModel
            ? ({
                type: 'structKeyval',
                getKey,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                shape: kvModel.__struct!.shape,
                defaultItem: kvModel.defaultState,
              } as StructKeyval)
            : shape
              ? ({
                  type: 'structKeyval',
                  getKey,
                  shape: {},
                  // TODO add support for .itemStore
                  defaultItem: () => null,
                } as StructKeyval)
              : // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (null as any as StructKeyval));

        const defaultState =
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          defaultStateClone ?? (() => kvModel?.defaultState() ?? (null as any));

        const getCloneData =
          cloneOf?.getCloneData ??
          (() => {
            return {
              defaultState,
              structShape,
              keyField,
              getKey,
            };
          });

        const api = createInstanceApi($entities, kvModel);
        const editApi = createEditApi(
          $entities,
          getKey,
          keyField,
          api,
          kvModel,
        );
        const editField = createEditFieldApi(keyField, kvModel, editApi.update);

        return {
          type: 'keyval' as const,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          api: api as any,
          __lens: shape,
          __struct: structShape,
          $items,
          $keys,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          __$listState: $entities as any,
          defaultState,
          edit: editApi,
          editField,
          clone: init,
          isClone,
          cloneOf,
          getCloneData,
        } as Keyval<Input, Input & ModelEnhance, Api, Shape>;
      },
    );
  };
  return init(false, null);
}
