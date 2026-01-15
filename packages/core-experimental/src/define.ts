export type StoreDef<T> = {
  type: 'store';
  initial?: T;
  __type?: T;
};

export type EventDef<T> = {
  type: 'event';
  __type?: T;
};

export type ArrayDef<T> = {
  type: 'array';
  item: any;
  __type?: T[];
};

export type RefDef = {
  type: 'ref';
  kind: 'self' | 'tag';
  name?: string;
};

export const define = {
  store: <T>(initial?: T): StoreDef<T> => ({
    type: 'store',
    initial,
  }),
  event: <T>(): EventDef<T> => ({
    type: 'event',
  }),
  array: <T>(item: any): ArrayDef<T> => ({
    type: 'array',
    item,
  }),
};

export const ref = {
  self: { type: 'ref', kind: 'self' } as const,
  tag: (name: string): RefDef => ({ type: 'ref', kind: 'tag', name }),
};
