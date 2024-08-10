import type { Model } from './types';

export function lazy<M extends Model<unknown, unknown, unknown, unknown>>(
  cb: () => M
): M {
  return cb();
}
