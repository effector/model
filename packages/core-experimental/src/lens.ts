import { Store, createStore, combine, is } from 'effector';

export type Lens = {
  __type: 'lens';
  source: Store<Record<string, unknown>>; // The map of instances ($instances)
  state: Store<Record<string, unknown>>; // The map of instance states ($state)
  id: Store<string | null>;
  path: string[];
  fallbackValue?: unknown;
  variantName?: string;
  facetName?: string;
};

export function isLens(val: unknown): val is Lens {
  if (!val || typeof val !== 'object') return false;
  return (
    (val as { __type: unknown }).__type === 'lens' ||
    (is.store((val as Lens).source) &&
      is.store((val as Lens).id) &&
      Array.isArray((val as Lens).path))
  );
}

export function select(source: Lens | Store<unknown>) {
  let currentLens: Lens;

  if (isLens(source)) {
    currentLens = {
      __type: 'lens',
      source: source.source,
      state: source.state,
      id: source.id,
      path: [...(source.path || [])],
      fallbackValue: source.fallbackValue,
      variantName: source.variantName,
      facetName: source.facetName,
    };
  } else {
    const type = typeof source;
    const isNull = source === null;
    throw new Error(
      `select() source must be a Lens (from getItem). Received: ${
        isNull ? 'null' : type
      }`,
    );
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
    path: (fn: (scope: Record<string, unknown>) => unknown) => {
      const nextPath = [...currentLens.path];
      const proxyHandler: ProxyHandler<object> = {
        get: (_: object, prop: string | symbol) => {
          if (typeof prop === 'string') {
            nextPath.push(prop);
            return new Proxy({}, proxyHandler);
          }
          return null;
        },
      };
      const proxy = new Proxy({}, proxyHandler);
      fn(proxy as Record<string, unknown>);
      return select({ ...currentLens, path: nextPath });
    },
    fallback: (val: unknown) => {
      return toStore({ ...currentLens, fallbackValue: val });
    },
  };
  return builder;
}

function toStore(lens: Lens): Store<unknown> {
  // Use $state for reactive updates
  if (lens.state) {
    return combine(
      lens.state,
      lens.id,
      (state, id) => {
        if (!id || !state[id]) return lens.fallbackValue;

        let value: unknown = state[id];

        for (const key of lens.path) {
          if (
            value &&
            typeof value === 'object' &&
            key in (value as Record<string, unknown>)
          ) {
            value = (value as Record<string, unknown>)[key];
          } else {
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
