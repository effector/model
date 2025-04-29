import {
  createContext,
  useContext,
  useMemo,
  useEffect,
  ReactNode,
} from 'react';
import {
  type Store,
  type Event,
  type Effect,
  type EventCallable,
  clearNode,
} from 'effector';
import { useList, useStoreMap, useUnit } from 'effector-react';

import {
  type Model,
  type Instance,
  type Keyval,
  type StoreDef,
  type EventDef,
  type EffectDef,
  type AnyDef,
  isKeyval,
} from '@effector/model';
import { spawn } from '@effector/model';

type ModelStack =
  | {
      type: 'entity';
      model: Keyval<unknown, any, unknown, unknown>;
      clone: Keyval<unknown, any, unknown, unknown> | null;
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
  model: Keyval<any, T, any, any>;
  value: string | number;
  children: ReactNode;
}) {
  const currentStack = useContext(ModelStackContext);
  const nextStack = {
    type: 'entity' as const,
    model: model.cloneOf || model,
    clone: model.isClone ? model : null,
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
  },
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
  useEffect(() => () => clearNode(instance.region), deps);
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

function useGetKeyvalKey<Input, T, Api>(
  args:
    | [keyval: Keyval<Input, T, Api, any>]
    | [keyval: Keyval<Input, T, Api, any>, key: string | number],
  allowUndefinedKey?: false,
): [keyval: Keyval<Input, T, Api, any>, key: string | number];
function useGetKeyvalKey<Input, T, Api>(
  args:
    | [keyval: Keyval<Input, T, Api, any>]
    | [keyval: Keyval<Input, T, Api, any>, key: string | number],
  allowUndefinedKey: true,
): [keyval: Keyval<Input, T, Api, any>, key: string | number | void];
function useGetKeyvalKey<Input, T, Api>(
  args:
    | [keyval: Keyval<Input, T, Api, any>]
    | [keyval: Keyval<Input, T, Api, any>, key: string | number],
  allowUndefinedKey: boolean = false,
): [keyval: Keyval<Input, T, Api, any>, key: string | number] {
  if (args.length === 1) {
    let [keyval] = args;
    const stack = useContext(ModelStackContext);
    let currentStack = stack;
    let key: string | number | undefined;
    while (key === undefined && currentStack) {
      if (currentStack.model === keyval) {
        key = currentStack.value as string | number;
        if (currentStack.type === 'entity' && currentStack.clone) {
          // @ts-expect-error typecast
          keyval = currentStack.clone;
        }
      }
      currentStack = currentStack.parent;
    }
    if (key === undefined && !allowUndefinedKey)
      throw Error('model not found, add EntityProvider first');
    return [keyval, key!];
  } else {
    return args;
  }
}

export function useEntityItem<T>(keyval: Keyval<any, T, any, any>): T;
export function useEntityItem<T>(
  keyval: Keyval<any, T, any, any>,
  key: string | number,
): T;
export function useEntityItem<T>(
  ...args:
    | [keyval: Keyval<any, T, any, any>]
    | [keyval: Keyval<any, T, any, any>, key: string | number]
) {
  const [keyval, key] = useGetKeyvalKey(args);
  const idx = useStoreMap({
    store: keyval.$keys,
    keys: [key],
    fn: (keys, [value]) => keys.indexOf(value),
  });
  const result = useStoreMap({
    store: keyval.$items,
    keys: [idx, key],
    fn: (values, [idx]) => (idx === -1 ? null : values[idx]),
  });
  if (idx === -1) {
    // NOTE probably need to throw error here
    return keyval.defaultState();
  }
  return result as T;
}

export function useEntityList<T>(
  keyval: Keyval<any, T, any, any>,
  View: () => ReactNode,
): ReactNode;
export function useEntityList<T>(config: {
  keyval: Keyval<any, T, any, any>;
  field: keyof T;
  fn: () => ReactNode;
}): ReactNode;
export function useEntityList<T>(
  ...[keyvalOrConfig, viewFn]:
    | [keyval: Keyval<any, T, any, any>, View: () => ReactNode]
    | [
        config: {
          keyval: Keyval<any, T, any, any>;
          field: keyof T;
          fn: () => ReactNode;
        },
      ]
) {
  let View: () => ReactNode;
  let keyvalToIterate: Keyval<any, T, any, any>;
  if (isKeyval(keyvalOrConfig)) {
    [keyvalToIterate, View] = [keyvalOrConfig, viewFn!];
  } else {
    const {
      keyval: keyvalRaw,
      field,
      fn,
    } = keyvalOrConfig as Exclude<
      typeof keyvalOrConfig,
      Keyval<any, any, any, any>
    >;
    View = fn;
    /**
     * keyvalRaw is always a root keyval, used as a tag
     * keyval is current instance in which computation will happens
     * instanceKeyval is child instance from a field
     */
    const [keyval, currentKey] = useGetKeyvalKey([keyvalRaw]);
    const instanceKeyval = useStoreMap({
      store: keyval.__$listState,
      keys: [currentKey, field],
      fn({ instances, keys }, [key, field]) {
        const idx = keys.findIndex((e) => e === key);
        return instances[idx].keyvalShape[field];
      },
    });
    keyvalToIterate = instanceKeyval;
  }

  return useList(keyvalToIterate.$keys, (key) => {
    return (
      <EntityProvider model={keyvalToIterate} value={key}>
        <View />
      </EntityProvider>
    );
  });
}

export function useItemApi<T, Api>(
  ...args:
    | [keyval: Keyval<any, T, Api, any>]
    | [keyval: Keyval<any, T, Api, any>, key: string | number]
): {
  [K in keyof Api]: Api[K] extends EventCallable<infer V>
    ? (params: V) => void
    : never;
} {
  const [keyval, key] = useGetKeyvalKey(args);
  const commonApi = useUnit(keyval.api);
  return useMemo(() => {
    const result = {} as any;
    for (const field in commonApi) {
      const fn = (data: any) =>
        //@ts-expect-error
        commonApi[field]({
          key,
          data,
        });
      result[field] = fn;
    }
    return result;
  }, [keyval, key, commonApi]);
}

export function useEditItemField<Input>(
  ...args:
    | [keyval: Keyval<Input, any, any, any>]
    | [keyval: Keyval<Input, any, any, any>, key: string | number]
): {
  [K in keyof Input]-?: (params: Input[K]) => void;
} {
  const [keyval, key] = useGetKeyvalKey(args);
  const commonApi = useUnit(keyval.editField);
  return useMemo(() => {
    const result = {} as any;
    for (const field in commonApi) {
      const fn = (data: any) =>
        //@ts-expect-error
        commonApi[field]({
          key,
          data,
        });
      result[field] = fn;
    }
    return result;
  }, [keyval, key, commonApi]);
}

export function useEditKeyval<Input, Output>(
  keyval: Keyval<Input, Output, any, any>,
) {
  const [currentKeyval] = useGetKeyvalKey([keyval], true);
  return useUnit(currentKeyval.edit);
}
