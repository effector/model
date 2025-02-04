import {
  Store,
  Event,
  Effect,
  createStore,
  createEffect,
  is,
  createNode,
  withRegion,
  createEvent,
  launch,
  Node,
  combine,
  EventCallable,
} from 'effector';

import type {
  Model,
  Instance,
  StoreDef,
  EventDef,
  EffectDef,
  AnyDef,
  FactoryPathMap,
  Keyval,
} from './types';
import { isKeyval } from './define';

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
  const region = createNode({ regional: true });
  installStateHooks(params as any, region, model.factoryStatePaths);
  const parentTracking = childInstancesTracking;
  childInstancesTracking = [];
  const outputs = withRegion(region, () => model.create());
  childInstancesTracking = parentTracking;
  const storeOutputs = outputs.state ?? {};
  const apiOutputs = outputs.api ?? {};
  const onMount: EventCallable<void> | void = outputs.onMount;
  function forEachKeyvalField(
    cb: (kv: Keyval<any, any, any, any>, field: keyof Output) => void,
  ) {
    for (const field of model.keyvalFields) {
      if (isKeyval(storeOutputs[field])) {
        cb(storeOutputs[field], field);
      }
    }
  }
  const $output = withRegion(region, () => {
    const resultShape = {
      ...storeOutputs,
    } as Output;
    forEachKeyvalField(({ $items }, field) => {
      // @ts-expect-error generic mismatch
      resultShape[field] = $items;
    });
    return combine(resultShape) as unknown as Store<Output>;
  });
  const keyvalShape = {} as Instance<any, any>['keyvalShape'];

  withRegion(region, () => {
    forEachKeyvalField((kv, field) => {
      keyvalShape[field] = kv;
    });
  });
  const result: Instance<Output, Api> = {
    type: 'instance',
    output: $output,
    keyvalShape,
    props: storeOutputs,
    api: apiOutputs,
    region,
    onMount,
  };
  if (childInstancesTracking) {
    childInstancesTracking.push(result);
  }
  return result;
}

function installStateHooks(
  initState: Record<string, any>,
  node: Node,
  currentFactoryPathToStateKey: FactoryPathMap,
) {
  wrapPush(node.family.links, (item, idx) => {
    if (!currentFactoryPathToStateKey.has(idx)) return;
    const currentPath = currentFactoryPathToStateKey.get(idx)!;
    if (typeof currentPath === 'string') {
      if (item.scope.state && currentPath in initState) {
        item.scope.state.initial = initState[currentPath];
        item.scope.state.current = initState[currentPath];
      }
    } else {
      installStateHooks(initState, item, currentPath);
    }
  });
}

function wrapPush<T>(arr: T[], cb: (item: T, realIdx: number) => void) {
  const push = arr.push.bind(arr);
  arr.push = (...args: T[]) => {
    const idx = arr.length;
    for (let i = 0; i < args.length; i++) {
      const child = args[i];
      const realIdx = idx + i;
      cb(child, realIdx);
    }
    return push(...args);
  };
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
