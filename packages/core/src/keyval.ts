import { attach, createEvent, createStore, Unit, withRegion } from "effector";
import { ModelProjection, ModelUnits, type Keyval, type KeyvalFn, type KeyvalParams, type Model, type ModelOverrides, type ModelPublicApi, type ModelShape } from "./types";
import { unitReplacer, withKeyvalCtx } from "./relation";

interface ControlProps {
    allUnits: Unit<any>[];
}

function defineModelShape<Target extends Model<ModelShape>, Shape extends ModelShape = Target extends Model<infer K> ? K : never>(model: Target, props: ControlProps): ModelUnits<Shape> {
    const units: Record<string, any> = {};

    for (const key in model.shape) {
        const element = model.shape[key];

        switch (element["@@type"]) {
            case "store": {
                units[key] = createStore(element.defaultValue);
                props.allUnits.push(units[key]);
                
                break;
            }
            case "event": {
                units[key] = createEvent();
                props.allUnits.push(units[key]);

                break;
            }
            case "effect": {
                units[key] = attach({ effect: element.effect });
                props.allUnits.push(units[key]);

                break;
            }
            case "ref": {
                units[key] = defineModelShape(element.model, props);
                break;
            }
        }
    }

    return units as ModelUnits<Shape>;
}

function createKeyvalFactory<Units extends ModelUnits<any>, Fn extends KeyvalFn<any, any, any>>(units: Units, allUnits: Unit<any>[], fn: Fn) {
    return () => {
        const { unsubscribe } = unitReplacer.subscribe((unit) => {
            if (allUnits.includes(unit)) {
                console.log(unit.kind, unit.kind)
            }

            return unit;
        })

        const result = withKeyvalCtx(() => fn(units));
        
        unsubscribe();

        return result;
    };
}

export function keyval<
  InputModel extends Model<any>,
  Fn extends KeyvalFn<Shape, any, any>,
  Shape extends ModelShape = InputModel extends Model<infer K> ? K : never,
  Overrides extends ModelOverrides<Shape> = Fn extends KeyvalFn<any, infer K, any> ? K : never,
  PublicApi extends ModelPublicApi<Shape> = Fn extends KeyvalFn<any, any, infer K> ? K : never
>(params: KeyvalParams<InputModel, Overrides, PublicApi, Fn, Shape>): Keyval<InputModel, Overrides, PublicApi, Shape> {
    type InstanceData = ModelProjection<Shape>;

    const $keyvalScope = createStore<Record<string, InstanceData>>({});

    const add = createEvent<{ id: string; data: InstanceData }>();
    const remove = createEvent<{ id: string }>();

    const allUnits: Unit<any>[] = [];
    const units = defineModelShape(params.model, { allUnits });

    return {
        '@@type': 'keyval',

        add,
        remove,

        __: {
            model: params.model,
            factory: params.fn ? createKeyvalFactory(units, allUnits, params.fn) : undefined,
            $keyvalScope,
        },
    };
}
