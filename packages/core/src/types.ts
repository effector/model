import { Effect, Event, EventCallable, Store, StoreWritable } from "effector";

export type RefTarget = Keyval<any, any, any, any> | Model<any>;

export type DefineStore<T> = { '@@type': 'store'; defaultValue: T };
export type DefineEvent<T = void> = { '@@type': 'event' };
export type DefineEffect<Effect> = { '@@type': 'effect', effect: Effect };
export type DefineRef<T extends RefTarget> = { '@@type': 'ref'; model: T };

type ShapeElement = DefineStore<any> | DefineEvent<any> | DefineEffect<any> | DefineRef<any>;
export type ModelShape = Record<string, ShapeElement>;

export interface Define {
  store: <T>(defaultValue: T) => DefineStore<T>;
  event: <T>() => DefineEvent<T>;
  effect: <InputEffect extends Effect<any, any, any>>(effect: InputEffect) => DefineEffect<InputEffect>;
  ref: <T extends RefTarget>(model: T) => DefineRef<T>;
}

type ToPrimitive<T extends ShapeElement> =
  T extends DefineStore<infer K> ?
    K :
    T extends DefineRef<infer K> ?
      Record<string, K> :
      never;

export type ModelProjection<Shape extends ModelShape> = {
  [k in keyof Shape]: ToPrimitive<Shape[k]>
}

type StoreOverride<Writable extends boolean> = { writable: Writable };
type EventOverride<Callable extends boolean> = { callable: Callable };

type Override<Element extends ShapeElement> =
  Element extends DefineStore<any> ?
    StoreOverride<boolean> :
    Element extends DefineEvent<any> ?
      EventOverride<boolean> :
      never

type WithOverrides<
  Shape extends ModelShape,
  Overrides extends ModelOverrides<Shape>,
  Units extends ModelUnits<Shape>
> = Omit<Units, keyof Overrides> & {
  [p in keyof Overrides extends keyof Shape ? keyof Overrides : never]:
    Units[p] extends StoreWritable<infer K> ?
      Overrides[p] extends { writable: false } ?
        Store<K> : never
    :
    Units[p] extends EventCallable<infer K> ?
      Overrides[p] extends { callable: false } ?
        Event<K> : never
    : never
}

type KeyvalUnits<
  Target extends Keyval<any, any, any, any>,
  Overrides extends ModelOverrides<Shape> = Target extends Keyval<any, infer K, any, any> ? K : never,
  PublicApi extends ModelPublicApi<Shape> = Target extends Keyval<any, any, infer K, any> ? K : never,
  Shape extends ModelShape = Target extends Keyval<any, any, any, infer K> ? K : never,
> = PublicApi extends never ?
      Overrides extends never ?
        ModelUnits<Shape> :
        WithOverrides<Shape, Overrides, ModelUnits<Shape>> :
      Overrides extends never ?
        PublicApi :
        WithOverrides<Shape, Overrides, ModelUnits<Shape>>

export type ModelUnits<Shape extends ModelShape> = {
  [k in keyof Shape]: 
    Shape[k] extends DefineStore<infer K > ?
      StoreWritable<K> :
      Shape[k] extends DefineEvent<infer K> ?
        EventCallable<K> :
        Shape[k] extends DefineEffect<infer K> ?
          K :
          Shape[k] extends DefineRef<Model<infer K>> ?
            ModelUnits<K> :
            Shape[k] extends DefineRef<infer K extends Keyval<any, any, any, any>> ?
              KeyvalUnits<K> :
              never
}

export type ModelOverrides<Shape extends ModelShape> = Partial<{
  [k in keyof Shape]: Override<Shape[k]>;
}>;

export type ModelPublicApi<Shape extends ModelShape> = Partial<{
  [k in keyof Shape]: Shape[k];
}>

export interface Model<Shape extends ModelShape> {
  '@@type': 'model';
  shape: Shape;
}

export interface Keyval<
  InputModel extends Model<any>,
  Overrides extends ModelOverrides<Shape>,
  PublicApi extends ModelPublicApi<Shape>,
  Shape extends ModelShape = InputModel extends Model<infer K> ? K : never
> {
  '@@type': 'keyval';
  
  add: EventCallable<{ id: string; data: ModelProjection<Shape> }>,
  remove: EventCallable<{ id: string }>,

  __: {
    model: InputModel;
    factory?: () => void | {
        overrides?: Overrides;
        publicApi?: PublicApi;
    };
    $keyvalScope: Store<Record<string, ModelProjection<Shape>>>;
  };
}

export type KeyvalFn<
  Shape extends ModelShape,
  Overrides extends ModelOverrides<Shape>,
  PublicApi extends ModelPublicApi<Shape>
> = (units: ModelUnits<Shape>) => void | {
  overrides?: Overrides;
  publicApi?: PublicApi;
};

export interface KeyvalParams<
  InputModel extends Model<any>,
  Overrides extends ModelOverrides<Shape>,
  PublicApi extends ModelPublicApi<Shape>,
  Fn extends KeyvalFn<Shape, Overrides, PublicApi>,
  Shape extends ModelShape = InputModel extends Model<infer K> ? K : never
> {
  model: InputModel;
  fn?: Fn;
}