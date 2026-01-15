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

export type Keyval<M> = {
  type: 'keyval';
  model: M;
  add: EventCallable<{ id: string; variant?: string; input: any }>;
  remove: EventCallable<string>;
  getItem: (
    idOrStore:
      | string
      | Store<string | null>
      | Event<string>
      | Event<{ id: string }>,
  ) => any;
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

  const add = createEvent<{ id: string; variant?: string; input: any }>();
  const remove = createEvent<string>();
  const addValid = createEvent<{ id: string; variant?: string; input: any }>();
  const updateState = createEvent<{
    id: string;
    path: string[];
    value: any;
  }>();

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

  sample({
    clock: add,
    filter: ({ id, variant, input }) => {
      if (!input) {
        console.error(`Input missing for item ${id}`);
        return false;
      }

      let modelDef: Model<any, any, any>;
      if ((config.model as any).type === 'union') {
        const unionModel = config.model as Union<any>;
        if (!variant || !unionModel.models[variant]) {
          console.error(`Variant ${variant} not found in union`);
          return false;
        }
        modelDef = unionModel.models[variant];
      } else {
        modelDef = config.model as Model<any, any, any>;
      }

      const modelInputDef = modelDef.config.input || {};
      for (const key in modelInputDef) {
        const def = modelInputDef[key];
        if (def.type === 'store' && def.initial === undefined) {
          if (input[key] === undefined) {
            console.error(`Required input "${key}" missing for item ${id}`);
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

  const createInstanceFx = createEffect(
    ({ id, variant, input }: { id: string; variant?: string; input: any }) => {
      let modelDef: Model<any, any, any>;
      if ((config.model as any).type === 'union') {
        const unionModel = config.model as Union<any>;
        modelDef = unionModel.models[variant!];
      } else {
        modelDef = config.model as Model<any, any, any>;
      }

      const instance = create(modelDef, { input });
      if ((config.model as any).type === 'union') {
        (instance as any)._variant = variant;
      }

      sample({
        clock: instance.activeVariant,
        fn: (v: any) => ({ id, variant: v }),
        target: updateVariant,
      } as any);
      // Initial variant value
      updateVariant({ id, variant: instance.activeVariant.getState() });

      // Bind instance stores to $state
      traverseAndBind(instance, [], id, updateState);

      return { id, instance };
    },
  );

  sample({
    clock: addValid,
    source: $instances,
    filter: (instances, { id }) => !instances[id],
    fn: (_, payload) => payload,
    target: createInstanceFx,
  });

  $instances.on(createInstanceFx.doneData, (instances, { id, instance }) => ({
    ...instances,
    [id]: instance,
  }));

  $instances.on(remove, (instances, id) => {
    const instance = instances[id];
    if (!instance) return instances;
    if (instance.destroy) instance.destroy();
    const { [id]: _, ...rest } = instances;
    return rest;
  });

  $items.on(createInstanceFx.doneData, (items, { id }) => {
    if (items.includes(id)) return items;
    return [...items, id];
  });
  $items.on(remove, (items, id) => items.filter((x) => x !== id));

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
      $activeVariants,
    );
    proxyCache.set(key, proxy);
    return proxy;
  };

  return {
    type: 'keyval',
    model: config.model,
    add,
    remove,
    getItem,
    $items,
    $activeVariants,
    $state,
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
      // Initial value
      updateState({ id, path: [...path, key], value: val.getState() });
    } else if (is.event(val) || is.effect(val)) {
      // Ignore events/effects for state
    } else if (typeof val === 'object') {
      traverseAndBind(val, [...path, key], id, updateState, visited);
    } else {
      // Static value
      updateState({ id, path: [...path, key], value: val });
    }
  }
}

export function createItemProxy(
  $instances: Store<Record<string, any>>,
  $state: Store<Record<string, any>>,
  idOrStore: any,
  $activeVariants?: Store<Record<string, string | null>>,
) {
  let $id: Store<string | null>;
  if (typeof idOrStore === 'string') {
    $id = createStore(idOrStore);
  } else if (is.store(idOrStore)) {
    $id = idOrStore as any;
  } else if (is.event(idOrStore)) {
    const unitsCache = new Map<string, any>();

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
                        const cacheKey = `${facetName}.${fieldName}`;
                        if (unitsCache.has(cacheKey))
                          return unitsCache.get(cacheKey);

                        const trigger = createEvent<any>();
                        const fx = createEffect(
                          ({ instances, id, payload }: any) => {
                            const instance = instances[id];
                            const facet = instance?.facets?.[facetName];
                            // Support both direct and implement() wrapped
                            const unit =
                              facet?.impl?.[fieldName] || facet?.[fieldName];

                            if (is.event(unit) || is.effect(unit))
                              (unit as any)(payload);
                          },
                        );

                        sample({
                          clock: trigger,
                          source: $instances,
                          fn: (instances, payload) => {
                            let id = payload;
                            if (
                              typeof payload === 'object' &&
                              payload !== null &&
                              'id' in payload
                            )
                              id = payload.id;
                            return { instances, id, payload };
                          },
                          target: fx,
                        });

                        unitsCache.set(cacheKey, trigger);
                        return trigger;
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

        if (prop === 'facets') {
          return new Proxy(
            {},
            {
              get: (_, facetName: string) => {
                return new Proxy(
                  {},
                  {
                    get: (_, fieldName: string) => {
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
