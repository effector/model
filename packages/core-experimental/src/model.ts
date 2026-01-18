import { Store, StoreWritable, EventCallable } from 'effector';
import { Facet, InferFacetCtx, FacetShape } from './facet';
import { StoreDef, ArrayDef, EventDef } from './define';

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

export type InferImplementation<S extends FacetShape> = {
  [K in keyof S]?: S[K] extends StoreDef<infer T>
    ? StoreWritable<T> | StoreDef<T>
    : S[K] extends ArrayDef<infer T>
      ? StoreWritable<T[]> | ArrayDef<T>
      : S[K] extends EventDef<infer T>
        ? EventCallable<T> | EventDef<T>
        : S[K] extends Facet<infer FS>
          ? InferImplementation<FS>
          : unknown;
};

import { Event } from 'effector';

export interface Model<
  Input,
  Facets,
  Variants,
  FnResult = Record<string, unknown>,
> {
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
    fn?: (input: InferInput<Input>, facets: InferFacets<Facets>) => FnResult;
    init?: (data: unknown) => unknown;
  };
  init: (data: unknown) => unknown;
  _InstanceType: {
    input: InferInput<Input>;
    facets: InferFacets<Facets>;
    activeVariant: Store<string | null>;
    variant: Variants extends { cases: Record<string, unknown> }
      ? {
          [K in keyof Variants['cases']]: {
            enter: Event<void>;
            leave: Event<void>;
          };
        }
      : Record<string, never>;
    destroy: () => void;
  } & FnResult;
}

export function model<
  Input extends Record<string, unknown>,
  Facets extends Record<string, unknown>,
  Variants extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    source: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cases: Record<string, any>;
  },
  FnResult extends Record<string, unknown> = Record<string, unknown>,
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
  ) => FnResult | void;
  init?: (data: unknown) => unknown;
}): Model<Input, Facets, Variants, FnResult> {
  return {
    config,
    init: config.init || (() => ({})),
  } as unknown as Model<Input, Facets, Variants, FnResult>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function implement<S extends Record<string, any>>(
  facet: Facet<S>,
  implementation: InferImplementation<S>,
) {
  return {
    type: 'implementation',
    facet,
    impl: implementation,
  };
}
