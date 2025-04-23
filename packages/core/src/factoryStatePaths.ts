import { type Node, is } from 'effector';

import type { FactoryPathMap } from './types';

/** Monkey patching for effector 23 for proper initial state in stores */
export function installStateHooks(
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

/** Collect factory paths for further patching */
export function collectFactoryPaths(
  state: Record<string, any>,
  initRegion: Node,
) {
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
