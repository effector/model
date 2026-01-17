import { is } from 'effector';

export function serialize(instance: any): any {
  if (is.store(instance)) {
    return instance.getState();
  }
  if (Array.isArray(instance)) {
    return instance.map(serialize);
  }
  if (instance && typeof instance === 'object') {
    const res: any = {};
    for (const [key, val] of Object.entries(instance)) {
      if (typeof val === 'function') continue;
      if (key.startsWith('__')) continue;
      if (key === 'config') continue;

      if (is.store(val)) {
        res[key] = val.getState();
      } else if (is.event(val)) {
        continue;
      } else {
        res[key] = serialize(val);
      }
    }
    return res;
  }
  return instance;
}
