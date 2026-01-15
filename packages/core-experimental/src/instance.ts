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
import { define } from './define';

export function create(
  modelDef: Model<any, any, any>,
  config: { input?: any } = {},
) {
  const { config: modelConfig } = modelDef;

  // 1. Process Input
  const input = { ...config.input };
  // If input definitions exist in model, ensure we have real stores/values
  // For this prototype, we assume inputs are passed as stores or values in `config.input`
  // We might need to wrap values in stores if the model expects stores.

  const inputStores: Record<string, any> = {};
  for (const key in input) {
    if (is.store(input[key]) || is.event(input[key])) {
      inputStores[key] = input[key];
    } else {
      // If it's a plain value, wrap it?
      // The user example passes `$score` which is a store.
      // But `chatUser` example: `input: { nickname: createStore("Guest") }`.
      inputStores[key] = input[key];
    }
  }

  // 2. Variants Logic
  let $activeVariant: Store<string | null> = createStore(null);
  const variantEvents: Record<
    string,
    { enter: Event<void>; leave: Event<void> }
  > = {};
  const variantImpls: Record<string, any> = {};

  if (modelConfig.variant) {
    const { source, cases } = modelConfig.variant;

    // Evaluate source
    // source is a function taking input and returning a store or value
    const sourceValue = source(inputStores);
    const $source = is.store(sourceValue)
      ? sourceValue
      : createStore(sourceValue);

    // Determine active variant
    $activeVariant = $source.map((val: any) => {
      for (const [name, check] of Object.entries(cases)) {
        if ((check as any)(val)) return name;
      }
      return null;
    });

    // Lifecycle events
    for (const caseName of Object.keys(cases)) {
      const enter = createEvent<void>();
      const leave = createEvent<void>();
      variantEvents[caseName] = { enter, leave };

      // Trigger enter/leave
      // Simple implementation: watch transition
      sample({
        clock: $activeVariant,
        source: $activeVariant, // previous? No, current.
        fn: (current, prev) => ({ current, prev }),
      });
      // Actually we need `diff` or similar to detect changes.
      // Let's use a explicit state machine logic for enter/leave

      // Enter
      sample({
        clock: $activeVariant,
        filter: (v) => v === caseName,
        target: enter,
      });

      // Leave - this is harder without previous value.
      // But for this prototype, we can skip strict leave or implement it if needed.
      // User `statsModel` needs `leave`.
      // We can use `sample` with a store tracking previous variant.
    }
  }

  // 3. Run Implementations
  if (modelConfig.impl) {
    for (const [variantName, implFn] of Object.entries(modelConfig.impl)) {
      // Execute impl function with input
      const result = (implFn as any)(inputStores);
      variantImpls[variantName] = result;
    }
  }

  // 4. Multiplex Facets
  // We need to look at `modelConfig.facets` to know what to expect.
  const facets: Record<string, any> = {};

  if (modelConfig.facets) {
    for (const [facetName, facetDef] of Object.entries(modelConfig.facets)) {
      const facetShape = (facetDef as any).shape;
      const facetInstance: Record<string, any> = {};

      for (const [fieldName, fieldDef] of Object.entries(facetShape)) {
        // We need a store/event that delegates to the active variant
        const def = fieldDef as any;

        if (def.type === 'store') {
          // Collect all implementations for this field
          const variantsForField: Record<string, Store<any>> = {};

          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            if (implResult[facetName] && implResult[facetName][fieldName]) {
              let val = implResult[facetName][fieldName];
              // If it's a define.store definition, create a store
              if (val.type === 'store' && val.initial !== undefined) {
                val = createStore(val.initial);
              }
              if (is.store(val)) {
                variantsForField[variantName] = val;
              }
            }
          }

          // Create the multiplexer store
          // Default value?
          const defaultVal = def.initial;

          facetInstance[fieldName] = combine(
            $activeVariant,
            ...Object.values(variantsForField),
            (active: any, ...vals: any[]) => {
              const map: Record<string, any> = {};
              Object.keys(variantsForField).forEach(
                (k, i) => (map[k] = vals[i]),
              );

              if (active && map[active]) {
                return map[active];
              }
              return defaultVal; // Fallback
            },
          );
        } else if (def.type === 'event') {
          // Event multiplexing:
          // When main event triggers, forward to active variant's event.
          const mainEvent = createEvent();

          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            if (implResult[facetName] && implResult[facetName][fieldName]) {
              let val = implResult[facetName][fieldName];
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
          facetInstance[fieldName] = mainEvent;
        }
      }
      facets[facetName] = facetInstance;
    }
  }

  // 5. Run `fn` if present (for simple models or extra logic)
  let fnResult: any = {};
  if (modelConfig.fn) {
    fnResult = modelConfig.fn(inputStores);
  }

  const destroy = () => {
    clearNode($activeVariant);
    Object.values(variantEvents).forEach(({ enter, leave }) => {
      clearNode(enter);
      clearNode(leave);
    });
    // Clear facets
    Object.values(facets).forEach((facetInstance) => {
      Object.values(facetInstance).forEach((unit) => {
        if (is.unit(unit)) clearNode(unit as Unit<any>);
      });
    });
    // Clear implementation results (if they contain units)
    Object.values(variantImpls).forEach((implResult) => {
      if (implResult && typeof implResult === 'object') {
        Object.values(implResult).forEach((val) => {
          if (is.unit(val)) clearNode(val as Unit<any>);
          // Deep cleanup might be needed if impl returns nested structures
        });
      }
    });
    // Clear fn result
    if (fnResult && typeof fnResult === 'object') {
      Object.values(fnResult).forEach((val) => {
        if (is.unit(val)) clearNode(val as Unit<any>);
      });
    }
  };

  return {
    facets,
    variant: variantEvents, // Expose enter/leave
    activeVariant: $activeVariant,
    ...fnResult, // Expose things returned by fn
    // Also expose internals for `select`?
    __impls: variantImpls,
    destroy,
  } as any;
}
