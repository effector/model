import {
  createStore,
  createEvent,
  createEffect,
  attach,
  sample,
  Store,
  StoreWritable,
  withRegion,
  combine,
  clearNode,
  launch,
  EventCallable,
  Event,
  Effect,
} from 'effector';

import type {
  Keyval,
  Model,
  StoreDef,
  EventDef,
  EffectDef,
  InstanceOf,
  Show,
  ConvertToLensShape,
  StructKeyval,
} from './types';
import { spawn } from './spawn';
import { isDefine } from './define';
import { model } from './model';

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
  Input extends {
    [key: string]:
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | StoreDef<unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | unknown;
  },
  Output extends {
    [key: string]:
      | Store<unknown>
      | Keyval<unknown, unknown, unknown, unknown>
      | unknown;
  } = {},
  Api extends {
    [key: string]: Event<unknown> | Effect<unknown, unknown, unknown>;
  } = {},
  InputPlain extends {
    [K in keyof Input]: Input[K] extends
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | ((params: unknown) => unknown)
      ? never
      : Input[K] extends Store<infer V>
        ? V
        : Input[K] extends StoreDef<infer V>
          ? V
          : Input[K];
  } = {
    [K in keyof Input]: Input[K] extends
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | ((params: unknown) => unknown)
      ? never
      : Input[K] extends Store<infer V>
        ? V
        : Input[K] extends StoreDef<infer V>
          ? V
          : Input[K];
  },
  OutputPlain extends {
    [K in keyof Output]: Output[K] extends Keyval<any, infer V, any, any>
      ? V[]
      : Output[K] extends Store<infer V>
        ? V
        : never;
  } = {
    [K in keyof Output]: Output[K] extends Keyval<any, infer V, any, any>
      ? V[]
      : Output[K] extends Store<infer V>
        ? V
        : never;
  },
>(options: {
  key: ((entity: InputPlain) => string | number) | keyof Input;
  props: Input;
  create: (
    props: {
      [K in keyof Input]: Input[K] extends
        | Store<unknown>
        | Event<unknown>
        | Effect<unknown, unknown, unknown>
        ? Input[K]
        : Input[K] extends StoreDef<infer V>
          ? Store<V>
          : Input[K] extends EventDef<infer V>
            ? Event<V>
            : Input[K] extends EffectDef<infer V, infer D, infer E>
              ? Effect<V, D, E>
              : Input[K] extends (params: infer P) => infer R
                ? Effect<P, Awaited<R>>
                : Store<Input[K]>;
    } & {
      [K in {
        [P in keyof Input]: Input[P] extends Store<unknown> | StoreDef<unknown>
          ? P
          : never;
      }[keyof Input] as K extends string
        ? `$${K}`
        : never]: Input[K] extends Store<unknown>
        ? Input[K]
        : Input[K] extends StoreDef<infer V>
          ? Store<V>
          : never;
    },
    config: { onMount: Event<void> },
  ) =>
    | { state: Output; api: Api }
    | { state?: never; api: Api }
    | { state: Output; api?: never }
    | Output;
}): Keyval<
  Show<
    InputPlain & {
      [K in keyof Output]?: Output[K] extends Keyval<any, infer V, any, any>
        ? V[]
        : Output[K] extends StoreWritable<infer V>
          ? V
          : never;
    }
  >,
  Show<InputPlain & OutputPlain>,
  Api,
  Show<ConvertToLensShape<Input & Output & Api>>
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
export function keyval<Input, ModelEnhance, Api, Shape>({
  key: getKeyRaw,
  shape = {} as Shape,
  props,
  create,
}: {
  key: ((entity: Input) => string | number) | keyof Input;
  shape?: Shape;
  props?: any;
  create?: any;
}): Keyval<Input, Input & ModelEnhance, Api, Shape> {
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
  if (props && create) {
    // @ts-expect-error typecast
    kvModel = model({ props, create });
  }
  type ListState = {
    items: Enriched[];
    instances: Array<InstanceOf<NonNullable<typeof kvModel>>>;
    keys: Array<string | number>;
  };
  const getKey =
    typeof getKeyRaw === 'function'
      ? getKeyRaw
      : (entity: Input) => entity[getKeyRaw] as string | number;
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
        const $enriching = combine(instance.props);
        // obviosly dirty hack, wont make it way to release
        const enriching = $enriching.getState();
        freshState.items.push({ ...inputItem, ...enriching } as Enriched);
        sample({
          source: $enriching,
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
    if (kvModel) {
      const instance = freshState.instances[idx];
      for (const key in instance.inputs) {
        // @ts-expect-error cannot read newItem[key], but its ok
        const upd = newItem[key];
        // @ts-expect-error cannot read oldItem[key], but its ok
        if (upd !== oldItem[key]) {
          launch({
            target: instance.inputs[key],
            params: upd,
            defer: true,
          });
        }
      }
    }
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
          instance.unmount();
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
        instance.unmount();
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
  $entities.on(map, (state, { keys, map }) => {
    keys = Array.isArray(keys) ? keys : [keys];
    const refresh = refreshOnce(state);
    for (const key of keys) {
      const idx = state.keys.indexOf(key);
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
  });

  const api = {} as Record<string, EventCallable<any>>;

  let structShape: any = null;

  if (kvModel) {
    const initShape = {} as Record<string, any>;
    /** for in leads to typescript errors */
    Object.entries(kvModel.shape).forEach(([key, def]) => {
      if (isDefine.store(def)) {
        initShape[key] = createStore({});
      } else if (isDefine.event(def)) {
        initShape[key] = createEvent();
      } else if (isDefine.effect(def)) {
        initShape[key] = createEffect(() => {});
      }
    });
    const consoleError = console.error;
    console.error = () => {};
    // @ts-expect-error type issues
    const instance = spawn(kvModel, initShape);
    console.error = consoleError;
    instance.unmount();
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
  }

  return {
    type: 'keyval',
    api: api as any,
    __lens: shape,
    __struct: structShape,
    __getKey: getKey,
    $items: $entities.map(({ items }) => items),
    $keys: $entities.map(({ keys }) => keys),
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
