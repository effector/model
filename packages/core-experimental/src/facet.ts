import { StoreDef, EventDef } from './define';

export type FacetShape = Record<string, StoreDef<any> | EventDef<any>>;

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
