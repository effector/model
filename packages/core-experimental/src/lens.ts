import { Store, createStore, combine, is, createEvent } from 'effector';

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
  const $output = createStore(lens.fallbackValue);
  const updateOutput = createEvent<any>();

  $output.on(updateOutput, (_, val) => val);

  // State to hold current unsubscription function
  let currentUnsub: (() => void) | null = null;

  const $context = combine({
    instances: lens.source,
    id: lens.id,
  });

  // Subscription Manager
  // When context changes (ID or List changes), we resolve the target and re-subscribe
  $context.watch(({ instances, id }) => {
    // 1. Unsubscribe from previous target
    if (currentUnsub) {
      currentUnsub();
      currentUnsub = null;
    }

    // 2. Resolve new target
    if (!id || !instances[id]) {
      updateOutput(lens.fallbackValue);
      return;
    }

    let value = instances[id];
    for (const key of lens.path) {
      if (value && value[key]) {
        value = value[key];
      } else {
        value = undefined;
        break;
      }
    }

    // 3. Subscribe to new target
    if (is.store(value)) {
      // It's a store: pipe updates to output
      currentUnsub = (value as Store<any>).watch((newValue: any) => {
        updateOutput(newValue);
      });
    } else {
      // It's a static value: just update once
      updateOutput(value === undefined ? lens.fallbackValue : value);
    }
  });

  return $output;
}
