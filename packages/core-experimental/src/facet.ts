import { StoreWritable, EventCallable } from 'effector';
import { StoreDef, EventDef, RefDef, ArrayDef } from './define';

export type FacetShape = {
  [key: string]:
    | StoreDef<any>
    | EventDef<any>
    | Facet<any>
    | RefDef
    | ArrayDef<any>;
};

export type InferFacetCtx<S extends FacetShape> = {
  [K in keyof S]: S[K] extends StoreDef<infer T>
    ? StoreWritable<T>
    : S[K] extends ArrayDef<infer T>
      ? StoreWritable<T[]>
      : S[K] extends EventDef<infer T>
        ? EventCallable<T>
        : S[K] extends Facet<infer FS>
          ? InferFacetCtx<FS>
          : any;
};

export type Facet<S extends FacetShape> = {
  type: 'facet';
  shape: S;
  _linker?: (ctx: InferFacetCtx<S>) => void;
  use: (linker: (ctx: InferFacetCtx<S>) => void) => Facet<S>;
};

export function facet<S extends FacetShape>(shape: S): Facet<S> {
  const f: any = {
    type: 'facet',
    shape,
  };
  f.use = (linker: any) => {
    f._linker = linker;
    return f;
  };
  return f;
}
