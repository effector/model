export interface Model<Input, Facets, Variants> {
  config: {
    input?: Input;
    facets?: Facets;
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
  variant?: Variants;
  impl?: any;
  fn?: any;
}): Model<Input, Facets, Variants> {
  return { config };
}
