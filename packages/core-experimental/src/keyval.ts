import {
  Store,
  Event,
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
  add: Event<{ id: string; variant?: string; input: any }>;
  getItem: (id: string | Store<string | null> | Event<string>) => any;
  $items: Store<string[]>;
};

export function keyval<M extends Union<any> | Model<any, any, any>>(
  config: KeyvalConfig<M>,
): Keyval<M> {
  const $items = createStore<string[]>([]);
  const $instances = createStore<Record<string, any>>({});
  const add = createEvent<{ id: string; variant?: string; input: any }>();

  $instances.on(add, (instances, { id, variant, input }) => {
    if (instances[id]) return instances;

    let modelDef: Model<any, any, any>;
    if ((config.model as any).type === 'union') {
      const unionModel = config.model as Union<any>;
      if (!variant || !unionModel.models[variant]) {
        console.error(`Variant ${variant} not found in union`);
        return instances;
      }
      modelDef = unionModel.models[variant];
    } else {
      modelDef = config.model as Model<any, any, any>;
    }

    const instance = create(modelDef, { input });
    // Attach variant info to instance if it's a union
    if ((config.model as any).type === 'union') {
      // We can attach it to the instance object, it won't affect the shape
      (instance as any)._variant = variant;
    }

    return { ...instances, [id]: instance };
  });

  $items.on(add, (items, { id }) => [...items, id]);

  const getItem = (
    idOrStore: string | Store<string | null> | Event<string>,
  ) => {
    return createItemProxy($instances, idOrStore);
  };

  return {
    type: 'keyval',
    model: config.model,
    add,
    getItem,
    $items,
  };
}

export function createItemProxy(
  $instances: Store<Record<string, any>>,
  idOrStore: string | Store<string | null> | Event<string>,
) {
  // If it's a string, wrap in store
  let $id: Store<string | null>;
  if (typeof idOrStore === 'string') {
    $id = createStore(idOrStore);
  } else if (is.store(idOrStore)) {
    $id = idOrStore;
  } else if (is.event(idOrStore)) {
    // It's an event (Action routing)
    // Return a proxy that handles events
    return new Proxy(
      {},
      {
        get: (target, prop) => {
          if (prop === 'activeVariant') {
            return {
              _sourceEvent: idOrStore,
              _instances: $instances,
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
                        // This returns a Unit that triggers the instance method
                        const trigger = createEvent<any>();

                        const fx = createEffect(
                          ({ instances, id, payload }: any) => {
                            const instance = instances[id];
                            const unit =
                              instance?.facets?.[facetName]?.[fieldName];
                            if (is.event(unit) || is.effect(unit)) {
                              (unit as any)(payload);
                            }
                          },
                        );

                        sample({
                          clock: idOrStore as Event<string>, // The ID event
                          source: $instances,
                          fn: (instances, id) => ({
                            instances,
                            id,
                            payload: undefined,
                          }), // We lose payload if trigger is ID-only
                          target: fx,
                        });

                        // If the user triggers the returned unit directly?
                        // `sample({ clock: kickUser, target: userToKick.facets.user.kick })`
                        // Here `kickUser` IS `idOrStore`.
                        // And `target` IS `trigger`.
                        // Wait, `target` expects a Unit. `trigger` is a Unit.
                        // But `kickUser` is already connected to `fx` above?
                        // No, `kickUser` is passed to `getItem`.

                        // The user does:
                        // `const userToKick = usersList.getItem(kickUser);`
                        // `sample({ clock: kickUser, target: userToKick.facets.user.kick })`

                        // If `kickUser` fires, `userToKick...kick` (which is `trigger`) fires?
                        // No, `target` receives the payload from `clock`.
                        // `kickUser` payload is ID.
                        // So `trigger` receives ID.

                        // We need to use `trigger` to fire the effect.

                        sample({
                          clock: trigger, // Receives ID
                          source: $instances,
                          fn: (instances, id) => ({
                            instances,
                            id,
                            payload: undefined,
                          }),
                          target: fx,
                        });

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
    $id = createStore(null); // Should not happen
  }

  // It's a Store (Data selection)
  // Return a Proxy that builds a Lens
  return new Proxy(
    {},
    {
      get: (target, prop) => {
        // Expose Lens properties on the root proxy
        if (prop === '__type') return 'lens';
        if (prop === 'source') return $instances;
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
        if (prop === 'activeVariant') {
          return {
            __type: 'lens',
            source: $instances,
            id: $id,
            path: ['activeVariant'],
          } as Lens;
        }
        return Reflect.get(target, prop);
      },
    },
  );
}
