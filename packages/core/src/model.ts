import {
  Store,
  Event,
  Effect,
  createNode,
  withRegion,
  clearNode,
  is,
  EventCallable,
} from 'effector';

import type {
  Model,
  StoreDef,
  EventDef,
  EffectDef,
  Keyval,
  Show,
  ConvertToLensShape,
  StructShape,
} from './types';
import { define, isKeyval } from './define';
import { collectFactoryPaths } from './factoryStatePaths';

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
  create,
}: {
  create: () => {
    state: Output;
    api?: Api;
    key: string;
    optional?: string[];
    onMount?: EventCallable<void>;
  };
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
  const region = createNode({ regional: true });
  const {
    state = {} as Output,
    key,
    api = {} as Api,
    optional = [],
    onMount,
    ...rest
  } = withRegion(region, () => {
    return create();
  });

  if (Object.keys(rest).length > 0) {
    throw Error(
      `create should return only fields 'key', 'state', 'api', 'optional' or 'onMount'`,
    );
  } else if (typeof key !== 'string') {
    throw Error(`key field should be a string`);
  } else if (!(key in state)) {
    throw Error(`key field "${key}" should be in state`);
  } else if (!is.store(state[key]) || !is.targetable(state[key])) {
    throw Error(`key field "${key}" should be writable store`);
  } else if (optional.includes(key)) {
    throw Error(`key field "${key}" cannot be optional`);
  }
  if (onMount !== undefined && (!is.unit(onMount) || !is.targetable(onMount))) {
    throw Error('onMount should be callable event or effect');
  }

  const requiredStateFields = Object.keys(state).filter(
    (field: keyof Output) =>
      is.store(state[field]) &&
      is.targetable(state[field]) &&
      !optional.includes(field as string),
  ) as Array<keyof Input>;

  const factoryStatePaths = collectFactoryPaths(state, region);

  const keyvalFields = Object.keys(state).filter((field: keyof Output) =>
    isKeyval(state[field]),
  ) as Array<keyof Output>;

  const shape = {} as any;
  const structShape: StructShape = {
    type: 'structShape',
    shape: {},
  };
  const defaultState = {} as any;
  for (const key in state) {
    shape[key] = define.store<any>();
    structShape.shape[key] = isKeyval(state[key])
      ? state[key].__struct
      : {
          type: 'structUnit',
          unit: 'store',
          derived: !is.targetable(state[key] as any),
        };
    defaultState[key] = is.store(state[key]) ? state[key].getState() : [];
  }
  for (const key in api) {
    const value = api[key];
    shape[key] = is.event(value)
      ? define.event<any>()
      : define.effect<any, any, any>();
    structShape.shape[key] = {
      type: 'structUnit',
      unit: is.event(value) ? 'event' : 'effect',
    };
  }

  clearNode(region);
  return {
    type: 'model',
    create,
    keyField: key,
    requiredStateFields,
    keyvalFields,
    apiFields: Object.keys(api),
    factoryStatePaths,
    shape,
    __lens: {} as any,
    __struct: structShape,
    defaultState,
  };
}
