import {createStore, sample} from 'effector'

import type {Restaurant} from '../types'

import {openRestaurant} from './route'
import {$restaurants} from './restaurants'

export const $restaurant = createStore<Restaurant>({
  name: '',
  description: '',
  category: [],
  dishes: [],
});

sample({
  clock: openRestaurant,
  source: $restaurants,
  fn: (restaurants, restaurantName) =>
    restaurants.find((e) => e.name === restaurantName)!,
  target: $restaurant,
});