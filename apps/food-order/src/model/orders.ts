import {
  createStore,
  combine,
  createEvent,
  createEffect,
  sample,
} from 'effector';

import type { Order } from '../types';

import {
  calculateDishOrderPrice,
  getOrderedPerItemType,
  calculateAdditiveOrderPrice,
  calculateTotalOrderPrice,
} from './calculateUtils';
import { $restaurant } from './restaurant';
import { openDishList, openRestList } from './route';

export const addToOrder = createEvent();
const removeOrder = createEvent();

export const $orders = createStore<Order[]>([]);

export const $order = combine(
  $restaurant,
  $orders,
  ({ name }, orders) =>
    orders.find((e) => e.restaurant === name) ?? {
      restaurant: name,
      dishes: [],
    }
);

export const $totalOrderPrice = combine(
  $restaurant,
  $order,
  (restaurant, order) => calculateTotalOrderPrice(restaurant, order)
);

export const $orderWithPrices = combine(
  $restaurant,
  $orders,
  (restaurant, orders) => {
    const order = orders.find((e) => e.restaurant === restaurant.name);
    if (!order) return [];
    return order.dishes.map((dishOrder) => {
      const dish = restaurant.dishes.find((e) => e.name === dishOrder.dish)!;
      return {
        dish: dish.name,
        totalPrice: calculateDishOrderPrice(dish, dishOrder),
        additives: dishOrder.additives.map((additiveOrder) => ({
          ...additiveOrder,
          showAmount: getOrderedPerItemType(dish, additiveOrder) === 'many',
          totalPrice: calculateAdditiveOrderPrice(dish, additiveOrder),
        })),
      };
    });
  }
);

export const submitOrder = createEvent();

const orderInProgressFx = createEffect(async () => {
  await new Promise((rs) => setTimeout(rs, 2000));
});

export const $submitInProgress = orderInProgressFx.pending;

sample({ clock: submitOrder, target: orderInProgressFx });

sample({
  clock: orderInProgressFx.doneData,
  target: [removeOrder, openRestList],
});

sample({ clock: addToOrder, target: openDishList });

sample({
  clock: removeOrder,
  source: [$orders, $restaurant] as const,
  fn([orders, restaurant]) {
    const orderIndex = orders.findIndex(
      (e) => e.restaurant === restaurant.name
    );
    if (orderIndex === -1) return orders;
    const result = [...orders];
    result.splice(orderIndex, 1);
    return result;
  },
  target: $orders,
});