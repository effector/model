import { Store, StoreWritable } from 'effector';
import { Facet, InferFacetCtx } from './facet';
import { StoreDef, ArrayDef } from './define';

export type InferInput<I> = {
  [K in keyof I]: I[K] extends StoreDef<infer T>
    ? StoreWritable<T>
    : I[K] extends ArrayDef<infer T>
      ? StoreWritable<T[]>
      : StoreWritable<any>;
};

export type InferFacets<F> = {
  [K in keyof F]: F[K] extends Facet<infer S> ? InferFacetCtx<S> : never;
};

export interface Model<Input, Facets, Variants> {
  config: {
    input?: Input;
    extra?: Input;
    facets?: Facets;
    traits?: any[];
    variant?: Variants;
    impl?: any;
    fn?: any;
    init?: (data: any) => any;
  };
  init: (data: any) => any;
  _InstanceType: {
    input: InferInput<Input>;
    facets: InferFacets<Facets>;
    activeVariant: Store<string | null>;
  };
}

export function model<
  Input extends Record<string, any>,
  Facets extends Record<string, any>,
  Variants extends { source: any; cases: Record<string, any> },
>(config: {
  input?: Input;
  extra?: Input;
  facets?: Facets;
  traits?: any[];
  variant?: Variants;
  impl?:
    | Record<
        string,
        (input: InferInput<Input>, facets: InferFacets<Facets>) => any
      >
    | ((input: InferInput<Input>, facets: InferFacets<Facets>) => any);
  fn?: (input: InferInput<Input>, facets: InferFacets<Facets>) => any;
  init?: (data: any) => any;
}): Model<Input, Facets, Variants> {
  return {
    config,
    init: config.init || ((() => ({})) as any),
  } as any;
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
