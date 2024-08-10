import type {
  StoreDef,
  EventDef,
  EffectDef,
  AnyDef,
  EntityShapeDef,
  EntityItemDef,
  EntityList,
  Instance,
} from './types';

export const define = {
  store<T>(): StoreDef<T> {
    return {
      type: 'storeDefinition',
      __: null as T,
    };
  },
  event<T>(): EventDef<T> {
    return {
      type: 'eventDefinition',
      __: null as T,
    };
  },
  effect<T, Res, Err = Error>(): EffectDef<T, Res, Err> {
    return {
      type: 'effectDefinition',
      __: null as T,
      res: null as Res,
      err: null as Err,
    };
  },
  entityShape<Shape>(shape: Shape): EntityShapeDef<Shape> {
    return {
      type: 'entityShapeDefinition',
      shape,
    };
  },
  entityItem<T>(): EntityItemDef<T> {
    return {
      type: 'entityItemDefinition',
      __: null as T,
    }
  }
};

export const isDefine = {
  any(val: any): val is AnyDef<any> {
    return (
      typeof val === 'object' &&
      val !== null &&
      (val.type === 'storeDefinition' ||
        val.type === 'eventDefinition' ||
        val.type === 'effectDefinition')
    );
  },
  store(val: any): val is StoreDef<any> {
    return (
      typeof val === 'object' && val !== null && val.type === 'storeDefinition'
    );
  },
  event(val: any): val is EventDef<any> {
    return (
      typeof val === 'object' && val !== null && val.type === 'eventDefinition'
    );
  },
  effect(val: any): val is EffectDef<any, any, any> {
    return (
      typeof val === 'object' && val !== null && val.type === 'effectDefinition'
    );
  },
};


export function isEntityList(
  value: any
): value is EntityList<any, any, any, any> {
  return (
    typeof value === 'object' && value !== null && value.type === 'entityList'
  );
}

export function isInstance(val: any): val is Instance<any, any> {
  return typeof val === 'object' && val !== null && val.type === 'instance';
}
