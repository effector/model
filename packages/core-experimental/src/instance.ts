import {
  createStore,
  createEvent,
  combine,
  sample,
  Store,
  Event,
  is,
  clearNode,
  Unit,
} from 'effector';
import { Model } from './model';
import { isRef } from './define';

function createWritableStore<T>(initial: T, config?: any) {
  const $store = createStore(initial, config);
  const rehydrate = createEvent<T>();
  $store.on(rehydrate, (_, payload) => payload);
  ($store as any).rehydrate = rehydrate;
  return $store;
}

export function create<
  Input extends Record<string, any>,
  Facets extends Record<string, any>,
  Variants extends { source: any; cases: Record<string, any> },
>(
  modelDef: Model<Input, Facets, Variants>,
  config: { input?: any; state?: any } = {},
): Model<Input, Facets, Variants>['_InstanceType'] {
  const { config: modelConfig } = modelDef;

  // 1. Process Input -> Extra
  const input = { ...config.input };
  const extraStores: Record<string, any> = {};

  // Support 'extra' or 'input' definition for metadata
  const modelExtraDef = (modelConfig.extra || modelConfig.input || {}) as any;

  for (const key in modelExtraDef) {
    const val = input[key];
    const def = modelExtraDef[key];

    if (val !== undefined) {
      extraStores[key] = val;
    } else if (def.type === 'store' && def.initial !== undefined) {
      extraStores[key] = createWritableStore(def.initial, { skipVoid: false });
    }
  }

  const reactiveExtra: Record<string, any> = {};
  for (const key in extraStores) {
    const val = extraStores[key];
    if (is.unit(val)) {
      reactiveExtra[key] = val;
    } else if (
      typeof val === 'object' &&
      val !== null &&
      (val.facets || val.activeVariant)
    ) {
      reactiveExtra[key] = val;
    } else {
      reactiveExtra[key] = createWritableStore(val, { skipVoid: false });
    }
  }

  // 2. Pre-allocate Facets (Thermodynamic Runtime)
  const preAllocatedFacets: Record<string, any> = {};
  const initialState = config.state || {};

  if (modelConfig.facets) {
    for (const [facetName, facetDef] of Object.entries(modelConfig.facets)) {
      const facetShape = (facetDef as any).shape;
      const facetInstance: Record<string, any> = {};
      const facetState = initialState[facetName] || {};

      for (const [fieldName, fieldDef] of Object.entries(facetShape)) {
        let def = fieldDef as any;

        if (def.type === 'store') {
          const initialValue =
            facetState[fieldName] !== undefined
              ? facetState[fieldName]
              : def.initial;

          const $base = createWritableStore(initialValue, { skipVoid: false });
          facetInstance[fieldName] = $base;
        } else if (def.type === 'event') {
          facetInstance[fieldName] = createEvent();
        } else if (def.type === 'array') {
          const initialValue =
            facetState[fieldName] !== undefined ? facetState[fieldName] : [];
          const $base = createWritableStore(initialValue, { skipVoid: false });
          facetInstance[fieldName] = $base;
        }
      }
      preAllocatedFacets[facetName] = facetInstance;
    }
  }

  // 3. Variants Logic
  let $activeVariant: Store<string | null> = createStore(null, {
    skipVoid: false,
  });
  const variantEvents: Record<
    string,
    { enter: Event<void>; leave: Event<void> }
  > = {};
  const variantImpls: Record<string, any> = {};

  if (modelConfig.variant) {
    const { source, cases } = modelConfig.variant;

    const sourceValue = source(reactiveExtra);
    const $source = is.store(sourceValue)
      ? sourceValue
      : createStore(sourceValue, { skipVoid: false });

    $activeVariant = $source.map((val: any) => {
      for (const [name, check] of Object.entries(cases)) {
        if ((check as any)(val)) return name;
      }
      return null;
    });

    const $prevVariant = createStore<string | null>(null, { skipVoid: false });

    const variantTransition = sample({
      clock: $activeVariant,
      source: $prevVariant,
      fn: (prev, current) => ({ prev, current }),
    });

    sample({
      clock: variantTransition,
      fn: ({ current }) => current,
      target: $prevVariant,
    });

    for (const caseName of Object.keys(cases)) {
      const enter = createEvent<void>();
      const leave = createEvent<void>();
      variantEvents[caseName] = { enter, leave };

      sample({
        clock: variantTransition,
        filter: ({ current }) => current === caseName,
        target: enter,
      });

      sample({
        clock: variantTransition,
        filter: ({ prev, current }) =>
          prev === caseName && current !== caseName,
        target: leave,
      });
    }
  }

  // 4. Run Implementations
  let fnResult: any = {};
  if (modelConfig.fn) {
    fnResult = modelConfig.fn(reactiveExtra, preAllocatedFacets) || {};
  }

  if (modelConfig.impl) {
    if (typeof modelConfig.impl === 'function') {
      const implResult = modelConfig.impl(reactiveExtra, preAllocatedFacets);
      fnResult = { ...fnResult, ...implResult };
    } else {
      for (const [variantName, implFn] of Object.entries(modelConfig.impl)) {
        variantImpls[variantName] = (implFn as any)(
          reactiveExtra,
          preAllocatedFacets,
        );
      }
    }
  }

  // 6. Post-Process Facets
  const facets: Record<string, any> = {};

  if (modelConfig.facets) {
    for (const [facetName, facetDef] of Object.entries(modelConfig.facets)) {
      const facetShape = (facetDef as any).shape;
      const facetInstance: Record<string, any> = {};
      const preAllocated = preAllocatedFacets[facetName];

      for (const [fieldName, fieldDef] of Object.entries(facetShape)) {
        let def = fieldDef as any;

        if (isRef(def)) {
          if (def.kind === 'tag' && def.name) {
            if (reactiveExtra[def.name]) {
              facetInstance[fieldName] = reactiveExtra[def.name];
              continue;
            }
            if (fnResult[def.name]) {
              facetInstance[fieldName] = fnResult[def.name];
              continue;
            }
          }
        }

        if (def.type === 'store' || def.type === 'array') {
          const variantsForField: Record<string, Store<any>> = {};

          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            const variantFacetImpl =
              (implResult as any)[facetName]?.impl ||
              (implResult as any)[facetName];
            if (variantFacetImpl && variantFacetImpl[fieldName]) {
              let val = variantFacetImpl[fieldName];
              if (val && val.type === 'store') {
                val = createWritableStore(val.initial, { skipVoid: false });
              }
              if (is.store(val)) variantsForField[variantName] = val;
            }
          }

          let baseStore = (fnResult[facetName]?.impl || fnResult[facetName])?.[
            fieldName
          ];

          if (!baseStore) {
            baseStore = preAllocated[fieldName];
          }

          if (baseStore && def.initial !== undefined && !is.store(baseStore)) {
            baseStore = createWritableStore(baseStore, { skipVoid: false });
          }

          const stores = Object.values(variantsForField);
          const names = Object.keys(variantsForField);

          if (stores.length > 0) {
            facetInstance[fieldName] = combine(
              [$activeVariant, baseStore, ...stores],
              ([active, base, ...vals]: any[]) => {
                const idx = names.indexOf(active);
                if (idx !== -1) return vals[idx];
                return base;
              },
              { skipVoid: false },
            );
          } else {
            facetInstance[fieldName] = baseStore;
          }

          if ((baseStore as any).rehydrate) {
            const rehydrate = createEvent();
            (facetInstance[fieldName] as any).rehydrate = rehydrate;
            sample({
              clock: rehydrate,
              target: (baseStore as any).rehydrate,
            });
          }
        } else if (def.type === 'event') {
          let mainEvent = (fnResult[facetName]?.impl || fnResult[facetName])?.[
            fieldName
          ];

          if (!mainEvent) {
            mainEvent = preAllocated[fieldName];
          }

          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            const variantFacetImpl =
              (implResult as any)[facetName]?.impl ||
              (implResult as any)[facetName];
            if (variantFacetImpl && variantFacetImpl[fieldName]) {
              const val = variantFacetImpl[fieldName];
              if (is.event(val)) {
                sample({
                  clock: mainEvent,
                  filter: $activeVariant.map((v) => v === variantName),
                  target: val as any,
                } as any);
              }
            }
          }
          facetInstance[fieldName] = mainEvent;
        }
      }
      facets[facetName] = facetInstance;

      if (typeof (facetDef as any)._linker === 'function') {
        (facetDef as any)._linker(facetInstance);
      }
    }
  }

  const destroy = () => {
    clearNode($activeVariant);
    for (const e of Object.values(variantEvents)) {
      clearNode(e.enter);
      clearNode(e.leave);
    }
    for (const f of Object.values(facets)) {
      for (const u of Object.values(f)) {
        if (is.unit(u)) clearNode(u as any);
      }
    }
    const inputs = new Set(Object.values(extraStores));
    if (typeof fnResult.destroy === 'function') {
      fnResult.destroy();
    }
    for (const val of Object.values(fnResult)) {
      if (val && typeof val === 'object') {
        if (is.unit(val) && !inputs.has(val)) {
          clearNode(val);
        }
        if (typeof (val as any).destroy === 'function') {
          (val as any).destroy();
        }
        if ((val as any).facets) {
          for (const f of Object.values((val as any).facets)) {
            if (f && typeof f === 'object') {
              const facetImpl = (f as any).impl || f;
              for (const u of Object.values(facetImpl as any)) {
                if (is.unit(u)) clearNode(u as any);
              }
            }
          }
        }
      }
    }
  };

  const result = {
    facets,
    variant: variantEvents,
    activeVariant: $activeVariant,
    input: extraStores,
    extra: extraStores, // Alias
    __impls: variantImpls,
    __fn: fnResult,
    destroy,
  } as any;

  for (const [key, value] of Object.entries(fnResult)) {
    if (!(key in result)) result[key] = value;
  }

  for (const key in modelExtraDef) {
    if (!(key in result)) result[key] = extraStores[key];
  }
  result.input = reactiveExtra;

  return result as Model<Input, Facets, Variants>['_InstanceType'];
}
