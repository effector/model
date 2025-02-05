import {createStore, sample} from 'effector'

import type {Dish} from '../types'

import {openDish} from './route'
import {$restaurant} from './restaurant'

export const $dish = createStore<Dish>({
  name: '',
  description: '',
  price: 0,
  additives: [],
});

sample({
  source: $restaurant,
  clock: openDish,
  fn: ({ dishes }, dish) => dishes.find((e) => e.name === dish)!,
  target: $dish,
});