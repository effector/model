import {
  createStore,
  createEvent,
  combine,
  sample,
  Store,
  Event,
  is,
  clearNode,
  StoreWritable,
  EventCallable,
} from 'effector';
import { Model, InferConfigInput, InferInput, InferFacets } from './model';
import { isRef, StoreDef, EventDef, ArrayDef } from './define';
import { FacetShape, Facet } from './facet';

type WritableStore<T> = StoreWritable<T> & { rehydrate: EventCallable<T> };

function createWritableStore<T>(
  initial: T,
  config?: { skipVoid?: boolean },
): WritableStore<T> {
  const $store = createStore(initial, config);
  const rehydrate = createEvent<T>();
  $store.on(rehydrate, (_, payload) => payload);
  ($store as unknown as { rehydrate: EventCallable<T> }).rehydrate = rehydrate;
  return $store as WritableStore<T>;
}

export function create<
  Input extends Record<string, unknown>,
  Facets extends Record<string, unknown>,
  Variants extends {
    source: unknown;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cases: Record<string, (val: any) => boolean>;
  },
  FnResult = Record<string, unknown>,
>(
  modelDef: Model<Input, Facets, Variants, FnResult>,
  config: {
    input?: InferConfigInput<Input>;
    state?: Record<string, unknown>;
  } = {},
): Model<Input, Facets, Variants, FnResult>['_InstanceType'] {
  const { config: modelConfig } = modelDef;

  // 1. Process Input -> Extra
  const input = { ...config.input } as Record<string, unknown>;
  const extraStores: Record<string, unknown> = {};

  // Support 'extra' or 'input' definition for metadata
  const modelExtraDef = (modelConfig.extra ||
    modelConfig.input ||
    {}) as Record<
    string,
    StoreDef<unknown> | EventDef<unknown> | ArrayDef<unknown>
  >;

  for (const key in modelExtraDef) {
    const val = input[key];
    const def = modelExtraDef[key];

    if (val !== undefined) {
      extraStores[key] = val;
    } else if (def.type === 'store' && def.initial !== undefined) {
      extraStores[key] = createWritableStore(def.initial, { skipVoid: false });
    }
  }

  const reactiveExtra: Record<string, unknown> = {};
  for (const key in extraStores) {
    const val = extraStores[key];
    if (is.unit(val)) {
      reactiveExtra[key] = val;
    } else if (
      typeof val === 'object' &&
      val !== null &&
      ('facets' in val || 'activeVariant' in val)
    ) {
      reactiveExtra[key] = val;
    } else {
      reactiveExtra[key] = createWritableStore(val, { skipVoid: false });
    }
  }
  // 2. Pre-allocate Facets (Thermodynamic Runtime)
  const preAllocatedFacets: Record<string, Record<string, unknown>> = {};
  const initialState = config.state || {};

  if (modelConfig.facets) {
    for (const [facetName, facetDef] of Object.entries(modelConfig.facets)) {
      const facetShape = (facetDef as Facet<FacetShape>).shape;
      const facetInstance: Record<string, unknown> = {};
      const facetState =
        (initialState[facetName] as Record<string, unknown>) || {};

      for (const [fieldName, fieldDef] of Object.entries(facetShape)) {
        const def = fieldDef as
          | StoreDef<unknown>
          | EventDef<unknown>
          | ArrayDef<unknown>
          | Facet<FacetShape>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((def as any).type === 'store') {
          const initialValue =
            facetState[fieldName] !== undefined
              ? facetState[fieldName]
              : (def as StoreDef<unknown>).initial;

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
  const variantImpls: Record<string, Record<string, unknown>> = {};

  if (modelConfig.variant) {
    const { source, cases } = modelConfig.variant;

    const sourceValue = (source as (input: unknown) => unknown)(reactiveExtra);
    const $source = is.store(sourceValue)
      ? sourceValue
      : createStore(sourceValue, { skipVoid: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $activeVariant = $source.map((val: any) => {
      for (const [name, check] of Object.entries(cases)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((check as (v: any) => boolean)(val)) return name;
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
  let fnResult: Record<string, unknown> = {};
  if (modelConfig.fn) {
    fnResult =
      (modelConfig.fn(
        reactiveExtra as unknown as InferInput<Input>,
        preAllocatedFacets as unknown as InferFacets<Facets>,
      ) as Record<string, unknown>) || {};
  }

  if (modelConfig.impl) {
    if (typeof modelConfig.impl === 'function') {
      const implResult = modelConfig.impl(
        reactiveExtra as unknown as InferInput<Input>,
        preAllocatedFacets as unknown as InferFacets<Facets>,
      ) as Record<string, unknown>;
      fnResult = { ...fnResult, ...implResult };
    } else {
      for (const [variantName, implFn] of Object.entries(modelConfig.impl)) {
        variantImpls[variantName] = implFn(
          reactiveExtra as unknown as InferInput<Input>,
          preAllocatedFacets as unknown as InferFacets<Facets>,
        );
      }
    }
  }

  // 6. Post-Process Facets
  const facets: Record<string, Record<string, unknown>> = {};

  if (modelConfig.facets) {
    for (const [facetName, facetDef] of Object.entries(modelConfig.facets)) {
      const facetShape = (facetDef as Facet<FacetShape>).shape;
      const facetInstance: Record<string, unknown> = {};
      const preAllocated = preAllocatedFacets[facetName];

      for (const [fieldName, fieldDef] of Object.entries(facetShape)) {
        const def = fieldDef as
          | StoreDef<unknown>
          | EventDef<unknown>
          | ArrayDef<unknown>
          | Facet<FacetShape>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          | any;

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
          const variantsForField: Record<string, Store<unknown>> = {};

          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            const implRes = implResult as Record<string, unknown>;
            const facetRes = implRes[facetName] as Record<string, unknown>;
            const variantFacetImpl =
              (facetRes?.impl as Record<string, unknown>) || facetRes;

            if (variantFacetImpl && variantFacetImpl[fieldName]) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              let val = variantFacetImpl[fieldName] as any;
              if (val && val.type === 'store') {
                val = createWritableStore(val.initial, { skipVoid: false });
              }
              if (is.store(val)) variantsForField[variantName] = val;
            }
          }

          const fnResFacet = fnResult[facetName] as Record<string, unknown>;
          const fnResFacetImpl =
            (fnResFacet?.impl as Record<string, unknown>) || fnResFacet;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let baseStore = fnResFacetImpl?.[fieldName] as any;

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
              ([active, base, ...vals]: unknown[]) => {
                const idx = names.indexOf(active as string);
                if (idx !== -1) return vals[idx];
                return base;
              },
              { skipVoid: false },
            );
          } else {
            facetInstance[fieldName] = baseStore;
          }

          if ((baseStore as { rehydrate?: unknown }).rehydrate) {
            const rehydrate = createEvent();
            (
              facetInstance[fieldName] as { rehydrate: Event<unknown> }
            ).rehydrate = rehydrate;
            sample({
              clock: rehydrate,
              target: (baseStore as { rehydrate: EventCallable<unknown> })
                .rehydrate,
            });
          }
        } else if (def.type === 'event') {
          const fnResFacet = fnResult[facetName] as Record<string, unknown>;
          const fnResFacetImpl =
            (fnResFacet?.impl as Record<string, unknown>) || fnResFacet;
          let mainEvent = fnResFacetImpl?.[fieldName] as Event<unknown>;

          if (!mainEvent) {
            mainEvent = preAllocated[fieldName] as Event<unknown>;
          }

          for (const [variantName, implResult] of Object.entries(
            variantImpls,
          )) {
            const implRes = implResult as Record<string, unknown>;
            const facetRes = implRes[facetName] as Record<string, unknown>;
            const variantFacetImpl =
              (facetRes?.impl as Record<string, unknown>) || facetRes;

            if (variantFacetImpl && variantFacetImpl[fieldName]) {
              const val = variantFacetImpl[fieldName];
              if (is.event(val)) {
                sample({
                  clock: mainEvent,
                  filter: $activeVariant.map((v) => v === variantName),
                  target: val as EventCallable<unknown>,
                });
              }
            }
          }
          facetInstance[fieldName] = mainEvent;
        }
      }
      facets[facetName] = facetInstance;

      if (typeof (facetDef as Facet<FacetShape>)._linker === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        (facetDef as Facet<FacetShape>)._linker!(facetInstance);
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
        if (is.unit(u)) clearNode(u);
      }
    }
    const inputs = new Set(Object.values(extraStores));
    const fnRes = fnResult as unknown as { destroy?: () => void };
    if (typeof fnRes.destroy === 'function') {
      fnRes.destroy();
    }
    for (const val of Object.values(fnResult)) {
      if (val && typeof val === 'object') {
        if (is.unit(val) && !inputs.has(val)) {
          clearNode(val);
        }
        const obj = val as {
          destroy?: () => void;
          facets?: Record<string, { impl?: Record<string, unknown> }>;
        };
        if (typeof obj.destroy === 'function') {
          obj.destroy();
        }
        if (obj.facets) {
          for (const f of Object.values(obj.facets)) {
            if (f && typeof f === 'object') {
              const facetImpl = f.impl || f;
              for (const u of Object.values(facetImpl)) {
                if (is.unit(u)) clearNode(u);
              }
            }
          }
        }
      }
    }
  };

  const result: Record<string, unknown> = {
    facets,
    variant: variantEvents,
    activeVariant: $activeVariant,
    input: extraStores,
    extra: extraStores, // Alias
    __impls: variantImpls,
    __fn: fnResult,
    destroy,
  };

  for (const [key, value] of Object.entries(fnResult)) {
    if (!(key in result)) result[key] = value;
  }

  for (const key in modelExtraDef) {
    if (!(key in result)) result[key] = extraStores[key];
  }
  result.input = reactiveExtra;

  return result as unknown as Model<
    Input,
    Facets,
    Variants,
    FnResult
  >['_InstanceType'];
}
