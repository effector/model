import {
  Store,
  Event,
  Effect,
  withRegion,
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
} from './types';
import { isKeyval } from './define';
import { createRegionalNode, installStateHooks } from './factoryStatePaths';
import { callInLazyStack } from './lazy';

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
  const region = createRegionalNode(false);
  installStateHooks(params as any, region, model.factoryStatePaths);
  const parentTracking = childInstancesTracking;
  childInstancesTracking = [];

  const [$output, keyvalShape, onMount, storeOutputs, apiOutputs] = withRegion(
    region,
    () => {
      const {
        state: storeOutputs = {},
        api: apiOutputs = {},
        onMount,
      } = callInLazyStack(() => model.create(), false);
      const resultShape = {
        ...storeOutputs,
      } as Output;
      const keyvalShape = {} as Instance<any, any>['keyvalShape'];
      for (const field of model.keyvalFields) {
        if (isKeyval(storeOutputs[field])) {
          const kv = storeOutputs[field];
          if (field in params) {
            // TODO implement without additional retrigger
            kv.edit.add((params as any)[field]);
          }
          // @ts-expect-error generic mismatch
          resultShape[field] = kv.$items;
          keyvalShape[field] = kv;
        }
      }
      const $output = combine(resultShape) as unknown as Store<Output>;
      return [
        $output,
        keyvalShape,
        onMount as EventCallable<void> | void,
        storeOutputs,
        apiOutputs,
      ] as const;
    },
  );

  const result: Instance<Output, Api> = {
    type: 'instance',
    output: $output,
    keyvalShape,
    props: storeOutputs,
    api: apiOutputs,
    region,
    onMount,
  };

  if (parentTracking) {
    parentTracking.push(result);
  }
  childInstancesTracking = parentTracking;
  return result;
}
