import { createStore } from 'effector';

import { restaurants } from '../mocks';

export const $restaurants = createStore(restaurants);