const queue: InitTask<any>[] = [];
let scheduled = false;

type InitTask<T> = {
  target: T;
  init: () => T;
  initialized: boolean;
};

const ignore = ['type', 'clone', 'isClone'];

function runQueue() {
  for (const task of queue.splice(0)) {
    if (!task.initialized) {
      const value = task.init();
      for (const key of Object.keys(value) as (keyof typeof value)[]) {
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
  const task: InitTask<T> = { target, init, initialized: false };

  queue.push(task);
  if (!scheduled) {
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      runQueue();
    }, 0);
  }

  for (const key of Object.keys(target) as (keyof T)[]) {
    if (!ignore.includes(key as any)) {
      Object.defineProperty(target, key, {
        get() {
          if (!task.initialized) runQueue();
          return target[key];
        },
        enumerable: true,
        configurable: true,
      });
    }
  }

  return target;
}
