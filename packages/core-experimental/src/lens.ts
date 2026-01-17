import {
  Store,
  createStore,
  combine,
  is,
  createEvent,
  sample,
  createEffect,
} from 'effector';

export type Lens = {
  __type: 'lens';
  source: Store<Record<string, any>>; // The map of instances ($instances)
  state: Store<Record<string, any>>; // The map of instance states ($state)
  id: Store<string | null>;
  path: string[];
  fallbackValue?: any;
  variantName?: string;
  facetName?: string;
};

export function isLens(val: any): val is Lens {
  if (!val || typeof val !== 'object') return false;
  return (
    val.__type === 'lens' ||
    (is.store(val.source) && is.store(val.id) && Array.isArray(val.path))
  );
}

export function select(source: Lens | Store<any>) {
  let currentLens: Lens;

  if (isLens(source)) {
    currentLens = {
      __type: 'lens',
      source: (source as any).source,
      state: (source as any).state,
      id: (source as any).id,
      path: [...((source as any).path || [])],
      fallbackValue: (source as any).fallbackValue,
      variantName: (source as any).variantName,
      facetName: (source as any).facetName,
    };
  } else {
    throw new Error('select() source must be a Lens (from getItem)');
  }

  const builder = {
    variant: (name: string) => {
      return select({ ...currentLens, variantName: name });
    },
    facet: (name: string) => {
      const nextPath = [...currentLens.path];
      nextPath.push('facets', name);
      return select({ ...currentLens, path: nextPath, facetName: name });
    },
    path: (fn: (scope: any) => any) => {
      const nextPath = [...currentLens.path];
      const proxyHandler = {
        get: (_: any, prop: string | symbol) => {
          if (typeof prop === 'string') {
            nextPath.push(prop);
            return new Proxy({}, proxyHandler);
          }
          return null;
        },
      };
      const proxy = new Proxy({}, proxyHandler);
      fn(proxy);
      return select({ ...currentLens, path: nextPath });
    },
    fallback: (val: any) => {
      return toStore({ ...currentLens, fallbackValue: val });
    },
  };
  return builder;
}

function toStore(lens: Lens): Store<any> {
  // Use $state for reactive updates
  if (lens.state) {
    return combine(
      lens.state,
      lens.id,
      (state, id) => {
        if (!id || !state[id]) return lens.fallbackValue;

        let value = state[id];

        // Union variant check (requires checking _variant in state? or instance?)
        // State doesn't have _variant usually, it's a property on instance.
        // But we can assume if path resolution fails, it returns fallback.
        // Or we can check if 'variant' property exists in state?
        // traverseAndBind skips 'variant' property?
        // Let's assume for now we just resolve path.

        for (const key of lens.path) {
          if (value && typeof value === 'object' && key in value) {
            value = value[key];
          } else {
            // Try to be smart about nested structures in state
            // State mirrors instance structure.
            // If instance had { input: { $val: ... } }, state has { input: { $val: value } }
            // Path ['input', '$val'] works.
            // But what about __fn?
            // traverseAndBind flattens? No, it recurses.
            // So structure is preserved.
            return lens.fallbackValue;
          }
        }
        return value === undefined ? lens.fallbackValue : value;
      },
      { skipVoid: false },
    );
  }

  // Fallback for old behavior (should not happen with new keyval)
  return createStore(lens.fallbackValue);
}
