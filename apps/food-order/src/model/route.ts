import { createStore, createEvent, sample } from 'effector';

import type { Route, RestaurantRoute } from '../types';

export const $route = createStore<Route>({ name: 'restaurants' });

export const openRestaurant = createEvent<string>();
export const openRestList = createEvent();
export const openDish = createEvent<string>();
export const openOrder = createEvent<void>();
export const openDishList = createEvent();

const isRestaurantRoute = (route: Route): route is RestaurantRoute =>
  !!(route as any).restaurant;

sample({
  clock: openDish,
  source: $route,
  filter: isRestaurantRoute,
  fn: ({ restaurant }: RestaurantRoute, dish) => ({
    name: 'dish' as const,
    restaurant,
    dish,
  }),
  target: $route,
});

sample({
  clock: openOrder,
  source: $route,
  filter: isRestaurantRoute,
  fn: ({ restaurant }: RestaurantRoute) => ({
    name: 'order' as const,
    restaurant,
  }),
  target: $route,
});

sample({
  clock: openDishList,
  source: $route,
  filter: isRestaurantRoute,
  fn: ({ restaurant }: RestaurantRoute) => ({
    name: 'menu' as const,
    restaurant,
  }),
  target: $route,
});

sample({
  clock: openRestaurant,
  fn: (restaurant) => ({ name: 'menu' as const, restaurant }),
  target: $route,
});

sample({
  clock: openRestList,
  fn: () => ({ name: 'restaurants' as const }),
  target: $route,
});
