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

export function create(
  modelDef: Model<any, any, any>,
  config: { input?: any } = {},
) {
  const { config: modelConfig } = modelDef;

  // 1. Process Input
  const input = { ...config.input };
  const inputStores: Record<string, any> = {};

  const modelInputDef = modelConfig.input || {};

  for (const key in modelInputDef) {
    const val = input[key];
    const def = modelInputDef[key];

    if (val !== undefined) {
      inputStores[key] = val;
    } else if (def.type === 'store' && def.initial !== undefined) {
      inputStores[key] = createStore(def.initial, { skipVoid: false });
    }
  }

  const reactiveInputs: Record<string, any> = {};
  for (const key in inputStores) {
    const val = inputStores[key];
    if (is.unit(val)) {
      reactiveInputs[key] = val;
    } else if (
      typeof val === 'object' &&
      val !== null &&
      (val.facets || val.activeVariant)
    ) {
      reactiveInputs[key] = val;
    } else {
      reactiveInputs[key] = createStore(val, { skipVoid: false });
    }
  }

  // 2. Variants Logic
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

    const sourceValue = source(reactiveInputs);
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

  // 3. Run Implementations
  if (modelConfig.impl) {
    for (const [variantName, implFn] of Object.entries(modelConfig.impl)) {
      variantImpls[variantName] = (implFn as any)(reactiveInputs);
    }
  }

  // 5. Run `fn` if present
  let fnResult: any = {};
  if (modelConfig.fn) {
    fnResult = modelConfig.fn(reactiveInputs) || {};
  }

  // 4. Multiplex Facets
  const facets: Record<string, any> = {};

  if (modelConfig.facets) {
    for (const [facetName, facetDef] of Object.entries(modelConfig.facets)) {
      const facetShape = (facetDef as any).shape;
      const facetInstance: Record<string, any> = {};

      for (const [fieldName, fieldDef] of Object.entries(facetShape)) {
        const def = fieldDef as any;

        if (def.type === 'store') {
          const variantsForField: Record<string, Store<any>> = {};

          // From variant impls
          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            const variantFacetImpl =
              (implResult as any)[facetName]?.impl ||
              (implResult as any)[facetName];
            if (variantFacetImpl && variantFacetImpl[fieldName]) {
              let val = variantFacetImpl[fieldName];
              if (val.type === 'store' && val.initial !== undefined) {
                val = createStore(val.initial, { skipVoid: false });
              }
              if (is.store(val)) {
                variantsForField[variantName] = val;
              }
            }
          }

          // From traits
          if (modelConfig.traits) {
            for (const traitImpl of modelConfig.traits) {
              if (
                traitImpl.type === 'implementation' &&
                traitImpl.facet === facetDef
              ) {
                const val = traitImpl.impl[fieldName];
                if (val !== undefined) {
                  let store = val;
                  if (val.type === 'store' && val.initial !== undefined) {
                    store = createStore(val.initial, { skipVoid: false });
                  }
                  if (is.store(store)) {
                    if (!fnResult[facetName]) fnResult[facetName] = {};
                    fnResult[facetName][fieldName] = store;
                  }
                }
              }
            }
          }

          const defaultVal = def.initial;

          // From fn result (base implementation)
          let baseStore = (fnResult[facetName]?.impl || fnResult[facetName])?.[
            fieldName
          ];
          if (
            baseStore &&
            baseStore.type === 'store' &&
            baseStore.initial !== undefined
          ) {
            baseStore = createStore(baseStore.initial, { skipVoid: false });
          }

          const stores = Object.values(variantsForField);
          const names = Object.keys(variantsForField);

          if (stores.length > 0) {
            facetInstance[fieldName] = combine(
              $activeVariant,
              is.store(baseStore)
                ? baseStore
                : createStore(
                    baseStore !== undefined
                      ? baseStore
                      : defaultVal !== undefined
                        ? defaultVal
                        : null,
                    { skipVoid: false },
                  ),
              ...stores,
              (active: any, base: any, ...vals: any[]) => {
                const idx = names.indexOf(active);
                if (idx !== -1) return vals[idx];
                return base;
              },
            );
          } else {
            const finalBase = is.store(baseStore)
              ? baseStore
              : createStore(
                  baseStore !== undefined
                    ? baseStore
                    : defaultVal !== undefined
                      ? defaultVal
                      : null,
                  {
                    skipVoid: false,
                  },
                );
            facetInstance[fieldName] = finalBase;
          }
        } else if (def.type === 'event') {
          const mainEvent = createEvent();

          // From variant impls
          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            const variantFacetImpl =
              (implResult as any)[facetName]?.impl ||
              (implResult as any)[facetName];
            if (variantFacetImpl && variantFacetImpl[fieldName]) {
              let val = variantFacetImpl[fieldName];
              if (val.type === 'event') val = createEvent();

              if (is.event(val)) {
                sample({
                  clock: mainEvent,
                  filter: $activeVariant.map((v) => v === variantName),
                  target: val as any,
                });
              }
            }
          }

          // From traits
          if (modelConfig.traits) {
            for (const traitImpl of modelConfig.traits) {
              if (
                traitImpl.type === 'implementation' &&
                traitImpl.facet === facetDef
              ) {
                const val = traitImpl.impl[fieldName];
                if (val !== undefined) {
                  let event = val;
                  if (val.type === 'event') {
                    event = createEvent();
                  }
                  if (is.event(event)) {
                    if (!fnResult[facetName]) fnResult[facetName] = {};
                    fnResult[facetName][fieldName] = event;
                  }
                }
              }
            }
          }

          // From fn result
          const baseEvent = (fnResult[facetName]?.impl ||
            fnResult[facetName])?.[fieldName];
          if (is.event(baseEvent)) {
            sample({
              clock: mainEvent,
              filter: $activeVariant.map((v) => v === null),
              target: baseEvent as any,
            });
          }

          facetInstance[fieldName] = mainEvent;
        }
      }
      facets[facetName] = facetInstance;
    }
  }
  const destroy = () => {
    // Clear nodes created by instance
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
    // Deep destroy fn results
    const inputs = new Set(Object.values(inputStores));
    for (const val of Object.values(fnResult)) {
      if (val && typeof val === 'object') {
        if (is.unit(val) && !inputs.has(val)) {
          clearNode(val);
        }
        if (typeof (val as any).destroy === 'function') {
          (val as any).destroy();
        }
        // Also check if it has facets to destroy (nested instance)
        if ((val as any).facets) {
          for (const f of Object.values((val as any).facets)) {
            if (f && typeof f === 'object') {
              // Support both direct and implement() wrapped
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
    input: inputStores,
    __impls: variantImpls,
    __fn: fnResult,
    destroy,
  } as any;

  // Merge fnResult into result
  for (const [key, value] of Object.entries(fnResult)) {
    if (!(key in result)) {
      result[key] = value;
    }
  }

  // Ensure we can access nested properties for tests
  // (e.g. instance.c.input.$v)
  for (const [key, value] of Object.entries(fnResult)) {
    if (value && typeof value === 'object' && !is.unit(value)) {
      result[key] = value;
    }
  }

  // Process input for final result to ensure raw values are available
  for (const key in modelInputDef) {
    if (!(key in result)) {
      result[key] = inputStores[key];
    }
  }

  // Support direct access to input stores for tests
  result.input = reactiveInputs;

  return result;
}
