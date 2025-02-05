import {
  createStore,
  combine,
  createEvent,
  createEffect,
  sample,
} from 'effector';

import { model, entityList, define } from './impl';

import {
  getAmountPerItemType,
  calculateAdditiveOrderPriceFromEntity,
} from './calculateUtils';
import { restaurantsList } from './restaurants.model';
import { $restaurant } from './restaurant';
import { openDishList, openRestaurant, openRestList } from './route';

export const addToOrder = createEvent();
const removeOrder = createEvent();

const ordersList = entityList({
  getKey: (order) => order.restaurant,
  model: model({
    props: {
      restaurant: define.store<string>(),
    },
    create({ $restaurant }) {
      const dishList = entityList({
        getKey: ({ dish }) => dish,
        model: model({
          props: {
            dish: define.store<string>(),
          },
          create({ $dish }) {
            const dishLens = restaurantsList.lens($restaurant).dishes($dish);
            const additivesList = entityList({
              getKey: ({ additive }) => additive,
              model: model({
                props: {
                  additive: define.store<string>(),
                  choice: define.store<string>(),
                  amount: define.store<number>(),
                },
                create({ $additive, $choice, $amount }) {
                  // const $additiveEntity = restaurantsList
                  //   .lens($restaurant)
                  //   .dishes($dish)
                  //   .additives($additive)
                  //   .store;
                  const $additiveEntity = dishLens.additives($additive).store;
                  const $showAmount = combine(
                    $additiveEntity,
                    $choice,
                    (additiveEntity, choice) =>
                      getAmountPerItemType(additiveEntity, choice) === 'many'
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
                    amount: $amount,
                    showAmount: $showAmount,
                    totalPrice: $totalPrice,
                  };
                },
              }),
            });
            const $totalPrice = combine(
              dishLens.price.store,
              additivesList.$items,
              (price, additives) =>
                additives.reduce(
                  (sum, additive) => sum + additive.totalPrice,
                  price
                )
            );
            return {
              additives: additivesList,
              totalPrice: $totalPrice,
            };
          },
        }),
      });
      const $totalPrice = combine(dishList.$items, (dishOrders) =>
        dishOrders.reduce((sum, dishOrder) => sum + dishOrder.totalPrice, 0)
      );
      return {
        state: {
          dishes: dishList,
          totalPrice: $totalPrice,
        },
        api: {
          addDishToOrder: dishList.edit.add,
        },
      };
    },
  }),
});

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
  clock: openRestaurant,
  fn: (restaurant) => ({ restaurant }),
  target: ordersList.edit.add,
});

// TODO why this not show an error?
// sample({
//   clock: removeOrder,
//   source: $restaurant,
//   target: ordersList.remove,
// })

sample({
  clock: removeOrder,
  source: $restaurant,
  fn: (restaurant) => restaurant.name,
  target: ordersList.edit.remove,
});
