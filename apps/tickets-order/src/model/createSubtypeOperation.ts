import { createEvent, sample, StoreWritable } from 'effector';

function subtypeOperation<
  T,
  TypeKey extends keyof T,
  const Cases extends ReadonlyArray<T[TypeKey]>,
  Upd,
>({
  store,
  typeKey,
  on,
  fn,
}: {
  store: StoreWritable<T>;
  typeKey: TypeKey;
  on: Cases;
  fn: (
    upd: Upd,
    value: Extract<T, Record<TypeKey, Cases[keyof Cases]>>,
  ) => Partial<T>;
}) {
  const trigger = createEvent<Upd>();
  sample({
    clock: trigger,
    source: store,
    fn(value, upd) {
      const caseName = value[typeKey];
      if (on.includes(caseName)) {
        const partialResult = fn(upd, value as any);
        return {
          ...value,
          ...partialResult,
        };
      }
      return value;
    },
    target: store,
  });
  return trigger;
}

export function createSubtypeOperation<T, TypeKey extends keyof T>(
  store: StoreWritable<T>,
  typeKey: TypeKey,
) {
  return function op<const Cases extends ReadonlyArray<T[TypeKey]>, Upd>(
    on: Cases,
    fn: (
      upd: Upd,
      value: Extract<T, Record<TypeKey, Cases[keyof Cases]>>,
    ) => Partial<T>,
  ) {
    return subtypeOperation({
      store,
      typeKey,
      on,
      fn,
    });
  };
}
