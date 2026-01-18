import { currentSkipLazyCb, isRoot, isInitClone } from './lazy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queue: InitTask<any>[] = [];
let scheduled = false;

type InitTask<T> = {
  target: T;
  init: () => T;
  initialized: boolean;
};

const ignore = [
  'type',
  'clone',
  'isClone',
  'cloneOf',
  '__$listState',
  '$items',
  '$keys',
  'getCloneData',
];

function runQueue() {
  for (const task of queue.splice(0)) {
    if (!task.initialized) {
      const value = task.init();
      for (const key of Object.keys(value) as (keyof typeof value)[]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!ignore.includes(key as any)) {
          Object.defineProperty(task.target, key, {
            value: value[key],
            writable: true,
            enumerable: true,
            configurable: true,
          });
        }
      }
      task.initialized = true;
    }
  }
}

export function lazyInit<T extends object>(target: T, init: () => T): T {
  if (currentSkipLazyCb && !isRoot && isInitClone) {
    return target;
  }
  const task: InitTask<T> = { target, init, initialized: false };
  queue.push(task);
  if (!scheduled) {
    scheduled = true;
    const timer = setTimeout(() => {
      scheduled = false;
      runQueue();
    }, 0);
    if (typeof timer === 'object' && timer && 'unref' in timer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (timer as any).unref();
    }
  }

  for (const key of Object.keys(target) as (keyof T)[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!ignore.includes(key as any)) {
      Object.defineProperty(target, key, {
        get() {
          if (!task.initialized) {
            runQueue();
          }
          return target[key];
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  return target;
}
