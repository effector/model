import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import type { Store, Event, Effect } from 'effector';
import { useList, useStoreMap, useUnit } from 'effector-react';

import {
  Model,
  Instance,
  EntityList,
  StoreDef,
  EventDef,
  EffectDef,
  AnyDef,
  Show,
} from './types';
import { spawn } from './spawn';

type ModelStack =
  | {
      type: 'entity';
      model: EntityList<unknown, any, unknown, unknown>;
      value: string | number;
      parent: ModelStack | null;
    }
  | {
      type: 'instance';
      model: Model<any, any, any, any>;
      value: Instance<any, any>;
      parent: ModelStack | null;
    };

const ModelStackContext = createContext(null as ModelStack | null);

export function EntityProvider<T>({
  model,
  value,
  children,
}: {
  model: EntityList<unknown, T, unknown, unknown>;
  value: string | number;
  children: ReactNode;
}) {
  const currentStack = useContext(ModelStackContext);
  const nextStack = {
    type: 'entity' as const,
    model,
    value,
    parent: currentStack,
  };
  return (
    <ModelStackContext.Provider value={nextStack}>
      {children}
    </ModelStackContext.Provider>
  );
}

export function ModelProvider<
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
  }
>({
  model,
  value,
  children,
}: {
  model: Model<T, any, any, any>;
  value: Params & {
    [K in {
      [P in keyof T]: T[P] extends AnyDef<unknown> ? P : never;
    }[keyof T]]: T[K] extends StoreDef<infer V>
      ? Store<V> | V
      : T[K] extends EventDef<infer V>
      ? Event<V>
      : T[K] extends EffectDef<infer V, infer Res, infer Err>
      ? Effect<V, Res, Err> | ((params: V) => Res | Promise<Res>)
      : never;
  };
  children: ReactNode;
}) {
  const deps: any[] = [model];
  if (typeof value === 'object' && value !== null) {
    deps.push(...Object.keys(value), ...Object.values(value));
  } else {
    deps.push(value);
  }
  const instance = useMemo(() => spawn(model, value), deps);
  useEffect(() => () => instance.unmount(), deps);
  const currentStack = useContext(ModelStackContext);
  const nextStack = {
    type: 'instance' as const,
    model,
    value: instance,
    parent: currentStack,
  };
  return (
    <ModelStackContext.Provider value={nextStack}>
      {children}
    </ModelStackContext.Provider>
  );
}

export function useModel<Input, T, Api, Shape>(
  model: Model<Input, T, Api, Shape>
): [
  state: Show<
    {
      [K in keyof Input]: Input[K] extends Store<infer V>
        ? V
        : Input[K] extends StoreDef<infer V>
        ? V
        : Input[K] extends Event<infer V>
        ? (params: V) => V
        : Input[K] extends EventDef<infer V>
        ? (params: V) => V
        : Input[K] extends Effect<infer V, infer D, unknown>
        ? (params: V) => Promise<D>
        : Input[K] extends EffectDef<infer V, infer D, unknown>
        ? (params: V) => Promise<D>
        : Input[K] extends (params: infer V) => infer D
        ? (params: V) => Promise<Awaited<D>>
        : Input[K];
    } & {
      [K in keyof T]: T[K] extends Store<infer V> ? V : never;
    }
  >,
  api: {
    [K in keyof Api]: Api[K] extends Event<infer V>
      ? (params: V) => V
      : Api[K] extends Effect<infer V, infer D, unknown>
      ? (params: V) => Promise<D>
      : never;
  }
] {
  const stack = useContext(ModelStackContext);
  let currentStack = stack;
  let instance: Instance<T, Api> | undefined;
  while (instance === undefined && currentStack) {
    if (currentStack.model === model) {
      instance = currentStack.value as Instance<T, Api>;
    }
    currentStack = currentStack.parent;
  }
  if (instance === undefined)
    throw Error('model not found, add ModelProvider first');
  const state = useUnit(instance.props as any);
  const api = useUnit(instance.api as any);
  return [state as any, api as any];
}

export function useEntityItem<T>(
  entityList: EntityList<unknown, T, unknown, unknown>
) {
  const stack = useContext(ModelStackContext);
  let currentStack = stack;
  let value: string | number | undefined;
  while (value === undefined && currentStack) {
    if (currentStack.model === entityList) {
      value = currentStack.value as string | number;
    }
    currentStack = currentStack.parent;
  }
  if (value === undefined)
    throw Error('model not found, add EntityProvider first');
  const idx = useStoreMap({
    store: entityList.$keys,
    keys: [value],
    fn: (keys, [value]) => keys.indexOf(value),
  });
  if (idx === -1) throw Error(`instance with key "${value}" not found`);
  return useStoreMap({
    store: entityList.$items,
    keys: [idx, value],
    fn: (values, [idx]) => values[idx],
  });
}

export function useEntityList<T>(
  entityList: EntityList<unknown, T, unknown, unknown>,
  View: () => JSX.Element
) {
  return useList(entityList.$keys, (key) => (
    <EntityProvider model={entityList} value={key}>
      <View />
    </EntityProvider>
  ));
}
