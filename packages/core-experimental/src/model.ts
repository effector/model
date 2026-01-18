import { Store, StoreWritable } from 'effector';
import { Facet, InferFacetCtx } from './facet';
import { StoreDef, ArrayDef } from './define';

export type InferInput<I> = {
  [K in keyof I]: I[K] extends StoreDef<infer T>
    ? StoreWritable<T>
    : I[K] extends ArrayDef<infer T>
      ? StoreWritable<T[]>
      : StoreWritable<unknown>;
};

export type InferConfigInput<I> = {
  [K in keyof I]?: I[K] extends StoreDef<infer T>
    ? T | Store<T>
    : I[K] extends ArrayDef<infer T>
      ? T[] | Store<T[]>
      : unknown;
};

export type InferFacets<F> = {
  [K in keyof F]: F[K] extends Facet<infer S> ? InferFacetCtx<S> : never;
};

export interface Model<Input, Facets, Variants> {
  config: {
    input?: Input;
    extra?: Input;
    facets?: Facets;
    traits?: unknown[];
    variant?: Variants;
    impl?:
      | Record<
          string,
          (
            input: InferInput<Input>,
            facets: InferFacets<Facets>,
          ) => Record<string, unknown>
        >
      | ((
          input: InferInput<Input>,
          facets: InferFacets<Facets>,
        ) => Record<string, unknown>);
    fn?: (
      input: InferInput<Input>,
      facets: InferFacets<Facets>,
    ) => Record<string, unknown>;
    init?: (data: unknown) => unknown;
  };
  init: (data: unknown) => unknown;
  _InstanceType: {
    input: InferInput<Input>;
    facets: InferFacets<Facets>;
    activeVariant: Store<string | null>;
    [key: string]: unknown;
  };
}

export function model<
  Input extends Record<string, unknown>,
  Facets extends Record<string, unknown>,
  Variants extends {
    source: any;
    cases: Record<string, any>;
  },
>(config: {
  input?: Input;
  extra?: Input;
  facets?: Facets;
  traits?: unknown[];
  variant?: Variants;
  impl?:
    | Record<
        string,
        (
          input: InferInput<Input>,
          facets: InferFacets<Facets>,
        ) => void | Record<string, unknown>
      >
    | ((
        input: InferInput<Input>,
        facets: InferFacets<Facets>,
      ) => void | Record<string, unknown>);
  fn?: (
    input: InferInput<Input>,
    facets: InferFacets<Facets>,
  ) => void | Record<string, unknown>;
  init?: (data: unknown) => unknown;
}): Model<Input, Facets, Variants> {
  return {
    config,
    init: config.init || (() => ({})),
  } as unknown as Model<Input, Facets, Variants>;
}

export function implement<S extends Record<string, any>>(
  facet: Facet<S>,
  implementation: Partial<InferFacetCtx<S>>,
) {
  return {
    type: 'implementation',
    facet,
    impl: implementation,
  };
}
