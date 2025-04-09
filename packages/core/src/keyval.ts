import {
  createStore,
  createEvent,
  attach,
  sample,
  Store,
  StoreWritable,
  withRegion,
  clearNode,
  launch,
  EventCallable,
  Event,
} from 'effector';

import type {
  Keyval,
  Model,
  StoreDef,
  InstanceOf,
  Show,
  ConvertToLensShape,
  StructKeyval,
  StructShape,
  OneOfShapeDef,
  EntityShapeDef,
} from './types';
import { spawn } from './spawn';
import { model } from './model';
import type { SetOptional } from './setOptional';
import { isDefine, isKeyval } from './define';

type ToPlainShape<Shape> = {
  [K in {
    [P in keyof Shape]: Shape[P] extends Store<unknown>
      ? P
      : Shape[P] extends StoreDef<unknown>
        ? P
        : never;
  }[keyof Shape]]: Shape[K] extends Store<infer V>
    ? V
    : Shape[K] extends StoreDef<infer V>
      ? V
      : never;
};

// export function keyval<Input, Enriched>(options: {
//   key: (entity: ToPlainShape<Input>) => string | number;
//   model: Model<Input, Enriched>;
// }): Keyval<
//   Show<ToPlainShape<Input>>,
//   Show<ToPlainShape<Input> & ToPlainShape<Enriched>>
// >;
// export function keyval<T>(options: {
//   key: (entity: T) => string | number;
// }): Keyval<T, T>;
// export function keyval<Input, Enriched>({
//   key: getKeyRaw,
//   model,
// }: {
//   key: (entity: ToPlainShape<Input>) => string | number;
//   model?: Model<Input, Enriched>;
// }): Keyval<
//   ToPlainShape<Input>,
//   ToPlainShape<Input> & ToPlainShape<Enriched>
// >

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
// export function keyval<Input, ModelEnhance, Api, Shape>(options: {
//   key: ((entity: Input) => string | number) | keyof Input;
//   model: Model<
//     {
//       [K in keyof Input]?: Store<Input[K]> | StoreDef<Input[K]>;
//     },
//     {
//       [K in keyof ModelEnhance]: Store<ModelEnhance[K]>;
//     },
//     Api,
//     Shape
//   >;
// }): Keyval<Input, Show<Input & ModelEnhance>, Api, Shape>;
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
  let kvModel:
    | Model<
        {
          [K in keyof Input]?: Store<Input[K]> | StoreDef<Input[K]>;
        },
        {
          [K in keyof ModelEnhance]:
            | Store<ModelEnhance[K]>
            | Keyval<any, ModelEnhance[K], any, any>;
        },
        Api,
        Shape
      >
    | undefined;
  if (create) {
    // @ts-expect-error typecast
    kvModel = model({ create });
  }
  type ListState = {
    items: Enriched[];
    // @ts-expect-error type mismatch
    instances: Array<InstanceOf<NonNullable<typeof kvModel>>>;
    keys: Array<string | number>;
  };
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
  const $entities = createStore<ListState>({
    items: [],
    instances: [],
    keys: [],
  });

  const add = createEvent<Input | Input[]>();

  const replaceAll = createEvent<Input[]>();
  const set = createEvent<Input | Input[]>();

  const removeMany = createEvent<
    string | number | Array<string | number> | ((entity: Enriched) => boolean)
  >();

  const updateSome = createEvent<Partial<Input> | Partial<Input>[]>();

  const map = createEvent<{
    keys: string | number | Array<string | number>;
    map: (entity: Enriched) => Partial<Input>;
    upsert?: boolean;
  }>();

  const updateEnrichedItem = createEvent<{
    key: string | number;
    /** actually it is an enriched part only */
    partial: Partial<Enriched>;
  }>();

  $entities.on(updateEnrichedItem, (state, { key, partial }) => {
    const refresh = refreshOnce(state);
    const idx = state.keys.indexOf(key);
    if (idx !== -1) {
      state = refresh();
      state.items[idx] = {
        ...state.items[idx],
        ...partial,
      };
    }
    return state;
  });

  function runNewItemInstance(
    freshState: ListState,
    key: string | number,
    inputItem: Input,
  ) {
    freshState.keys.push(key);
    if (kvModel) {
      // typecast, ts cannot infer that types are indeed compatible
      const item1: {
        [K in keyof Input]: Store<Input[K]> | StoreDef<Input[K]> | Input[K];
      } = inputItem;
      // @ts-expect-error some issues with types
      const instance = spawn(kvModel, item1);
      withRegion(instance.region, () => {
        // obviosly dirty hack, wont make it way to release
        const enriching = instance.output.getState();
        freshState.items.push(enriching as Enriched);
        sample({
          source: instance.output,
          fn: (partial) => ({
            key,
            partial: partial as Partial<Enriched>,
          }),
          target: updateEnrichedItem,
        });
        for (const key in instance.api) {
          sample({
            clock: api[key] as EventCallable<
              | { key: string | number; data: any }
              | {
                  key: Array<string | number>;
                  data: any[];
                }
            >,
            filter(upd) {
              if (Array.isArray(upd.key)) {
                return upd.key.includes(key);
              }
              return upd.key === key;
            },
            fn: (upd) =>
              Array.isArray(upd.key)
                ? upd.data[upd.key.indexOf(key)]
                : upd.data,
            target: instance.api[key] as EventCallable<any>,
          });
        }
      });
      // @ts-expect-error some issues with types
      freshState.instances.push(instance);
      if (instance.onMount) {
        launch({
          target: instance.onMount,
          params: undefined,
          defer: true,
        });
      }
    } else {
      // typecast, there is no kvModel so Input === Enriched
      freshState.items.push(inputItem as Enriched);
      // dont use instances if there is no kvModel
      freshState.instances.push(
        null as InstanceOf<NonNullable<typeof kvModel>>,
      );
    }
  }

  function runUpdatesForInstance(
    freshState: ListState,
    idx: number,
    inputUpdate: Partial<Input>,
  ) {
    const oldItem = freshState.items[idx];
    const newItem: Enriched = {
      ...oldItem,
      ...inputUpdate,
    };
    freshState.items[idx] = newItem;
    const instance = freshState.instances[idx];
    const storesToUpdate = [] as any[];
    const updates = [] as any[];
    for (const key in inputUpdate) {
      const store = instance.props[key as any as keyof ModelEnhance];
      storesToUpdate.push(store);
      updates.push(inputUpdate[key]);
    }
    launch({
      target: storesToUpdate,
      params: updates,
      defer: true,
    });
  }

  const addFx = attach({
    source: $entities,
    effect(state, newItems: Input | Input[]) {
      if (!Array.isArray(newItems)) newItems = [newItems];
      const refresh = refreshOnce(state);
      for (const item of newItems) {
        const key = getKey(item);
        if (!state.keys.includes(key)) {
          state = refresh();
          runNewItemInstance(state, key, item);
        }
      }
      return state;
    },
  });

  const setFx = attach({
    source: $entities,
    effect(state, updates: Input | Input[]) {
      if (!Array.isArray(updates)) updates = [updates];
      const refresh = refreshOnce(state);
      for (const item of updates) {
        const key = getKey(item);
        state = refresh();
        const idx = state.keys.indexOf(key);
        if (idx !== -1) {
          runUpdatesForInstance(state, idx, item);
        } else {
          runNewItemInstance(state, key, item);
        }
      }
      return state;
    },
  });

  const replaceAllFx = attach({
    source: $entities,
    effect(oldState, newItems: Input[]) {
      if (kvModel) {
        for (const instance of oldState.instances) {
          clearNode(instance.region);
        }
      }
      const state: ListState = {
        items: [],
        instances: [],
        keys: [],
      };
      for (const item of newItems) {
        const key = getKey(item);
        runNewItemInstance(state, key, item);
        if (kvModel) {
          /** new instance is always last */
          const instance = state.instances[state.instances.length - 1];
          for (const field of kvModel.keyvalFields) {
            // @ts-expect-error type mismatch, item is iterable
            if (field in item) {
              launch({
                target: instance.keyvalShape[field].edit.replaceAll,
                params: (item as any)[field],
                defer: true,
              });
            }
          }
        }
      }
      return state;
    },
  });

  sample({
    clock: add,
    target: addFx,
    batch: false,
  });

  sample({
    clock: addFx.doneData,
    target: $entities,
    batch: false,
  });

  sample({
    clock: set,
    target: setFx,
    batch: false,
  });

  sample({
    clock: setFx.doneData,
    target: $entities,
    batch: false,
  });

  sample({
    clock: replaceAll,
    target: replaceAllFx,
    batch: false,
  });

  sample({
    clock: replaceAllFx.doneData,
    target: $entities,
    batch: false,
  });

  $entities.on(removeMany, (state, payload) => {
    const refresh = refreshOnce(state);
    const indexesToRemove: number[] = [];
    if (typeof payload === 'function') {
      for (let i = 0; i < state.items.length; i++) {
        if (payload(state.items[i])) {
          indexesToRemove.push(i);
        }
      }
    } else {
      payload = Array.isArray(payload) ? payload : [payload];
      for (const key of payload) {
        const idx = state.keys.indexOf(key);
        if (idx !== -1) {
          indexesToRemove.push(idx);
        }
      }
    }
    /** delete in reverse order to prevent drift of following indexes after splice */
    for (let i = indexesToRemove.length - 1; i >= 0; i--) {
      const idx = indexesToRemove[i];
      state = refresh();
      state.items.splice(idx, 1);
      state.keys.splice(idx, 1);
      const [instance] = state.instances.splice(idx, 1);
      if (instance) {
        clearNode(instance.region);
      }
    }
    return state;
  });
  $entities.on(updateSome, (state, updates) => {
    if (!Array.isArray(updates)) updates = [updates];
    const refresh = refreshOnce(state);
    for (const inputUpdate of updates) {
      const key = getKey(inputUpdate as Input);
      const idx = state.keys.indexOf(key);
      if (idx !== -1) {
        state = refresh();
        runUpdatesForInstance(state, idx, inputUpdate);
      }
    }
    return state;
  });
  const mapItemsFx = attach({
    source: $entities,
    effect(
      state,
      {
        keys,
        map,
        upsert = false,
      }: {
        keys: string | number | Array<string | number>;
        map: (entity: Enriched) => Partial<Input>;
        upsert?: boolean;
      },
    ) {
      keys = Array.isArray(keys) ? keys : [keys];
      if (upsert && keyField === null) {
        console.error(
          'map upsert is not supported with `key: function`, use `key: "fieldName"` instead',
        );
        upsert = false;
      }
      const refresh = refreshOnce(state);
      for (const key of keys) {
        let idx = state.keys.indexOf(key);
        if (upsert && idx === -1) {
          state = refresh();
          const idObject = { [keyField!]: key } as Input;
          runNewItemInstance(state, key, idObject);
          idx = state.keys.indexOf(key);
        }
        if (idx !== -1) {
          const originalItem = state.items[idx];
          const updatedItem = map(originalItem);
          if (originalItem !== updatedItem) {
            state = refresh();
            runUpdatesForInstance(state, idx, updatedItem);
          }
        }
      }
      return state;
    },
  });
  sample({ clock: map, target: mapItemsFx });
  sample({ clock: mapItemsFx.doneData, target: $entities });

  const api = {} as Record<string, EventCallable<any>>;

  let structShape: any = null;

  if (kvModel) {
    // @ts-expect-error type issues
    const instance = spawn(kvModel, {});
    clearNode(instance.region);
    structShape = {
      type: 'structKeyval',
      getKey,
      shape: kvModel.__struct!.shape,
    } as StructKeyval;
    for (const prop in instance.api) {
      const evt = createEvent<
        | {
            key: string | number;
            data: any;
          }
        | {
            key: Array<string | number>;
            data: any[];
          }
      >();
      api[prop] = evt;
      $entities.on(evt, (state, payload) => {
        const [key, data] = Array.isArray(payload.key)
          ? [payload.key, payload.data]
          : [[payload.key], [payload.data]];
        const targets = [] as any[];
        const params = [] as any[];
        for (let i = 0; i < key.length; i++) {
          const idx = state.keys.indexOf(key[i]);
          if (idx !== -1) {
            const instance = state.instances[idx];
            targets.push(instance.api[prop]);
            params.push(data[i]);
          }
        }
        launch({
          target: targets,
          params,
          defer: true,
        });
        return state;
      });
    }
  } else if (shape!) {
    const itemStructShape: StructKeyval['shape'] = {};
    structShape = {
      type: 'structKeyval',
      getKey,
      shape: itemStructShape,
    } as StructKeyval;
    // for (const key in shape) {
    //   const def = shape[key] as OneOfShapeDef;
    //   itemStructShape[key] = def.type === 'entityShapeDefinition'
    //     isKeyval(def)
    //     ? def.__struct
    //     : {
    //         type: 'structUnit',
    //         unit: 'store',
    //       };
    // }
  }
  // function convertShapeDefToStructShape(def: EntityShapeDef<any>, )

  return {
    type: 'keyval',
    api: api as any,
    // @ts-expect-error bad implementation
    __lens: shape,
    __struct: structShape,
    $items: $entities.map(({ items }) => items),
    $keys: $entities.map(({ keys }) => keys),
    defaultState: (kvModel?.defaultState ?? null) as any,
    edit: {
      add,
      set,
      update: updateSome,
      replaceAll,
      remove: removeMany,
      map,
    },
  };
}

function refreshOnce<T, I>(state: {
  items: T[];
  instances: I[];
  keys: Array<string | number>;
}) {
  let needToUpdate = true;
  return () => {
    if (needToUpdate) {
      needToUpdate = false;
      state = {
        items: [...state.items],
        instances: [...state.instances],
        keys: [...state.keys],
      };
    }
    return state;
  };
}
