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
import { Model, InferConfigInput } from './model';
import { create } from './instance';
import { Lens } from './lens';
import { Facet, FacetShape } from './facet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionConfig<M extends Record<string, Model<any, any, any>>> = M;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Union<M extends Record<string, Model<any, any, any>>> = {
  type: 'union';
  models: M;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  T extends Store<infer V>
    ? Lens
    : T extends EventCallable<infer P>
      ? EventCallable<P>
      : T extends Record<string, unknown>
        ? { [K in keyof T]: Lensify<T[K]> }
        : unknown;

type ModelInstanceType<M> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends Model<any, any, any>
    ? M['_InstanceType']
    : M extends Union<infer U>
      ? U[keyof U]['_InstanceType']
      : never;

export type LensProxy<M> = Lensify<ModelInstanceType<M>> &
  Lens & {
    activeVariant: Lens;
    match: (config: {
      source?: unknown;
      cases: Record<string, (scope: unknown) => unknown>;
    }) => unknown;
  };

export type InferKeyvalInput<M> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends Model<infer I, any, any>
    ? InferConfigInput<I>
    : M extends Union<infer U>
      ? { [K in keyof U]: InferKeyvalInput<U[K]> }[keyof U]
      : unknown;

export type Keyval<M> = {
  type: 'keyval';
  model: M;
  add: EventCallable<{
    id: string;
    variant?: string;
    input: InferKeyvalInput<M>;
    state?: Record<string, unknown>;
  }>;
  update: EventCallable<{
    id: string;
    input?: Partial<InferKeyvalInput<M>>;
    state?: Record<string, unknown>;
  }>;
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
  $state: Store<Record<string, unknown>>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function keyval<M extends Union<any> | Model<any, any, any>>(
  config: KeyvalConfig<M>,
): Keyval<M> {
  const $items = createStore<string[]>([]);
  const $instances = createStore<Record<string, unknown>>({});
  const $activeVariants = createStore<Record<string, string | null>>({});
  const $state = createStore<Record<string, unknown>>({});

  const add = createEvent<{
    id: string;
    variant?: string;
    input: InferKeyvalInput<M>;
    state?: Record<string, unknown>;
  }>();
  const update = createEvent<{
    id: string;
    input?: Partial<InferKeyvalInput<M>>;
    state?: Record<string, unknown>;
  }>();
  const remove = createEvent<string>();
  const reset = createEvent();
  const addValid = createEvent<{
    id: string;
    variant?: string;
    input: InferKeyvalInput<M>;
    state?: Record<string, unknown>;
  }>();
  const updateState = createEvent<{
    id: string;
    path: string[];
    value: unknown;
  }>();
  const clearInstanceState = createEvent<string>();

  // Update Logic
  const updateInstanceFx = createEffect(
    ({
      instances,
      id,
      input,
      state,
    }: {
      instances: Record<string, unknown>;
      id: string;
      input?: Record<string, unknown>;
      state?: Record<string, unknown>;
    }) => {
      const instance = instances[id] as Record<string, unknown>;
      if (!instance) return;

      // Update Inputs
      if (input) {
        // instance.input contains stores
        const instanceInput = instance.input as Record<string, unknown>;
        for (const [key, val] of Object.entries(input)) {
          const store = instanceInput[key];
          if (
            store &&
            (store as { rehydrate: EventCallable<unknown> }).rehydrate
          ) {
            (store as { rehydrate: EventCallable<unknown> }).rehydrate(val);
          }
        }
      }

      // Update State (Facets)
      if (state) {
        // Traverse state and update stores
        for (const [facetName, facetState] of Object.entries(state)) {
          const facets = instance.facets as Record<
            string,
            Record<string, unknown>
          >;
          const facet = facets?.[facetName];
          if (facet && typeof facetState === 'object' && facetState !== null) {
            for (const [fieldName, val] of Object.entries(
              facetState as Record<string, unknown>,
            )) {
              const store = facet[fieldName];
              if (
                store &&
                (store as { rehydrate: EventCallable<unknown> }).rehydrate
              ) {
                (store as { rehydrate: EventCallable<unknown> }).rehydrate(val);
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
    let current = (newState[id] ? { ...newState[id] } : {}) as Record<
      string,
      unknown
    >;
    newState[id] = current;

    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      current[key] = (current[key] ? { ...current[key] } : {}) as Record<
        string,
        unknown
      >;
      current = current[key] as Record<string, unknown>;
    }
    current[path[path.length - 1]] = value;
    return newState;
  });

  $state.on(remove, (state, id) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: _, ...rest } = state;
    return rest;
  });
  $state.on(clearInstanceState, (state, id) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: _, ...rest } = state;
    return rest;
  });
  $state.reset(reset);

  sample({
    clock: add,
    filter: ({ id, variant, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const actualVariant = variant || (input as any)?.type;
      console.log(
        `[keyval] Validating add for ${id} (variant: ${actualVariant})`,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let modelDef: Model<any, any, any>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((config.model as any).type === 'union') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unionModel = config.model as Union<any>;
        if (!actualVariant || !unionModel.models[actualVariant]) {
          console.error(`[keyval] Variant ${actualVariant} not found in union`);
          return false;
        }
        modelDef = unionModel.models[actualVariant];
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        modelDef = config.model as Model<any, any, any>;
      }

      const modelExtraDef =
        modelDef.config.extra || modelDef.config.input || {};
      const typedInput = input as Record<string, unknown>;
      for (const key in modelExtraDef) {
        const def = modelExtraDef[key];
        // Only check if it's a required input (no initial value)
        if (def.type === 'store' && def.initial === undefined) {
          if (!typedInput || typedInput[key] === undefined) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      input: unknown;
      state?: unknown;
    }) => {
      let modelDef: Model<
        Record<string, unknown>,
        Record<string, unknown>,
        any
      >;
      const resolvedVariant = variant || (input as { type?: string })?.type;
      if ('type' in config.model && config.model.type === 'union') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unionModel = config.model as Union<any>;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        modelDef = unionModel.models[resolvedVariant!];
      } else {
        modelDef = config.model as Model<
          Record<string, unknown>,
          Record<string, unknown>,
          any
        >;
      }

      const instance = create(modelDef, {
        input: input as InferConfigInput<Record<string, unknown>>,
        state: state as Record<string, unknown>,
      });
      (instance as unknown as { _variant: string | null })._variant =
        resolvedVariant || instance.activeVariant.getState();

      sample({
        clock: instance.activeVariant,
        fn: (v) => ({ id, variant: v }),
        target: updateVariant,
      });

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
    fn: ({ id }) => id,
    target: clearInstanceState,
  });

  sample({
    clock: addValid,
    source: $instances,
    fn: (instances, { id, variant, input, state }) => {
      console.log(
        `[keyval] addValid triggered for ${id}. Variant: ${variant}. Input keys:`,
        Object.keys(input || {}),
      );
      const existing = instances[id] as { destroy?: () => void };
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
    const instance = instances[id] as { destroy?: () => void };
    if (!instance) return instances;
    if (instance.destroy) instance.destroy();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [id]: _, ...rest } = instances;
    return rest;
  });

  $instances.on(createInstanceFx.doneData, (instances, { id, instance }) => ({
    ...instances,
    [id]: instance,
  }));

  $instances.on(reset, (instances) => {
    Object.values(instances).forEach((instance) => {
      const inst = instance as { destroy?: () => void };
      if (inst && inst.destroy) inst.destroy();
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // type-coverage:ignore-next-line
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as Keyval<M>;
}

function traverseAndBind(
  obj: unknown,
  path: string[],
  id: string,
  updateState: EventCallable<{ id: string; path: string[]; value: unknown }>,
  visited = new Set<unknown>(),
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
    const val = (obj as Record<string, unknown>)[key];

    if (is.store(val)) {
      sample({
        clock: val as Store<unknown>,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Model<Record<string, unknown>, Record<string, unknown>, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Union<any>,
  facetName: string,
  fieldName: string,
) {
  if ('type' in model && model.type === 'union') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const union = model as Union<any>;
    for (const subModel of Object.values(union.models)) {
      const facets =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (
          subModel as Model<
            Record<string, unknown>,
            Record<string, unknown>,
            any
          >
        ).config.facets as Record<string, Facet<FacetShape>> | undefined;
      const def = facets?.[facetName]?.shape?.[fieldName];
      if (def) return def;
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = model as Model<
      Record<string, unknown>,
      Record<string, unknown>,
      any
    >;
    const facets = m.config.facets as
      | Record<string, Facet<FacetShape>>
      | undefined;
    return facets?.[facetName]?.shape?.[fieldName];
  }
  return null;
}

function getTrigger(
  $instances: Store<Record<string, unknown>>,
  facetName: string,
  fieldName: string,
  unitsCache: Map<string, Event<unknown>>,
) {
  const cacheKey = `${facetName}.${fieldName}`;
  if (unitsCache.has(cacheKey)) return unitsCache.get(cacheKey);

  const trigger = createEvent<unknown>();
  const fx = createEffect(
    ({
      instances,
      id,
      payload,
    }: {
      instances: Record<string, unknown>;
      id: string;
      payload: unknown;
    }) => {
      const instance = instances[id] as Record<string, unknown>;
      const facets = instance?.facets as Record<
        string,
        Record<string, unknown>
      >;
      const facet = facets?.[facetName];
      const facetImpl = (facet?.impl as Record<string, unknown>) || facet;
      const unit = facetImpl?.[fieldName];

      if (is.event(unit) || is.effect(unit))
        (unit as EventCallable<unknown>)(payload);
    },
  );

  sample({
    clock: trigger,
    source: $instances,
    fn: (instances, payload) => {
      let id = payload as string;
      let realPayload = payload;

      if (
        typeof payload === 'object' &&
        payload !== null &&
        '__bound' in payload
      ) {
        const bound = payload as unknown as { id: string; value: unknown };
        id = bound.id;
        realPayload = bound.value;
      } else if (
        typeof payload === 'object' &&
        payload !== null &&
        'id' in payload
      ) {
        const withId = payload as unknown as { id: string };
        id = withId.id;
      }

      return { instances, id, payload: realPayload };
    },
    target: fx,
  });

  unitsCache.set(cacheKey, trigger);
  return trigger;
}

export function createItemProxy(
  $instances: Store<Record<string, unknown>>,
  $state: Store<Record<string, unknown>>,
  idOrStore: unknown,
  modelDef: // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Model<Record<string, unknown>, Record<string, unknown>, any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Union<any>,
  $activeVariants?: Store<Record<string, string | null>>,
) {
  const unitsCache = new Map<string, Event<unknown>>();
  const boundEventsCache = new Map<string, Event<unknown>>();
  let $id: Store<string | null>;

  if (typeof idOrStore === 'string') {
    $id = createStore(idOrStore);
  } else if (is.store(idOrStore)) {
    $id = idOrStore as Store<string | null>;
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
              _modelDef: modelDef,
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
          return () => {
            return {
              __type: 'lens',
              source: $instances,
              state: $state,
              id: $id,
              path: [], // Root?
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
                        ) as EventCallable<unknown>;
                        const bound = createEvent<unknown>();

                        sample({
                          clock: bound,
                          source: $id,
                          fn: (id: string | null, payload: unknown) => ({
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
