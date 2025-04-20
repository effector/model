import { combine, createStore, createEvent, sample, UnitValue } from 'effector';
import { keyval, lens } from '@effector/model';

import { openDishList, $restaurantName, $dishName } from './route';
import { restaurantsList } from './restaurants.model';
import { addToOrder, ordersList } from './orders.model';
import {
  calculateAdditiveOrderPriceFromEntity,
  calculateDishOrderPrice,
} from './calculateUtils';

const restaurantLens = lens(restaurantsList, $restaurantName);

export const $dish = restaurantLens.dishes.itemStore($dishName);

export const $dishAdditives = restaurantLens
  .dishes($dishName)
  .additives.store([]);

export const additivesList = keyval(() => {
  const $additive = createStore('');
  const $choice = createStore('');
  const $amount = createStore(0);
  const $additiveEntity = combine(
    $dishAdditives,
    $additive,
    (additives, additiveName) =>
      additives.find((e) => e.name === additiveName) ?? {
        name: '',
        required: false,
        options: [],
      },
  );
  const $totalPrice = combine(
    $additiveEntity,
    $choice,
    $amount,
    (additiveEntity, choice, amount) =>
      calculateAdditiveOrderPriceFromEntity(additiveEntity, choice, amount),
  );
  return {
    key: 'additive',
    state: {
      additive: $additive,
      choice: $choice,
      amount: $amount,
      totalPrice: $totalPrice,
    },
    optional: ['amount'],
  };
});

export const addAdditive = createEvent<{ additive: string; choice: string }>();
export const removeAdditive = createEvent<string>();

export const $currentDishTotalPrice = combine(
  $dish,
  additivesList.$items,
  (dish, additives) =>
    dish ? calculateDishOrderPrice(dish, { dish: dish.name, additives }) : 0,
);

sample({
  clock: addAdditive,
  target: additivesList.edit.map.prepend(
    (e: UnitValue<typeof addAdditive>) => ({
      keys: [e.additive],
      map: ({ amount, ...rest }) => ({ ...rest, amount: amount + 1 }),
      upsert: true,
    }),
  ),
});

sample({
  clock: removeAdditive,
  target: additivesList.edit.remove,
});

sample({
  clock: addToOrder,
  source: { restaurant: $restaurantName },
  target: ordersList.edit.add,
});

sample({
  clock: addToOrder,
  source: {
    restaurant: $restaurantName,
    dish: $dishName,
    additives: additivesList.$items,
  },
  fn: ({ restaurant, dish, additives }) => ({
    key: restaurant,
    data: {
      dish,
      additives,
    },
  }),
  target: ordersList.api.addDishToOrder,
});

sample({ clock: addToOrder, target: openDishList });

sample({
  clock: addToOrder,
  fn: () => [],
  target: additivesList.edit.replaceAll,
});

$restaurantName.updates.watch((upd) => {
  console.log('restaurantName', upd);
});

$dishName.updates.watch((upd) => {
  console.log('dishName', upd);
});

additivesList.$items.updates.watch((upd) => {
  console.log('additivesList', upd);
});

ordersList.$items.updates.watch((upd) => {
  console.log('ordersList', upd);
});
