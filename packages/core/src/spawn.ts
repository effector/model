import {
  Store,
  Event,
  Effect,
  createStore,
  createEffect,
  is,
  createNode,
  withRegion,
  clearNode,
  createEvent,
  launch,
} from 'effector';

import type {
  Model,
  Instance,
  StoreDef,
  EventDef,
  EffectDef,
  AnyDef,
  StructUnit,
  StructShape,
} from './types';
import { define, isDefine, isKeyval } from './define';

type ParamsNormalize<
  T extends {
    [key: string]:
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | StoreDef<unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | unknown;
  },
> = {
  [K in keyof T]: T[K] extends Store<infer V>
    ? T[K] | V
    : T[K] extends Event<unknown>
      ? T[K]
      : T[K] extends Effect<infer V, infer Res, unknown>
        ? T[K] | ((params: V) => Res | Promise<Res>)
        : T[K] extends StoreDef<infer V>
          ? Store<V> | V
          : T[K] extends EventDef<infer V>
            ? Event<V>
            : T[K] extends EffectDef<infer V, infer Res, infer Err>
              ? Effect<V, Res, Err> | ((params: V) => Res | Promise<Res>)
              : T[K] extends (params: infer V) => infer Res
                ?
                    | Effect<V, Awaited<Res>, unknown>
                    | T[K]
                    | ((params: V) => Awaited<Res> | Promise<Awaited<Res>>)
                : Store<T[K]> | T[K];
};

let childInstancesTracking: Instance<any, any>[] | null = null;

export function spawn<
  const T extends {
    readonly [key: string]:
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | StoreDef<unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | ((params: unknown) => unknown)
      | unknown;
  },
  const Output extends {
    [key: string]:
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | Instance<unknown, unknown>;
  },
  const Params extends {
    [K in {
      [P in keyof T]: T[P] extends AnyDef<unknown> ? never : P;
    }[keyof T]]?:
      | (T[K] extends Store<infer V>
          ? T[K] | V
          : T[K] extends Event<unknown>
            ? T[K]
            : T[K] extends Effect<infer V, infer Res, unknown>
              ? T[K] | ((params: V) => Res | Promise<Res>)
              : T[K] extends (params: infer V) => infer Res
                ?
                    | ((params: V) => Awaited<Res> | Promise<Awaited<Res>>)
                    | Effect<V, Awaited<Res>, unknown>
                : Store<T[K]> | T[K])
      | undefined;
  },
  Api,
>(
  model: Model<T, Output, Api, any>,
  params: Params & {
    [K in {
      [P in keyof T]: T[P] extends AnyDef<unknown> ? P : never;
    }[keyof T]]: T[K] extends StoreDef<infer V>
      ? Store<V> | V
      : T[K] extends EventDef<infer V>
        ? Event<V>
        : T[K] extends EffectDef<infer V, infer Res, infer Err>
          ? Effect<V, Res, Err> | ((params: V) => Res | Promise<Res>)
          : never;
  },
): Instance<Output, Api> {
  const region = createNode();
  const normProps = {} as {
    [K in keyof T]: T[K] extends
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      ? T[K]
      : T[K] extends StoreDef<infer V>
        ? Store<V>
        : T[K] extends EventDef<infer V>
          ? Event<V>
          : T[K] extends EffectDef<infer V, infer D, infer E>
            ? Effect<V, D, E>
            : T[K] extends (params: infer P) => infer R
              ? Effect<P, Awaited<R>>
              : Store<T[K]>;
  };
  let onMount: Event<void>;
  withRegion(region, () => {
    onMount = createEvent();
    for (const key in model.propsConfig) {
      const propModel = model.propsConfig[key];
      //@ts-expect-error
      const propParams = params[key];
      const propParamsExist = key in params;
      if (is.store(propModel)) {
        if (propParamsExist) {
          //@ts-expect-error
          normProps[key] = getStoreParams(propParams);
        } else {
          //@ts-expect-error
          normProps[key] = propModel;
        }
      } else if (is.event(propModel)) {
        if (propParamsExist) {
          /** Maybe we should allow to pass any unit to event field */
          if (
            is.event(propParams) ||
            is.effect(propParams) ||
            is.store(propParams)
          ) {
            normProps[key] = propParams;
          } else {
            throw Error(`spawn field "${key}" expect event`);
          }
        } else {
          //@ts-expect-error
          normProps[key] = propModel;
        }
      } else if (is.effect(propModel)) {
        if (propParamsExist) {
          //@ts-expect-error
          normProps[key] = getEffectParams(key, propParams);
        } else {
          //@ts-expect-error
          normProps[key] = propModel;
        }
      } else if (isDefine.store(propModel)) {
        if (propParamsExist) {
          //@ts-expect-error
          normProps[key] = getStoreParams(propParams);
        } else {
          throw Error(`spawn field "${key}" expect store or value`);
        }
      } else if (isDefine.event(propModel)) {
        if (propParamsExist && is.event(propParams)) {
          normProps[key] = propParams;
        } else {
          throw Error(`spawn field "${key}" expect event`);
        }
      } else if (isDefine.effect(propModel)) {
        if (propParamsExist) {
          //@ts-expect-error
          normProps[key] = getEffectParams(key, propParams);
        } else {
          throw Error(`spawn field "${key}" expect effect or function`);
        }
      } else if (typeof propModel === 'function') {
        if (propParamsExist) {
          //@ts-expect-error
          normProps[key] = getEffectParams(key, propParams);
        } else {
          //@ts-expect-error
          normProps[key] = createEffect(propModel);
        }
      } else {
        if (propParamsExist) {
          //@ts-expect-error
          normProps[key] = getStoreParams(propParams);
        } else {
          //@ts-expect-error
          normProps[key] = createStore(propModel);
        }
      }
    }
  });
  const parentTracking = childInstancesTracking;
  childInstancesTracking = [];
  const outputs = model.create({ onMount: onMount! });
  const childInstances = childInstancesTracking;
  childInstancesTracking = parentTracking;
  let storeOutputs = {} as any;
  let apiOutputs = {} as any;
  /** its ok to not return anything */
  if (outputs !== undefined) {
    if (typeof outputs !== 'object' || outputs === null) {
      throw Error(`model body should return object or undefined`);
    }
    if (
      (outputs.state && !is.unit(outputs.state)) ||
      (outputs.api && !is.unit(outputs.api))
    ) {
      storeOutputs = outputs.state ?? {};
      apiOutputs = outputs.api ?? {};
    } else {
      storeOutputs = outputs;
    }
    for (const key in storeOutputs) {
      const value = storeOutputs[key];
      if (!is.store(value) && !isKeyval(value)) {
        throw Error(`model body in state key "${key}" should return store`);
      }
    }
    for (const key in apiOutputs) {
      const value = apiOutputs[key];
      if (!is.event(value) && !is.effect(value)) {
        throw Error(
          `model body in api key "${key}" should return event or effect`,
        );
      }
    }
  }
  if (!model.shapeInited) {
    model.shapeInited = true;
    const structShape: StructShape = {
      type: 'structShape',
      shape: {},
    };
    for (const key in normProps) {
      const unit = normProps[key];
      structShape.shape[key] = {
        type: 'structUnit',
        unit: is.store(unit) ? 'store' : is.event(unit) ? 'event' : 'effect',
      };
    }
    for (const key in storeOutputs) {
      // @ts-expect-error
      model.shape[key] = define.store<any>();
      structShape.shape[key] = isKeyval(storeOutputs[key])
        ? storeOutputs[key].__struct
        : {
            type: 'structUnit',
            unit: 'store',
          };
    }
    for (const key in apiOutputs) {
      const value = apiOutputs[key];
      // @ts-expect-error
      model.shape[key] = is.event(value)
        ? define.event<any>()
        : define.effect<any, any, any>();
      structShape.shape[key] = {
        type: 'structUnit',
        unit: is.event(value) ? 'event' : 'effect',
      };
    }
    model.__struct = structShape;
  }
  const result: Instance<Output, Api> = {
    type: 'instance',
    props: storeOutputs,
    api: apiOutputs,
    unmount() {
      for (const child of childInstances) {
        child.unmount();
      }
      clearNode(region);
    },
    region,
    inputs: normProps,
  };
  if (childInstancesTracking) {
    childInstancesTracking.push(result);
  }
  launch({
    target: onMount!,
    params: undefined,
    defer: true,
  });
  return result;
}

function getStoreParams(propParams: any) {
  return is.store(propParams) ? propParams : createStore(propParams);
}

function getEffectParams(key: string, propParams: any) {
  if (is.effect(propParams)) {
    return propParams;
  } else if (!is.unit(propParams) && typeof propParams === 'function') {
    return createEffect(propParams);
  } else {
    throw Error(`spawn field "${key}" expect effect or function`);
  }
}
