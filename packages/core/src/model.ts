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
} from './types';
import { define, isDefine, isKeyval } from './define';

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
  create: (config: { onMount: Event<void> }) => {
    state: Output;
    api?: Api;
    key: string;
    optional?: string[];
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
  const shape = {} as any;
  const region = createNode({ regional: true });
  const {
    state = {} as Output,
    key,
    api = {} as Api,
    optional = [],
    ...rest
  } = withRegion(region, () => {
    const onMount = createEvent();
    return create({ onMount });
  });

  if (Object.keys(rest).length > 0) {
    throw Error(
      `create should return only fields 'key', 'state', 'api' or 'optional'`,
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

  clearNode(region);
  return {
    type: 'model',
    create,
    keyField: key,
    requiredStateFields,
    keyvalFields,
    factoryStatePaths,
    propsConfig: props,
    output: null as unknown as any,
    // api: null as unknown as any,
    shape,
    shapeInited: false,
    __lens: {} as any,
  };
}

// function withInitState(fn) {
//   const initRegion = createNode({ regional: true });

//   const state = withRegion(initRegion, () => fn());
//   const factoryPathToStateKey = collectFactoryPaths(state, initRegion);
//   clearNode(initRegion);

//   return (initState: Record<string, any> = {}) => {
//     const region = createNode({ regional: true });
//     installStateHooks(initState, region, factoryPathToStateKey);
//     return [withRegion(region, () => fn()), region];
//   };
// }

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
