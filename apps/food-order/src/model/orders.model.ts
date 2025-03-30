import {
  createStore,
  combine,
  createEvent,
  createEffect,
  sample,
} from 'effector';

import { keyval, lens } from '@effector/model';

import {
  getAmountPerItemType,
  calculateAdditiveOrderPriceFromEntity,
} from './calculateUtils';
import { restaurantsList } from './restaurants.model';
import {
  openRestaurant,
  openRestList,
  $restaurantName,
  $dishName,
} from './route';

export const addToOrder = createEvent();

export const ordersList = keyval(() => {
  const $restaurant = createStore('');
  const dishList = keyval(() => {
    const $dish = createStore<string>('');
    const dishLens = lens(restaurantsList, $restaurant).dishes($dish);
    const additivesList = keyval(() => {
      const $additive = createStore('');
      const $choice = createStore('');
      const $amount = createStore(0);
      // const $additiveEntity = lens(restaurantsList, $restaurant)
      //   .dishes($dish)
      //   .additives($additive)
      //   .store;
      const $additiveEntity = combine(
        dishLens.additives.store,
        $additive,
        (items, name) =>
          items?.find((e) => e.name === name) ?? {
            name: '',
            required: false,
            options: [],
          },
      );
      const $showAmount = combine(
        $additiveEntity,
        $choice,
        (additiveEntity, choice) =>
          getAmountPerItemType(additiveEntity, choice) === 'many',
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
          showAmount: $showAmount,
          totalPrice: $totalPrice,
        },
      };
    });
    const $totalPrice = combine(
      dishLens.price.store,
      additivesList.$items,
      (price, additives) =>
        additives.reduce(
          (sum, additive) => sum + additive.totalPrice,
          price ?? 0,
        ),
    );

    return {
      key: 'dish',
      state: {
        dish: $dish,
        additives: additivesList,
        totalPrice: $totalPrice,
      },
    };
  });
  const $totalPrice = combine(dishList.$items, (dishOrders) =>
    dishOrders.reduce((sum, dishOrder) => sum + dishOrder.totalPrice, 0),
  );
  return {
    key: 'restaurant',
    state: {
      restaurant: $restaurant,
      dishes: dishList,
      totalPrice: $totalPrice,
    },
    api: {
      addDishToOrder: dishList.edit.add,
    },
    optional: ['dishes'],
  };
});

export const $isInOrder = lens(ordersList)
  .item($restaurantName)
  .dishes.has($dishName);

export const submitOrder = createEvent();

const orderInProgressFx = createEffect(async (rest: string) => {
  await new Promise((rs) => setTimeout(rs, 2000));
  return rest;
});

export const $submitInProgress = orderInProgressFx.pending;

sample({
  clock: submitOrder,
  source: $restaurantName,
  target: orderInProgressFx,
});

sample({
  clock: orderInProgressFx.doneData,
  target: [ordersList.edit.remove, openRestList],
});

sample({
  clock: openRestaurant,
  fn: (restaurant) => ({ restaurant }),
  target: ordersList.edit.add,
});
