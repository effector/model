import {
  sample,
  Store,
  withRegion,
  launch,
  EventCallable,
  createEvent,
  attach,
  StoreWritable,
  clearNode,
} from 'effector';

import type { Model, StoreDef, InstanceOf, ListState, Keyval } from './types';
import { spawn } from './spawn';

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

function runUpdatesForInstance<Enriched, Output, Api, Input>(
  freshState: ListState<Enriched, Output, Api>,
  idx: number,
  // may be partial
  inputUpdate: Input,
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
    //@ts-expect-error type mismatch
    const store = instance.props[key];
    storesToUpdate.push(store);
    updates.push(inputUpdate[key]);
  }
  launch({
    target: storesToUpdate,
    params: updates,
    defer: true,
  });
}

function runNewItemInstance<Input, Enriched, Output, Api, Shape>(
  freshState: ListState<Enriched, Output, Api>,
  key: string | number,
  inputItem: Input,
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
  updateEnrichedItem: EventCallable<{
    key: string | number;
    /** actually it is an enriched part only */
    partial: Partial<Enriched>;
  }>,
  api: Record<string, EventCallable<any>>,
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
            Array.isArray(upd.key) ? upd.data[upd.key.indexOf(key)] : upd.data,
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
    freshState.items.push(inputItem as unknown as Enriched);
    // dont use instances if there is no kvModel
    freshState.instances.push(null as InstanceOf<NonNullable<typeof kvModel>>);
  }
}

export function createEditApi<Input, Enriched, Output, Api, Shape>(
  $entities: StoreWritable<ListState<Enriched, Output, Api>>,
  getKey: (entity: Input) => string | number,
  keyField: keyof Input | null,
  api: Record<string, EventCallable<any>>,
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
): Keyval<Input, Enriched, Api, Shape>['edit'] {
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

  const addFx = attach({
    source: $entities,
    effect(state, newItems: Input | Input[]) {
      if (!Array.isArray(newItems)) newItems = [newItems];
      const refresh = refreshOnce(state);
      for (const item of newItems) {
        const key = getKey(item);
        if (!state.keys.includes(key)) {
          state = refresh();
          runNewItemInstance(
            state,
            key,
            item,
            kvModel,
            updateEnrichedItem,
            api,
          );
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
          runNewItemInstance(
            state,
            key,
            item,
            kvModel,
            updateEnrichedItem,
            api,
          );
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
      const state: ListState<Enriched, Output, Api> = {
        items: [],
        instances: [],
        keys: [],
      };
      for (const item of newItems) {
        const key = getKey(item);
        runNewItemInstance(state, key, item, kvModel, updateEnrichedItem, api);
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
          runNewItemInstance(
            state,
            key,
            idObject,
            kvModel,
            updateEnrichedItem,
            api,
          );
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

  return {
    add,
    set,
    update: updateSome,
    replaceAll,
    remove: removeMany,
    map,
  };
}
