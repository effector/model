import { createStore, createEvent, sample } from 'effector';
import { create } from '@effector-model/core-experimental';
import { gameModel } from './model';
import { statsModel } from '../stats/model';

// --- Входные данные для системы ---
export const $score = createStore(0);
export const updateScore = createEvent<number>();
sample({ clock: updateScore, target: $score });

// --- Создание инстансов моделей ---
export const game = create(gameModel, {
  input: { $score },
});

export const stats = create(statsModel, {
  input: { game },
});
