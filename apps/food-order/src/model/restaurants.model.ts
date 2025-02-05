import { define, entityList } from './impl';

import type { Restaurant, Additive } from '../types';
import { restaurants } from '../mocks';

export const restaurantsList = entityList({
  getKey: ({ name }: Restaurant) => name,
  shape: {
    name: define.store<string>(),
    dishes: define.entityShape({
      name: define.store<string>(),
      additives: define.entityItem<Additive>(),
      price: define.store<number>(),
    })
  },
});

restaurantsList.edit.replaceAll(restaurants);
