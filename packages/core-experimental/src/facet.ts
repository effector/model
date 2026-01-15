import { StoreDef, EventDef } from './define';

export type FacetShape = {
  [key: string]: StoreDef<any> | EventDef<any> | Facet<any>;
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
