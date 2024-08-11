import {
  createStore,
  createEvent,
  createEffect,
  attach,
  sample,
  Store,
  withRegion,
  combine,
  clearNode,
  launch,
  EventCallable,
  Unit,
} from 'effector';

import type {
  Keyval,
  Model,
  StoreDef,
  InstanceOf,
  Show,
  ConvertToLensShape,
} from './types';
import { spawn } from './spawn';

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
//   getKey: (entity: ToPlainShape<Input>) => string | number;
//   model: Model<Input, Enriched>;
// }): Keyval<
//   Show<ToPlainShape<Input>>,
//   Show<ToPlainShape<Input> & ToPlainShape<Enriched>>
// >;
// export function keyval<T>(options: {
//   getKey: (entity: T) => string | number;
// }): Keyval<T, T>;
// export function keyval<Input, Enriched>({
//   getKey: getKeyRaw,
//   model,
// }: {
//   getKey: (entity: ToPlainShape<Input>) => string | number;
//   model?: Model<Input, Enriched>;
// }): Keyval<
//   ToPlainShape<Input>,
//   ToPlainShape<Input> & ToPlainShape<Enriched>
// >

export function keyval<Input, ModelEnhance, Api, Shape>(options: {
  getKey: (entity: Input) => string | number;
  model: Model<
    {
      [K in keyof Input]?: Store<Input[K]> | StoreDef<Input[K]>;
    },
    {
      [K in keyof ModelEnhance]: Store<ModelEnhance[K]>;
    },
    Api,
    Shape
  >;
}): Keyval<Input, Show<Input & ModelEnhance>, Api, Shape>;
export function keyval<T, Shape>(options: {
  getKey: (entity: T) => string | number;
  shape: Shape;
}): Keyval<T, T, {}, ConvertToLensShape<Shape>>;
export function keyval<T>(options: {
  getKey: (entity: T) => string | number;
}): Keyval<T, T, {}, {}>;
export function keyval<Input, ModelEnhance, Api, Shape>({
  getKey,
  model,
  shape = {} as Shape,
}: {
  getKey: (entity: Input) => string | number;
  model?: Model<
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
  >;
  shape?: Shape;
}): Keyval<Input, Input & ModelEnhance, Api, Shape> {
  type Enriched = Input & ModelEnhance;
  type ListState = {
    items: Enriched[];
    instances: Array<InstanceOf<NonNullable<typeof model>>>;
    keys: Array<string | number>;
  };
  const $entities = createStore<ListState>({
    items: [],
    instances: [],
    keys: [],
  });
  // current implementation without static model body
  // cannot handle api creation ahead of time
  // but proper implementation do will
  const api = new Proxy({} as Record<string, EventCallable<any>>, {
    get(target, prop, receiver) {
      if (!(prop in target)) {
        target[prop as string] = createEvent();
      }
      return target[prop as string];
    },
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
    const idx = state.keys.findIndex((e) => e === key);
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
    if (model) {
      // typecast, ts cannot infer that types are indeed compatible
      const item1: {
        [K in keyof Input]: Store<Input[K]> | StoreDef<Input[K]> | Input[K];
      } = inputItem;
      // @ts-expect-error some issues with types
      const instance = spawn(model, item1);
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
                ? upd.data[upd.key.findIndex((e) => e === key)]
                : upd.data,
            target: instance.api[key] as EventCallable<any>,
          });
        }
      });
      // @ts-expect-error some issues with types
      freshState.instances.push(instance);
    } else {
      // typecast, there is no model so Input === Enriched
      freshState.items.push(inputItem as Enriched);
      // dont use instances if there is no model
      freshState.instances.push(null as InstanceOf<NonNullable<typeof model>>);
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
    if (model) {
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
        const idx = state.keys.findIndex((e) => e === key);
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
      if (model) {
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
        const idx = state.keys.findIndex((e) => e === key);
        if (idx !== -1) {
          indexesToRemove.push(idx);
        }
      }
    }
    for (const idx of indexesToRemove) {
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
      const idx = state.keys.findIndex((e) => e === key);
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
      const idx = state.keys.findIndex((e) => e === key);
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

  return {
    type: 'keyval',
    api: api as any,
    __lens: shape,
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
