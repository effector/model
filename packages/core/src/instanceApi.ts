import { type Store, type StoreWritable, createEvent, launch } from 'effector';
import type { Keyval, Model, StoreDef, ListState } from './types';

export function createInstanceApi<Input, Enriched, Output, Api, Shape>(
  $entities: StoreWritable<ListState<Enriched, Output, Api>>,
  kvModel:
    | Model<
        {
          [K in keyof Input]?: Store<Input[K]> | StoreDef<Input[K]>;
        },
        Output,
        Api,
        Shape
      >
    | undefined,
): Keyval<Input, Enriched, Api, Shape>['api'] {
  const api = {} as Record<keyof Api, any>;
  if (kvModel) {
    for (const prop of kvModel.apiFields) {
      const evt = createEvent<
        | {
            key: string | number;
            data: any;
          }
        | {
            key: Array<string | number>;
            data: any[];
          }
      >();
      api[prop] = evt;
      $entities.on(evt, (state, payload) => {
        const [key, data] = Array.isArray(payload.key)
          ? [payload.key, payload.data]
          : [[payload.key], [payload.data]];
        const targets = [] as any[];
        const params = [] as any[];
        for (let i = 0; i < key.length; i++) {
          const idx = state.keys.indexOf(key[i]);
          if (idx !== -1) {
            const instance = state.instances[idx];
            targets.push(instance.api[prop]);
            params.push(data[i]);
          }
        }
        launch({
          target: targets,
          params,
          defer: true,
        });
        return state;
      });
    }
  }
  return api;
}
