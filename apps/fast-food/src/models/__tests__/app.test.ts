import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createApp } from '../app';
import { invoke } from '@withease/factories';
import { allSettled, fork } from 'effector';

// Mock crypto.randomUUID
const globalObject =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
      ? global
      : window;

if (!globalObject.crypto) {
  Object.defineProperty(globalObject, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid',
    },
  });
} else if (!globalObject.crypto.randomUUID) {
  Object.defineProperty(globalObject.crypto, 'randomUUID', {
    value: () => 'test-uuid',
  });
}

describe('App Model', () => {
  let scope: any;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    scope = fork();
    app = invoke(createApp);
  });

  it('should initialize with default screen "restaurants"', () => {
    expect(scope.getState(app.appInstance.input.$screen)).toBe('restaurants');
  });

  it('should navigate to menu when a restaurant is selected', async () => {
    await allSettled(app.events.selectRestaurant, {
      scope,
      params: 'restaurant-1',
    });

    expect(scope.getState(app.appInstance.input.$screen)).toBe('menu');
    expect(scope.getState(app.appInstance.input.$params)).toEqual({
      restaurantId: 'restaurant-1',
    });
  });

  it('should open global cart', async () => {
    await allSettled(app.events.openGlobalCart, {
      scope,
    });

    expect(scope.getState(app.appInstance.input.$screen)).toBe('globalCart');
  });

  it('should navigate back from global cart', async () => {
    await allSettled(app.events.openGlobalCart, { scope });
    await allSettled(app.events.globalCartBack, { scope });

    expect(scope.getState(app.appInstance.input.$screen)).toBe('restaurants');
  });

  it('should open product and create a draft', async () => {
    const productData = {
      type: 'burger' as const,
      name: 'Test Burger',
      description: 'Delicious burger',
      basePrice: 100,
      defaultIngredients: [],
      extraIngredients: [],
    };

    await allSettled(app.events.selectRestaurant, {
      scope,
      params: 'restaurant-1',
    });

    await allSettled(app.events.openProduct, {
      scope,
      params: { ...productData, restaurantId: 'restaurant-1' },
    });

    expect(scope.getState(app.appInstance.input.$screen)).toBe('product');

    // Verify draft creation
    const draftInstances = scope.getState((app.draftModel as any).$instances);
    const draft = draftInstances['draft'];
    expect(draft).toBeDefined();
    expect(draft.facets.product.$name.getState()).toBe('Test Burger');
  });

  it('should add product to cart', async () => {
    const productData = {
      type: 'burger' as const,
      name: 'Test Burger',
      description: 'Delicious burger',
      basePrice: 100,
      defaultIngredients: [],
      extraIngredients: [],
    };

    // 1. Navigate to product
    await allSettled(app.events.selectRestaurant, {
      scope,
      params: 'restaurant-1',
    });

    await allSettled(app.events.openProduct, {
      scope,
      params: { ...productData, restaurantId: 'restaurant-1' },
    });

    // 2. Add to cart
    await allSettled(app.events.addToCart, { scope });

    // 3. Verify it returns to menu
    expect(scope.getState(app.appInstance.input.$screen)).toBe('menu');

    // 4. Verify item is in cart
    const cartInstances = scope.getState((app.cartModel as any).$instances);
    const cartItems = Object.values(cartInstances);
    expect(cartItems).toHaveLength(1);
    expect((cartItems[0] as any).facets.product.$name.getState()).toBe(
      'Test Burger',
    );
  });

  it('should handle checkout flow', async () => {
    // 1. Add item to cart
    const productData = {
      type: 'burger' as const,
      name: 'B1',
      description: 'Desc',
      basePrice: 100,
      defaultIngredients: [],
      extraIngredients: [],
    };
    await allSettled(app.events.selectRestaurant, { scope, params: 'r1' });
    await allSettled(app.events.openProduct, {
      scope,
      params: { ...productData, restaurantId: 'r1' },
    });
    await allSettled(app.events.addToCart, { scope });

    // 2. Open cart
    await allSettled(app.events.openCart, {
      scope,
      params: { restaurantId: 'r1' },
    });
    expect(scope.getState(app.appInstance.input.$screen)).toBe('cart');

    // 3. Checkout
    await allSettled(app.events.checkout, { scope });

    // 4. Verify receipt has item
    const receiptInstances = scope.getState(
      (app.receiptModel as any).$instances,
    );
    expect(Object.keys(receiptInstances)).toHaveLength(1);

    // 5. Verify cart is cleared for restaurant (async effect)
    // Wait for effect to finish
    await new Promise((r) => setTimeout(r, 0));

    // Check screen is congrats
    expect(scope.getState(app.appInstance.input.$screen)).toBe('congrats');

    // 6. Finish order
    await allSettled(app.events.finishOrder, { scope });
    expect(scope.getState(app.appInstance.input.$screen)).toBe('restaurants');
  });

  it('should handle editing item from cart', async () => {
    // 1. Add item
    const productData = {
      type: 'burger' as const,
      name: 'B1',
      description: 'Desc',
      basePrice: 100,
      defaultIngredients: [],
      extraIngredients: [],
    };
    await allSettled(app.events.selectRestaurant, { scope, params: 'r1' });
    await allSettled(app.events.openProduct, {
      scope,
      params: { ...productData, restaurantId: 'r1' },
    });
    await allSettled(app.events.addToCart, { scope });

    const cartInstances = scope.getState((app.cartModel as any).$instances);
    const itemId = Object.keys(cartInstances)[0];

    // 2. Edit item
    await allSettled(app.events.openCart, {
      scope,
      params: { restaurantId: 'r1' },
    });
    await allSettled(app.events.editItem, { scope, params: itemId });

    expect(scope.getState(app.appInstance.input.$screen)).toBe('product');
    const params = scope.getState(app.appInstance.input.$params);
    expect(params.returnTo).toBe('cart');
    expect(params.editId).toBe(itemId);

    // 3. Save changes (add to cart again, which updates existing because of editId)
    await allSettled(app.events.addToCart, { scope });

    expect(scope.getState(app.appInstance.input.$screen)).toBe('cart');
    // Verify we still have 1 item (updated), not 2
    const newCartInstances = scope.getState((app.cartModel as any).$instances);
    expect(Object.keys(newCartInstances)).toHaveLength(1);
  });
});
