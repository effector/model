import { Facet } from './facet';

export interface Model<Input, Facets, Variants> {
  config: {
    input?: Input;
    facets?: Facets;
    traits?: any[];
    variant?: Variants;
    impl?: any;
    fn?: any;
  };
}

export function model<
  Input extends Record<string, any>,
  Facets extends Record<string, any>,
  Variants extends { source: any; cases: Record<string, any> },
>(config: {
  input?: Input;
  facets?: Facets;
  traits?: any[];
  variant?: Variants;
  impl?: any;
  fn?: any;
}): Model<Input, Facets, Variants> {
  return { config };
}

export function implement<S extends Record<string, any>>(
  facet: Facet<S>,
  implementation: { [K in keyof S]?: any },
) {
  return {
    type: 'implementation',
    facet,
    impl: implementation,
  };
}
