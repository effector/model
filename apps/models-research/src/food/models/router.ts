import { createStore, createEvent, sample } from 'effector';
import {
  openConfigurator,
  closeConfigurator,
  submitConfigurator,
} from './draft';

export type Screen =
  | 'restaurant'
  | 'menu'
  | 'cart'
  | 'configurator'
  | 'ingredients'
  | 'success';

export const navigate = createEvent<Screen>();
export const $screen = createStore<Screen>('restaurant');
export const $prevScreen = createStore<Screen>('restaurant');

sample({
  clock: navigate,
  source: $screen,
  fn: (prev, next) => prev,
  target: $prevScreen,
});

sample({
  clock: navigate,
  target: $screen,
});

// Auto-navigation
sample({
  clock: openConfigurator,
  fn: () => 'configurator' as const,
  target: navigate,
});

sample({
  clock: [closeConfigurator, submitConfigurator],
  source: $prevScreen,
  target: navigate,
});
