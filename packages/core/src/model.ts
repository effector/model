import type { Model, ModelShape } from "./types";

export function model<Shape extends ModelShape>(shape: Shape): Model<Shape> {
    return {
        '@@type': 'model',
        shape,
    };
}