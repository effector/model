import { combine, createStore, createEvent, sample } from 'effector';
import type { DishOrder, Order } from '../types';

import { model, entityList, define } from './impl';

import { openDish } from './route';
import { $restaurant } from './restaurant';
import { $dish } from './dish';
import { $orders, $order, addToOrder } from './orders';
import { calculateAdditiveOrderPriceFromEntity, calculateDishOrderPrice } from './calculateUtils';

const additivesList = entityList({
  getKey: ({ additive }) => additive,
  model: model({
    props: {
      additive: define.store<string>(),
      choice: define.store<string>(),
      amount: define.store<number>(),
    },
    create({$additive, $choice, $amount}) {
      const $additiveEntity = combine(
        $dish,
        $additive,
        ({ additives }, additiveName) =>
          additives.find((e) => e.name === additiveName)!
      );
      const $totalPrice = combine(
        $additiveEntity,
        $choice,
        $amount,
        (additiveEntity, choice, amount) =>
          calculateAdditiveOrderPriceFromEntity(
            additiveEntity,
            choice,
            amount
          )
      );
      return {
        totalPrice: $totalPrice,
      }
    },
  })
})

export const addAdditive = createEvent<{ additive: string; choice: string }>();
export const removeAdditive = createEvent<string>();

export const $currentDishOrder = createStore<DishOrder>({
  dish: '',
  additives: [],
});

export const $currentDishTotalPrice = combine(
  $dish,
  $currentDishOrder,
  (dish, order) => calculateDishOrderPrice(dish, order)
);

export const $dishAdditives = combine($dish, ({ additives }) => additives);

export const $isInOrder = combine(
  $order,
  $currentDishOrder,
  (order, dishOrder) => !!order.dishes.find((e) => e.dish === dishOrder.dish)
);

sample({
  clock: addToOrder,
  source: [$orders, $restaurant, $currentDishOrder] as const,
  fn([orders, restaurant, dishOrder]) {
    const orderIndex = orders.findIndex(
      (e) => e.restaurant === restaurant.name
    );
    const order: Order =
      orderIndex !== -1
        ? orders[orderIndex]
        : {
            restaurant: restaurant.name,
            dishes: [],
          };
    const dishOrderIndex = order.dishes.findIndex(
      (e) => e.dish === dishOrder.dish
    );
    const resultOrder = {
      ...order,
      dishes: [...order.dishes],
    };
    if (dishOrderIndex === -1) {
      resultOrder.dishes.push(dishOrder);
    } else {
      resultOrder.dishes[dishOrderIndex] = dishOrder;
    }
    const result = [...orders];
    if (orderIndex === -1) {
      result.push(resultOrder);
    } else {
      result[orderIndex] = resultOrder;
    }
    return result;
  },
  target: $orders,
});

sample({
  source: $order,
  clock: openDish,
  fn: (order, dish) =>
    order.dishes.find((e) => e.dish === dish) ?? { dish, additives: [] },
  target: $currentDishOrder,
});

sample({
  source: $currentDishOrder,
  clock: addAdditive,
  fn(order, { additive, choice }) {
    const additiveOrderIndex = order.additives.findIndex(
      (e) => e.additive === additive
    );
    const additiveOrder =
      additiveOrderIndex === -1
        ? { additive, choice, amount: 0 }
        : { ...order.additives[additiveOrderIndex] };
    if (additiveOrder.choice !== choice) {
      additiveOrder.choice = choice;
      additiveOrder.amount = 1;
    } else {
      additiveOrder.amount += 1;
    }
    const resultAdditives = [...order.additives];
    if (additiveOrderIndex === -1) {
      resultAdditives.push(additiveOrder);
    } else {
      resultAdditives[additiveOrderIndex] = additiveOrder;
    }
    return {
      ...order,
      additives: resultAdditives,
    };
  },
  target: $currentDishOrder,
});

sample({
  source: $currentDishOrder,
  clock: removeAdditive,
  fn(order, additive) {
    const additiveOrderIndex = order.additives.findIndex(
      (e) => e.additive === additive
    );
    if (additiveOrderIndex === -1) return order;
    const additiveOrder = { ...order.additives[additiveOrderIndex] };
    const resultAdditives = [...order.additives];
    if (additiveOrder.amount === 1) {
      resultAdditives.splice(additiveOrderIndex, 1);
    } else {
      additiveOrder.amount -= 1;
      resultAdditives[additiveOrderIndex] = additiveOrder;
    }
    return {
      ...order,
      additives: resultAdditives,
    };
  },
  target: $currentDishOrder,
});
