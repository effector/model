import type {
  Store,
  Event,
  Effect,
  EventCallable,
  Node,
  UnitTargetable,
} from 'effector';

export type FactoryPathMap = Map<number, string | FactoryPathMap>;

export type Model<Props, Output, Api, Shape> = {
  type: 'model';
  // private
  readonly keyField: keyof Props;
  // private
  readonly requiredStateFields: Array<keyof Props>;
  // private
  readonly keyvalFields: Array<keyof Output>;
  // private
  readonly factoryStatePaths: FactoryPathMap;
  // private
  create: () => any;
  // private
  readonly __lens: Shape;
  // private
  // readonly api: Api;
  // private
  readonly apiFields: Array<keyof Api>;
  shape: Show<
    {
      [K in keyof Props]: Props[K] extends Store<infer V>
        ? StoreDef<V>
        : Props[K] extends StoreDef<unknown>
          ? Props[K]
          : Props[K] extends Event<infer V>
            ? EventDef<V>
            : Props[K] extends EventDef<unknown>
              ? Props[K]
              : Props[K] extends Effect<infer V, infer D, infer E>
                ? EffectDef<V, D, E>
                : Props[K] extends EffectDef<unknown, unknown, unknown>
                  ? Props[K]
                  : Props[K] extends (params: infer V) => infer D
                    ? EffectDef<V, Awaited<D>, any>
                    : StoreDef<Props[K]>;
    } & {
      [K in keyof Output]: Output[K] extends Store<infer V>
        ? StoreDef<V>
        : never;
    } & {
      [K in keyof Api]: Api[K] extends Event<infer V>
        ? EventDef<V>
        : Api[K] extends Effect<infer V, infer D, infer E>
          ? EffectDef<V, D, E>
          : never;
    }
  >;
  // private
  __struct: StructShape;
  defaultState(): Output;
};

export type Instance<Output, Api> = {
  type: 'instance';
  // private
  readonly output: Store<Output>;
  // private
  readonly keyvalShape: Record<keyof Output, Keyval<any, any, any, any>>;
  readonly props: Output;
  onMount: UnitTargetable<void> | void;
  // private
  region: Node;
  api: Api;
};

export type AnyDef<T> =
  | StoreDef<T>
  | EventDef<T>
  | EffectDef<T, unknown, unknown>;

export type StoreDef<T> = {
  type: 'storeDefinition';
  readonly __: T;
};

export type EventDef<T> = {
  type: 'eventDefinition';
  readonly __: T;
};

export type EffectDef<T, Result, Err> = {
  type: 'effectDefinition';
  readonly __: T;
  readonly res: Result;
  readonly err: Err;
};

export type EntityShapeDef<Shape> = {
  type: 'entityShapeDefinition';
  readonly shape: Shape;
};

export type EntityItemDef<T> = {
  type: 'entityItemDefinition';
  readonly __: T;
};

export type OneOfShapeDef =
  | StoreDef<any>
  | EntityShapeDef<any>
  | EntityItemDef<any>;

export type InstanceOf<T extends Model<unknown, unknown, unknown, unknown>> =
  T extends Model<any, infer Output, infer Api, any>
    ? Instance<Output, Api>
    : never;

export type KeyOrKeys = string | number | Array<string | number>;

export type LensShape<Shape> = {
  __type: 'lensShape';
} & Shape;

export type LensItem<T> = {
  __type: 'lensItem';
  store: Store<T>;
};

export type LensStore<T> = {
  __type: 'lensStore';
  store(): Store<T | null>;
  store(defaultValue: T): Store<T>;
};

export type LensEvent<T> = {
  __type: 'lensEvent';
  __value: T;
};

/** internal representation of model structure, unit leaf */
export type StructUnit =
  | {
      type: 'structUnit';
      unit: 'event' | 'effect';
    }
  | {
      type: 'structUnit';
      unit: 'store';
      derived: boolean;
    };

/** internal representation of model structure, model shape */
export type StructShape = {
  type: 'structShape';
  shape: Record<string, StructUnit | StructKeyval>;
};

/** internal representation of model structure, keyval shape */
export type StructKeyval = {
  type: 'structKeyval';
  getKey: (input: any) => string | number;
  shape: Record<string, StructUnit | StructKeyval>;
  defaultItem(): any;
};

export type KeyStore = Store<string | number>;

export type ConvertToLensShape<Shape> = {
  [K in keyof Shape]: Shape[K] extends StoreDef<infer V>
    ? LensStore<V>
    : Shape[K] extends EventDef<infer V>
      ? LensEvent<V>
      : Shape[K] extends EntityShapeDef<infer ChildShape>
        ? (key: KeyStore) => LensShape<ConvertToLensShape<ChildShape>>
        : Shape[K] extends EntityItemDef<infer V>
          ? (key: KeyStore) => LensItem<V>
          : Shape[K] extends Store<infer V>
            ? LensStore<V>
            : Shape[K] extends Event<infer V>
              ? LensEvent<V>
              : Shape[K] extends Keyval<any, infer V, any, infer ChildShape>
                ? {
                    (key: KeyStore): LensShape<ChildShape>;
                    itemStore(key: KeyStore): Store<V>;
                    has(key: KeyStore): Store<boolean>;
                  }
                : never;
};

type OneOrMany<T> = T | Array<T>;

export type Keyval<Input, Enriched, Api, Shape> = {
  type: 'keyval';
  api: {
    [K in keyof Api]: Api[K] extends EventCallable<infer V>
      ? EventCallable<
          | { key: string | number; data: V }
          | {
              key: Array<string | number>;
              data: V[];
            }
        >
      : never;
  };
  $items: Store<Enriched[]>;
  $keys: Store<Array<string | number>>;
  edit: {
    /** Add one or multiple entities to the collection */
    add: EventCallable<OneOrMany<Input>>;
    /** Add or replace one or multiple entities in the collection */
    set: EventCallable<OneOrMany<Input>>;
    /** Update one or multiple entities in the collection. Supports partial updates */
    update: EventCallable<OneOrMany<Partial<Input>>>;
    /** Remove multiple entities from the collection, by id or by predicate */
    remove: EventCallable<KeyOrKeys | ((entity: Enriched) => boolean)>;
    /** Replace current collection with provided collection */
    replaceAll: EventCallable<Input[]>;
    /** Update multiple entities in the collection by defining a map function */
    map: EventCallable<{
      keys: KeyOrKeys;
      map: (entity: Enriched) => Partial<Input>;
      upsert?: boolean;
    }>;
  };
  editField: {
    [K in keyof Input]-?: EventCallable<
      | { key: string | number; data: Exclude<Input[K], undefined> }
      | {
          key: Array<string | number>;
          data: Exclude<Input[K], undefined>[];
        }
    >;
  };
  // private
  __lens: Shape;
  // private
  __struct: StructKeyval;
  defaultState(): Enriched;
  //private
  clone(isClone: boolean): Keyval<Input, Enriched, Api, Shape>;
  isClone: boolean;
};

export type StoreContext<T> = {
  type: 'storeContext';
  readonly __: T;
};

type BuiltInObject =
  | Error
  | Date
  | RegExp
  | Int8Array
  | Uint8Array
  | Uint8ClampedArray
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Float32Array
  | Float64Array
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>
  | WeakMap<object, unknown>
  | WeakSet<object>
  | ArrayBuffer
  | DataView
  | Function
  | Promise<unknown>
  | Generator;

/**
 * Force typescript to print real type instead of geneic types
 *
 * It's better to see {a: string; b: number}
 * instead of GetCombinedValue<{a: Store<string>; b: Store<number>}>
 * */
export type Show<A extends any> = A extends BuiltInObject
  ? A
  : {
      [K in keyof A]: A[K];
    }; // & {}

export type InputType<T extends Keyval<any, any, any, any>> =
  T extends Keyval<infer Input, any, any, any> ? Input : never;

/** Internal state of keyval */
export type ListState<Enriched, Output, Api> = {
  items: Enriched[];
  instances: Array<Instance<Output, Api>>;
  keys: Array<string | number>;
};

type ToPlainShape<Shape> = {
  [K in {
    [P in keyof Shape]: Shape[P] extends Store<unknown>
      ? P
      : Shape[P] extends StoreDef<unknown>
        ? P
        : never;
  }[keyof Shape]]: Shape[K] extends Store<infer V>
    ? V
    : Shape[K] extends StoreDef<infer V>
      ? V
      : never;
};

type ParamsNormalize<
  T extends {
    [key: string]:
      | Store<unknown>
      | Event<unknown>
      | Effect<unknown, unknown, unknown>
      | StoreDef<unknown>
      | EventDef<unknown>
      | EffectDef<unknown, unknown, unknown>
      | unknown;
  },
> = {
  [K in keyof T]: T[K] extends Store<infer V>
    ? T[K] | V
    : T[K] extends Event<unknown>
      ? T[K]
      : T[K] extends Effect<infer V, infer Res, unknown>
        ? T[K] | ((params: V) => Res | Promise<Res>)
        : T[K] extends StoreDef<infer V>
          ? Store<V> | V
          : T[K] extends EventDef<infer V>
            ? Event<V>
            : T[K] extends EffectDef<infer V, infer Res, infer Err>
              ? Effect<V, Res, Err> | ((params: V) => Res | Promise<Res>)
              : T[K] extends (params: infer V) => infer Res
                ?
                    | Effect<V, Awaited<Res>, unknown>
                    | T[K]
                    | ((params: V) => Awaited<Res> | Promise<Awaited<Res>>)
                : Store<T[K]> | T[K];
};

export type KeyvalWithState<Input, Output> = Keyval<
  Input,
  Output,
  unknown,
  unknown
>;
