import { StoreWritable, EventCallable } from 'effector';
import { StoreDef, EventDef, RefDef, ArrayDef } from './define';

export interface FacetShape {
  [key: string]:
    | StoreDef<unknown>
    | EventDef<unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | Facet<any>
    | RefDef
    | ArrayDef<unknown>;
}

export type InferFacetCtx<S extends FacetShape> = {
  [K in keyof S]: S[K] extends StoreDef<infer T>
    ? StoreWritable<T>
    : S[K] extends ArrayDef<infer T>
      ? StoreWritable<T[]>
      : S[K] extends EventDef<infer T>
        ? EventCallable<T>
        : S[K] extends Facet<infer FS>
          ? InferFacetCtx<FS>
          : S[K] extends RefDef
            ? StoreWritable<unknown>
            : unknown;
};

export type Facet<S extends FacetShape> = {
  type: 'facet';
  shape: S;
  _linker?: (ctx: InferFacetCtx<S>) => void;
  use: (linker: (ctx: InferFacetCtx<S>) => void) => Facet<S>;
};

export function facet<S extends FacetShape>(shape: S): Facet<S> {
  const f: Facet<S> = {
    type: 'facet',
    shape,
    use: (linker) => {
      f._linker = linker;
      return f;
    },
  };
  return f;
}
