import { Effect } from "effector";
import type { Define, DefineEffect, DefineEvent, DefineRef, DefineStore, Keyval, Model } from "./types";

export const define: Define = {
    store<T>(defaultValue: T): DefineStore<T> {
        return { '@@type': 'store' , defaultValue };
    },

    event<T>(): DefineEvent<T> {
        return { '@@type': 'event' }
    },

    effect<InputEffect extends Effect<any, any, any>>(effect: InputEffect): DefineEffect<InputEffect> {
        return { '@@type': 'effect', effect }
    },
    
    ref<T extends Model<any> | Keyval<any, any, any, any>>(model: T): DefineRef<T> {
        return { '@@type': 'ref', model }
    }
}