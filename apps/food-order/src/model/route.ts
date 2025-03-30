import { createStore, createEvent, sample, combine } from 'effector';

import type { Route, RestaurantRoute } from '../types';

export const $route = createStore<Route>({ name: 'restaurants' });

export const openRestaurant = createEvent<string>();
export const openRestList = createEvent();
export const openDish = createEvent<string>();
export const openOrder = createEvent<void>();
export const openDishList = createEvent();

export const $restaurantName = combine($route, (route) => {
  switch (route.name) {
    case 'menu':
    case 'dish':
    case 'order':
      return route.restaurant;
    default:
      return '';
  }
});

export const $dishName = combine($route, (route) => {
  switch (route.name) {
    case 'dish':
      return route.dish;
    default:
      return '';
  }
});

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
