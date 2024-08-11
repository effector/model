import { Store, Event, Effect, createStore, createEffect, is } from 'effector';

import type {
  Model,
  StoreDef,
  EventDef,
  EffectDef,
  Keyval,
  Show,
  ConvertToLensShape,
} from './types';
import { define, isDefine } from './define';

export function model<
  Input extends {
    [key: string]:
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | StoreDef<unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | unknown;
  },
  Output extends {
    [key: string]:
      | Store<unknown>
      | Keyval<unknown, unknown, unknown, unknown>
      | unknown;
  },
  Api extends {
    [key: string]: Event<unknown> | Effect<unknown, unknown, unknown>;
  } = {},
>({
  props,
  create,
}: {
  props: Input;
  create: (
    props: {
      [K in keyof Input]: Input[K] extends
        | Store<unknown>
        | Event<unknown>
        | Effect<unknown, unknown, unknown>
        ? Input[K]
        : Input[K] extends StoreDef<infer V>
          ? Store<V>
          : Input[K] extends EventDef<infer V>
            ? Event<V>
            : Input[K] extends EffectDef<infer V, infer D, infer E>
              ? Effect<V, D, E>
              : Input[K] extends (params: infer P) => infer R
                ? Effect<P, Awaited<R>>
                : Store<Input[K]>;
    } & {
      [K in {
        [P in keyof Input]: Input[P] extends Store<unknown> | StoreDef<unknown>
          ? P
          : never;
      }[keyof Input] as K extends string
        ? `$${K}`
        : never]: Input[K] extends Store<unknown>
        ? Input[K]
        : Input[K] extends StoreDef<infer V>
          ? Store<V>
          : never;
    },
    config: { onMount: Event<void> },
  ) =>
    | { state: Output; api: Api }
    | { state?: never; api: Api }
    | { state: Output; api?: never }
    | Output;
}): Model<
  Input,
  Show<{
    [K in keyof Output]: Output[K] extends Keyval<any, infer V, any, any>
      ? Store<V[]>
      : Output[K];
  }>,
  Api,
  Show<ConvertToLensShape<Input & Output & Api>>
  // {
  //   [K in {
  //     [L in keyof Output]: Output[K] extends Keyval<any, any, any, any>
  //       ? L
  //       : never;
  //   }[keyof Output]]: Output[K];
  // }
> {
  const shape = {} as any;
  for (const key in props) {
    const value = props[key];
    if (isDefine.any(value)) {
      shape[key] = value;
    } else if (is.store(value)) {
      shape[key] = define.store<any>();
    } else if (is.event(value)) {
      shape[key] = define.event<any>();
    } else if (is.effect(value) || typeof value === 'function') {
      shape[key] = define.effect<any, any, any>();
    } else {
      shape[key] = define.store<any>();
    }
  }
  return {
    type: 'model',
    create,
    propsConfig: props,
    output: null as unknown as any,
    api: null as unknown as any,
    shape,
    shapeInited: false,
    __lens: {} as any,
  };
}
