import {
  Store,
  Event,
  Effect,
  createNode,
  withRegion,
  createEvent,
  clearNode,
  is,
  Node,
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
  FactoryPathMap,
  StructShape,
} from './types';
import { define, isKeyval } from './define';

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
    factoryStatePaths,
    shape,
    __lens: {} as any,
    __struct: structShape,
    defaultState,
  };
}

function collectFactoryPaths(state: Record<string, any>, initRegion: Node) {
  const factoryPathToStateKey: FactoryPathMap = new Map();
  for (const key in state) {
    const value = state[key];
    if (is.store(value) && is.targetable(value)) {
      const path = findNodeInTree((value as any).graphite, initRegion);
      if (path) {
        let nestedFactoryPathMap = factoryPathToStateKey;
        for (let i = 0; i < path.length; i++) {
          const step = path[i];
          const isLastStep = i === path.length - 1;
          if (isLastStep) {
            nestedFactoryPathMap.set(step, key);
          } else {
            let childFactoryPathMap = nestedFactoryPathMap.get(step);
            if (!childFactoryPathMap) {
              childFactoryPathMap = new Map();
              nestedFactoryPathMap.set(step, childFactoryPathMap);
            }
            nestedFactoryPathMap = childFactoryPathMap as FactoryPathMap;
          }
        }
      }
    }
  }
  return factoryPathToStateKey;
}

function findNodeInTree(
  searchNode: Node,
  currentNode: Node,
  path: number[] = [],
): number[] | void {
  const idx = currentNode.family.links.findIndex((e) => e === searchNode);
  if (idx !== -1) {
    return [...path, idx];
  } else {
    for (let i = 0; i < currentNode.family.links.length; i++) {
      const linkNode = currentNode.family.links[i];
      if (linkNode.meta.isRegion) {
        const result = findNodeInTree(searchNode, linkNode, [...path, i]);
        if (result) return result;
      }
    }
  }
}
