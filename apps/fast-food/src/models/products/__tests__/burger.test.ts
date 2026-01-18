import { describe, it, expect, beforeEach } from 'vitest';
import { burgerModel } from '../burger';
import { create } from '@effector-model/core-experimental';
import { createStore, fork, allSettled } from 'effector';

describe('Burger Model', () => {
  let scope: any;

  beforeEach(() => {
    scope = fork();
  });

  it('should initialize with base price', () => {
    const instance = create(burgerModel, {
      input: {
        type: createStore('burger'),
        basePrice: createStore(100),
        name: createStore('Test Burger'),
        extraIngredients: createStore([]),
        defaultIngredients: createStore([]),
      },
    });

    expect(scope.getState(instance.facets.product.$price)).toBe(100);
  });

  it('should add extra ingredients cost', async () => {
    const extraIngredients = [
      { id: 'cheese', name: 'Cheese', price: 20 },
      { id: 'bacon', name: 'Bacon', price: 30 },
    ];

    const instance = create(burgerModel, {
      input: {
        type: createStore('burger'),
        basePrice: createStore(100),
        name: createStore('Test Burger'),
        extraIngredients: createStore(extraIngredients),
        defaultIngredients: createStore([]),
      },
    });

    // Select Cheese
    await allSettled(instance.facets.ingredients.toggleExtra, {
      scope,
      params: 'cheese',
    });

    expect(scope.getState(instance.facets.product.$price)).toBe(120);

    // Select Bacon
    await allSettled(instance.facets.ingredients.toggleExtra, {
      scope,
      params: 'bacon',
    });

    expect(scope.getState(instance.facets.product.$price)).toBe(150);

    // Deselect Cheese
    await allSettled(instance.facets.ingredients.toggleExtra, {
      scope,
      params: 'cheese',
    });

    expect(scope.getState(instance.facets.product.$price)).toBe(130);
  });

  it('should handle removed defaults (no price change)', async () => {
    const defaultIngredients = [{ id: 'onion', name: 'Onion' }];

    const instance = create(burgerModel, {
      input: {
        type: createStore('burger'),
        basePrice: createStore(100),
        name: createStore('Test Burger'),
        extraIngredients: createStore([]),
        defaultIngredients: createStore(defaultIngredients),
      },
    });

    await allSettled(instance.facets.ingredients.toggleDefault, {
      scope,
      params: 'onion',
    });

    // Price should remain 100
    expect(scope.getState(instance.facets.product.$price)).toBe(100);

    // Check if it is marked as removed
    const removed = scope.getState(
      instance.facets.ingredients.$removedDefaults,
    );
    expect(removed['onion']).toBe(true);
  });
});
