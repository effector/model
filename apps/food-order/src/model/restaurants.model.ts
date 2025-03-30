import { keyval } from '@effector/model';

import type { Restaurant, Additive } from '../types';
import { restaurants } from '../mocks';
import { createStore } from 'effector';

// export const restaurantsList = keyval({
//   key: ({ name }: Restaurant) => name,
//   shape: {
//     name: define.store<string>(),
//     dishes: define.entityShape({
//       name: define.store<string>(),
//       additives: define.entityItem<Additive>(),
//       price: define.store<number>(),
//     }),
//   },
// });

export const restaurantsList = keyval(() => {
  const $name = createStore('');
  const $description = createStore('');
  const $category = createStore<string[]>([]);
  const dishesList = keyval(() => {
    const $name = createStore('');
    const $description = createStore('');
    const $price = createStore(0);
    const $additives = createStore<Additive[]>([]);
    return {
      key: 'name',
      state: {
        name: $name,
        description: $description,
        price: $price,
        additives: $additives,
      },
    };
  });
  return {
    key: 'name',
    state: {
      name: $name,
      description: $description,
      category: $category,
      dishes: dishesList,
    },
  };
});

restaurantsList.edit.replaceAll(restaurants);
