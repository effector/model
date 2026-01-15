import { Store, createStore, combine, is } from 'effector';

export type Lens = {
  __type: 'lens';
  source: Store<any>; // The map of instances
  id: Store<string | null>;
  path: string[];
  fallbackValue?: any;
};

export function isLens(val: any): val is Lens {
  return val && val.__type === 'lens';
}

export function select(source: Lens | Store<any>) {
  // If source is a Lens, we can extend the path.
  // If source is a Store, we treat it as a root?
  // The user example: `select(gameModel.variants.status.losing)` -> This is getting a variant implementation?
  // No, `select(gameModel.variants.status.losing)` in the article refers to a variant DEFINITION or Scope?
  // `gameModel` is the Model Definition.
  // Wait, `gameModel.variants...` implies the Model Def has this structure.

  // But later: `select($currentUser).variant("member")...`
  // Here `$currentUser` is a Store/Lens from `getItem`.

  let currentLens: Lens;

  if (isLens(source)) {
    currentLens = {
      __type: 'lens',
      source: source.source,
      id: source.id,
      path: [...source.path],
      fallbackValue: source.fallbackValue,
    };
  } else {
    // If it's a store, we assume it's a store of an object and we want to drill down?
    // Or it's a "Scope" store?
    // For now, let's assume usage with `getItem` result which is a Lens.
    throw new Error('select() source must be a Lens (from getItem)');
  }

  const builder = {
    variant: (variantName: string) => {
      // Filter by variant?
      // In the example: `.variant("member")` targets the member variant.
      // It doesn't change the path, but maybe checks activeVariant?
      return builder;
    },
    facet: (facetName: string) => {
      currentLens.path.push('facets', facetName);
      return builder;
    },
    path: (fn: (scope: any) => any) => {
      // fn is like `scope => scope.$intensity`
      // We need to capture the field name accessed in fn.
      // We can pass a Proxy to fn to record access.
      const proxy = new Proxy(
        {},
        {
          get: (_, prop) => {
            if (typeof prop === 'string') currentLens.path.push(prop);
            return null;
          },
        },
      );
      fn(proxy);
      return builder;
    },
    fallback: (val: any) => {
      currentLens.fallbackValue = val;
      return toStore(currentLens);
    },
  };
  return builder;
}

function toStore(lens: Lens): Store<any> {
  // Create a store that combines instances, id, and path.
  // This is the "expensive" part that `select` hides.
  return combine(
    lens.source,
    lens.id,
    (instances, id) => {
      if (!id || !instances[id]) return lens.fallbackValue;

      const instance = instances[id];
      let value = instance;

      for (const key of lens.path) {
        if (value && value[key]) {
          value = value[key];
        } else {
          return lens.fallbackValue;
        }
      }

      // If the result is a Store (nested store), we need to extract its value.
      // BUT we are inside `combine`. We cannot read a store's value reactively inside combine!
      // This confirms `select` must return a Store that flattens this.
      // Effector doesn't support this "Higher Order Store" natively easily.

      // HACK: For this prototype, we assume the values in instances are NOT stores, but VALUES.
      // BUT `create()` puts Stores in facets.
      // So `instance.facets.visual.$color` is a Store.

      // To make this work, `create()` should perhaps return an object where properties are VALUES,
      // and the whole instance object is updated whenever any property changes?
      // That would be a huge object update.

      // Alternative: `select` returns a store that subscribes to the specific nested store.
      // This requires a custom Effect or subscription management.

      // For the sake of the prototype and "dev mode", we can use `getState()` inside the combine *if* we force updates.
      // But `getState` is not reactive.

      // Let's rely on the fact that `instance` properties are stable references (Stores).
      // We only need to switch which Store we are listening to when ID changes.
      // This is exactly what `switch` pattern does.
      // But we have arbitrary nesting.

      if (is.store(value)) {
        return value.getState(); // NON-REACTIVE HACK for prototype?
        // If we want reactivity, we need to return a Store that updates.
      }
      return value;
    },
    { skipVoid: false },
  );
}
