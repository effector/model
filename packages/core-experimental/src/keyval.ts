import {
  Store,
  Event,
  EventCallable,
  createStore,
  createEvent,
  sample,
  createEffect,
  is,
} from 'effector';
import { Model } from './model';
import { create } from './instance';
import { Lens } from './lens';

export type UnionConfig<M extends Record<string, Model<any, any, any>>> = M;

export type Union<M extends Record<string, Model<any, any, any>>> = {
  type: 'union';
  models: M;
};

export function union<M extends Record<string, Model<any, any, any>>>(
  models: M,
): Union<M> {
  return {
    type: 'union',
    models,
  };
}

export type KeyvalConfig<M> = {
  model: M;
};

// Helper types for LensProxy
type Lensify<T> =
  T extends Store<infer V>
    ? Lens // Store<V> becomes Lens (which resolves to V)
    : T extends EventCallable<infer P>
      ? EventCallable<P>
      : T extends Record<string, any>
        ? { [K in keyof T]: Lensify<T[K]> }
        : any;

type ModelInstanceType<M> =
  M extends Model<any, any, any>
    ? M['_InstanceType']
    : M extends Union<infer U>
      ? U[keyof U]['_InstanceType'] // Intersection or Union? For lens access, intersection of common fields or specific variant access
      : never;

type LensProxy<M> = Lensify<ModelInstanceType<M>> &
  Lens & {
    activeVariant: Lens;
    match: (config: {
      source?: any;
      cases: Record<string, (scope: any) => any>;
    }) => any;
  };

export type Keyval<M> = {
  type: 'keyval';
  model: M;
  add: EventCallable<{ id: string; variant?: string; input: any; state?: any }>;
  update: EventCallable<{ id: string; input?: any; state?: any }>;
  remove: EventCallable<string>;
  reset: EventCallable<void>;
  getItem: (
    idOrStore:
      | string
      | Store<string | null>
      | Event<string>
      | Event<{ id: string }>,
  ) => LensProxy<M>;
  $items: Store<string[]>;
  $activeVariants: Store<Record<string, string | null>>;
  $state: Store<Record<string, any>>;
};

export function keyval<M extends Union<any> | Model<any, any, any>>(
  config: KeyvalConfig<M>,
): Keyval<M> {
  const $items = createStore<string[]>([]);
  const $instances = createStore<Record<string, any>>({});
  const $activeVariants = createStore<Record<string, string | null>>({});
  const $state = createStore<Record<string, any>>({});

  const add = createEvent<{
    id: string;
    variant?: string;
    input: any;
    state?: any;
  }>();
  const update = createEvent<{ id: string; input?: any; state?: any }>();
  const remove = createEvent<string>();
  const reset = createEvent();
  const addValid = createEvent<{
    id: string;
    variant?: string;
    input: any;
    state?: any;
  }>();
  const updateState = createEvent<{
    id: string;
    path: string[];
    value: any;
  }>();

  // Update Logic
  const updateInstanceFx = createEffect(
    ({
      instances,
      id,
      input,
      state,
    }: {
      instances: Record<string, any>;
      id: string;
      input?: any;
      state?: any;
    }) => {
      const instance = instances[id];
      if (!instance) return;

      // Update Inputs
      if (input) {
        // instance.input contains stores
        for (const [key, val] of Object.entries(input)) {
          const store = (instance.input as any)[key];
          if (store && (store as any).rehydrate) {
            (store as any).rehydrate(val);
          }
        }
      }

      // Update State (Facets)
      if (state) {
        // Traverse state and update stores
        for (const [facetName, facetState] of Object.entries(state)) {
          const facet = instance.facets?.[facetName];
          if (facet && typeof facetState === 'object') {
            for (const [fieldName, val] of Object.entries(facetState as any)) {
              const store = facet[fieldName];
              if (store && (store as any).rehydrate) {
                (store as any).rehydrate(val);
              }
            }
          }
        }
      }
    },
  );

  sample({
    clock: update,
    source: $instances,
    fn: (instances, { id, input, state }) => ({ instances, id, input, state }),
    target: updateInstanceFx,
  });

  $state.on(updateState, (state, { id, path, value }) => {
    const newState = { ...state };
    let current = newState[id] ? { ...newState[id] } : {};
    newState[id] = current;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      current[key] = current[key] ? { ...current[key] } : {};
      current = current[key];
    }
    current[path[path.length - 1]] = value;
    return newState;
  });

  $state.on(remove, (state, id) => {
    const { [id]: _, ...rest } = state;
    return rest;
  });
  $state.reset(reset);

  sample({
    clock: add,
    filter: ({ id, variant, input }) => {
      const actualVariant = variant || (input as any)?.type;
      console.log(
        `[keyval] Validating add for ${id} (variant: ${actualVariant})`,
      );

      let modelDef: Model<any, any, any>;
      if ((config.model as any).type === 'union') {
        const unionModel = config.model as Union<any>;
        if (!actualVariant || !unionModel.models[actualVariant]) {
          console.error(`[keyval] Variant ${actualVariant} not found in union`);
          return false;
        }
        modelDef = unionModel.models[actualVariant];
      } else {
        modelDef = config.model as Model<any, any, any>;
      }

      const modelExtraDef =
        modelDef.config.extra || modelDef.config.input || {};
      for (const key in modelExtraDef) {
        const def = modelExtraDef[key];
        // Only check if it's a required input (no initial value)
        if (def.type === 'store' && def.initial === undefined) {
          if (!input || input[key] === undefined) {
            console.error(
              `[keyval] Required input "${key}" missing for item ${id}. Input:`,
              input,
            );
            return false;
          }
        }
      }

      return true;
    },
    target: addValid,
  });

  const updateVariant = createEvent<{ id: string; variant: string | null }>();
  $activeVariants.on(updateVariant, (state, { id, variant }) => ({
    ...state,
    [id]: variant,
  }));
  $activeVariants.on(remove, (state, id) => {
    const { [id]: _, ...rest } = state;
    return rest;
  });
  $activeVariants.reset(reset);

  const createInstanceFx = createEffect(
    ({
      id,
      variant,
      input,
      state,
    }: {
      id: string;
      variant?: string;
      input: any;
      state?: any;
    }) => {
      let modelDef: Model<any, any, any>;
      const resolvedVariant = variant || (input as any)?.type;
      if ((config.model as any).type === 'union') {
        const unionModel = config.model as Union<any>;
        modelDef = unionModel.models[resolvedVariant!];
      } else {
        modelDef = config.model as Model<any, any, any>;
      }

      const instance = create(modelDef, { input, state });
      (instance as any)._variant =
        resolvedVariant || instance.activeVariant.getState();

      sample({
        clock: instance.activeVariant,
        fn: (v: any) => ({ id, variant: v }),
        target: updateVariant,
      } as any);

      const initialVariant = instance.activeVariant.getState();
      if (initialVariant !== null) {
        updateVariant({ id, variant: initialVariant });
      }

      traverseAndBind(instance, [], id, updateState);

      return { id, instance };
    },
  );

  sample({
    clock: addValid,
    source: $instances,
    fn: (instances, { id, variant, input, state }) => {
      console.log(
        `[keyval] addValid triggered for ${id}. Variant: ${variant}. Input keys:`,
        Object.keys(input || {}),
      );
      const existing = instances[id];
      if (existing) {
        console.log(`[keyval] Destroying existing instance ${id}`);
        if (existing.destroy) existing.destroy();
      }
      return { id, variant, input, state };
    },
    target: createInstanceFx,
  });

  createInstanceFx.fail.watch((error) => {
    console.error('[keyval] createInstanceFx failed:', error);
  });

  createInstanceFx.done.watch(({ params, result }) => {
    console.log(`[keyval] createInstanceFx done for ${params.id}`, result);
  });

  $instances.on(remove, (instances, id) => {
    const instance = instances[id];
    if (!instance) return instances;
    if (instance.destroy) instance.destroy();
    const { [id]: _, ...rest } = instances;
    return rest;
  });

  $instances.on(createInstanceFx.doneData, (instances, { id, instance }) => ({
    ...instances,
    [id]: instance,
  }));

  $instances.on(reset, (instances) => {
    Object.values(instances).forEach((instance) => {
      if (instance && instance.destroy) instance.destroy();
    });
    return {};
  });
  $instances.reset(reset);

  $items.on(createInstanceFx.doneData, (items, { id }) => {
    if (items.includes(id)) return items;
    return [...items, id];
  });
  $items.on(remove, (items, id) => items.filter((x) => x !== id));
  $items.reset(reset);

  const proxyCache = new Map<any, any>();

  const getItem = (
    idOrStore:
      | string
      | Store<string | null>
      | Event<string>
      | Event<{ id: string }>,
  ) => {
    const key = is.unit(idOrStore) ? idOrStore : String(idOrStore);
    if (proxyCache.has(key)) return proxyCache.get(key);
    const proxy = createItemProxy(
      $instances,
      $state,
      idOrStore,
      config.model, // Pass model def
      $activeVariants,
    );
    proxyCache.set(key, proxy);
    return proxy;
  };

  return {
    type: 'keyval',
    model: config.model,
    add,
    update,
    remove,
    reset,
    getItem,
    $items,
    $activeVariants,
    $state,
    $instances,
  } as any;
}

function traverseAndBind(
  obj: any,
  path: string[],
  id: string,
  updateState: EventCallable<any>,
  visited = new Set<any>(),
) {
  if (!obj || typeof obj !== 'object') return;
  if (visited.has(obj)) return;
  visited.add(obj);

  for (const key in obj) {
    if (
      key === 'destroy' ||
      key === '__impls' ||
      key === '__fn' ||
      key === 'variant'
    )
      continue;
    const val = obj[key];

    if (is.store(val)) {
      sample({
        clock: val as Store<any>,
        fn: (value) => ({ id, path: [...path, key], value }),
        target: updateState,
      });
      updateState({ id, path: [...path, key], value: val.getState() });
    } else if (is.event(val) || is.effect(val)) {
      // Ignore events/effects for state
    } else if (typeof val === 'object') {
      traverseAndBind(val, [...path, key], id, updateState, visited);
    } else {
      updateState({ id, path: [...path, key], value: val });
    }
  }
}

function getFieldDef(
  model: Model<any, any, any> | Union<any>,
  facetName: string,
  fieldName: string,
) {
  if ((model as any).type === 'union') {
    const union = model as Union<any>;
    for (const subModel of Object.values(union.models)) {
      const def = (subModel as Model<any, any, any>).config.facets?.[facetName]
        ?.shape?.[fieldName];
      if (def) return def;
    }
  } else {
    const m = model as Model<any, any, any>;
    return m.config.facets?.[facetName]?.shape?.[fieldName];
  }
  return null;
}

function getTrigger(
  $instances: Store<Record<string, any>>,
  facetName: string,
  fieldName: string,
  unitsCache: Map<string, any>,
) {
  const cacheKey = `${facetName}.${fieldName}`;
  if (unitsCache.has(cacheKey)) return unitsCache.get(cacheKey);

  const trigger = createEvent<any>();
  const fx = createEffect(({ instances, id, payload }: any) => {
    const instance = instances[id];
    const facet = instance?.facets?.[facetName];
    const unit = facet?.impl?.[fieldName] || facet?.[fieldName];

    if (is.event(unit) || is.effect(unit)) (unit as any)(payload);
  });

  sample({
    clock: trigger,
    source: $instances,
    fn: (instances, payload) => {
      let id = payload;
      let realPayload = payload;

      if (
        typeof payload === 'object' &&
        payload !== null &&
        '__bound' in payload
      ) {
        id = payload.id;
        realPayload = payload.value;
      } else if (
        typeof payload === 'object' &&
        payload !== null &&
        'id' in payload
      ) {
        id = payload.id;
      }

      return { instances, id, payload: realPayload };
    },
    target: fx,
  });

  unitsCache.set(cacheKey, trigger);
  return trigger;
}

export function createItemProxy(
  $instances: Store<Record<string, any>>,
  $state: Store<Record<string, any>>,
  idOrStore: any,
  modelDef: Model<any, any, any> | Union<any>,
  $activeVariants?: Store<Record<string, string | null>>,
) {
  const unitsCache = new Map<string, any>();
  const boundEventsCache = new Map<string, any>();
  let $id: Store<string | null>;

  if (typeof idOrStore === 'string') {
    $id = createStore(idOrStore);
  } else if (is.store(idOrStore)) {
    $id = idOrStore as any;
  } else if (is.event(idOrStore)) {
    // Event-based proxy (Keep logic for now, but share getTrigger)
    return new Proxy(
      {},
      {
        get: (target, prop) => {
          if (prop === 'activeVariant') {
            return {
              _sourceEvent: idOrStore,
              _instances: $instances,
              _activeVariants: $activeVariants,
              _state: $state,
            };
          }
          if (prop === 'facets') {
            return new Proxy(
              {},
              {
                get: (_, facetName: string) => {
                  return new Proxy(
                    {},
                    {
                      get: (_, fieldName: string) => {
                        return getTrigger(
                          $instances,
                          facetName,
                          fieldName,
                          unitsCache,
                        );
                      },
                    },
                  );
                },
              },
            );
          }
          return Reflect.get(target, prop);
        },
      },
    );
  } else {
    $id = createStore(null);
  }

  return new Proxy(
    {},
    {
      get: (target, prop) => {
        if (prop === '__type') return 'lens';
        if (prop === 'source') return $instances;
        if (prop === 'state') return $state;
        if (prop === 'id') return $id;
        if (prop === 'path') return [];

        if (prop === 'match') {
          // Mock match for now, or implement a basic version that returns lens builder
          return (config: any) => {
            // This is a complex topic. 'match' in view usually returns a React Node or similar.
            // But here we want a 'Lens' that switches based on variant?
            // Or 'match' is just a helper to execute logic?
            // In view: match({ source: item.activeVariant, cases: ... })
            // Here 'item.match' could be a shortcut.
            return {
              __type: 'lens',
              source: $instances,
              state: $state,
              id: $id,
              path: [], // Root?
              // Match metadata
            };
          };
        }

        if (prop === 'facets') {
          return new Proxy(
            {},
            {
              get: (_, facetName: string) => {
                return new Proxy(
                  {},
                  {
                    get: (_, fieldName: string) => {
                      // Check Definition
                      const def = getFieldDef(modelDef, facetName, fieldName);
                      if (def && def.type === 'event') {
                        const cacheKey = `${facetName}.${fieldName}`;
                        if (boundEventsCache.has(cacheKey)) {
                          return boundEventsCache.get(cacheKey);
                        }

                        const trigger = getTrigger(
                          $instances,
                          facetName,
                          fieldName,
                          unitsCache,
                        );
                        const bound = createEvent<any>();

                        sample({
                          clock: bound,
                          source: $id,
                          fn: (id, payload) => ({
                            __bound: true,
                            id,
                            value: payload,
                          }),
                          target: trigger,
                        });

                        boundEventsCache.set(cacheKey, bound);
                        return bound;
                      }

                      return {
                        __type: 'lens',
                        source: $instances,
                        state: $state,
                        id: $id,
                        path: ['facets', facetName, fieldName],
                      } as Lens;
                    },
                  },
                );
              },
            },
          );
        }
        if (prop === 'input') {
          return new Proxy(
            {},
            {
              get: (_, inputName: string) => {
                return {
                  __type: 'lens',
                  source: $instances,
                  state: $state,
                  id: $id,
                  path: ['input', inputName],
                } as Lens;
              },
            },
          );
        }
        if (prop === 'activeVariant') {
          return {
            __type: 'lens',
            source: $instances,
            state: $state,
            id: $id,
            path: ['activeVariant'],
          } as Lens;
        }
        return Reflect.get(target, prop);
      },
    },
  );
}
