import { StoreDef, EventDef, RefDef, ArrayDef } from './define';

export type FacetShape = {
  [key: string]:
    | StoreDef<any>
    | EventDef<any>
    | Facet<any>
    | RefDef
    | ArrayDef<any>;
};

export type Facet<S extends FacetShape> = {
  type: 'facet';
  shape: S;
};

export function facet<S extends FacetShape>(shape: S): Facet<S> {
  return {
    type: 'facet',
    shape,
  };
}
