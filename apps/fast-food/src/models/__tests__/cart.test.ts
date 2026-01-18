import { describe, it, expect, beforeEach } from 'vitest';
import { createCartModel } from '../cart';
import { invoke } from '@withease/factories';
import { allSettled, fork } from 'effector';

// Mock crypto if needed (though cart might not use it directly, the products might)
const globalObject =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof global !== 'undefined'
      ? global
      : window;
if (!globalObject.crypto) {
  Object.defineProperty(globalObject, 'crypto', {
    value: { randomUUID: () => 'test-uuid' },
  });
}

describe('Cart Model', () => {
  let scope: any;
  let model: ReturnType<typeof createCartModel>;

  beforeEach(() => {
    scope = fork();
    model = invoke(createCartModel);
  });

  it('should initialize empty', () => {
    expect(scope.getState(model.$totalPrice)).toBe(0);
    expect(scope.getState(model.$cartByRestaurant)).toEqual({});
  });

  it('should calculate total price correctly', async () => {
    // Add item manually to cartModel (simulating app logic)
    const item1 = {
      id: 'item-1',
      variant: 'burger',
      input: {
        type: 'burger',
        basePrice: 100,
        name: 'Burger 1',
        restaurantId: 'r1',
      },
      state: {
        product: {
          $price: 100,
          $quantity: 2,
          $restaurantId: 'r1',
        },
      },
    };

    await allSettled(model.cartModel.add, {
      scope,
      params: item1,
    });

    expect(scope.getState(model.$totalPrice)).toBe(200);
  });

  it('should group items by restaurant', async () => {
    const item1 = {
      id: 'item-1',
      variant: 'burger',
      input: {
        type: 'burger',
        basePrice: 100,
        name: 'Burger 1',
        restaurantId: 'r1',
      },
      state: {
        product: {
          $price: 100,
          $quantity: 1,
          $restaurantId: 'r1',
          $name: 'Burger 1',
        },
      },
    };

    const item2 = {
      id: 'item-2',
      variant: 'burger',
      input: {
        type: 'burger',
        basePrice: 50,
        name: 'Burger 2',
        restaurantId: 'r2',
      },
      state: {
        product: {
          $price: 50,
          $quantity: 1,
          $restaurantId: 'r2',
          $name: 'Burger 2',
        },
      },
    };

    await allSettled(model.cartModel.add, { scope, params: item1 });
    await allSettled(model.cartModel.add, { scope, params: item2 });

    const grouped = scope.getState(model.$cartByRestaurant);
    expect(grouped['r1']).toBeDefined();
    expect(grouped['r1'].total).toBe(100);
    expect(grouped['r1'].items).toHaveLength(1);

    expect(grouped['r2']).toBeDefined();
    expect(grouped['r2'].total).toBe(50);
  });

  it('should copy items to receipt', async () => {
    const item1 = {
      id: 'item-1',
      variant: 'burger',
      input: {
        type: 'burger',
        basePrice: 100,
        name: 'Burger 1',
        restaurantId: 'r1',
      },
      state: { product: { $price: 100, $quantity: 1, $restaurantId: 'r1' } },
    };

    await allSettled(model.cartModel.add, { scope, params: item1 });
    await allSettled(model.copyCartToReceipt, { scope, params: undefined });

    const receiptInstances = scope.getState(
      (model.receiptModel as any).$instances,
    );
    expect(Object.keys(receiptInstances)).toHaveLength(1);
    expect(scope.getState(model.$receiptTotalPrice)).toBe(100);
  });

  it('should filter items by restaurant when copying to receipt', async () => {
    const item1 = {
      id: 'item-1',
      variant: 'burger',
      input: {
        type: 'burger',
        basePrice: 100,
        name: 'Burger 1',
        restaurantId: 'r1',
      },
      state: { product: { $price: 100, $quantity: 1, $restaurantId: 'r1' } },
    };
    const item2 = {
      id: 'item-2',
      variant: 'burger',
      input: {
        type: 'burger',
        basePrice: 100,
        name: 'Burger 2',
        restaurantId: 'r2',
      },
      state: { product: { $price: 100, $quantity: 1, $restaurantId: 'r2' } },
    };

    await allSettled(model.cartModel.add, { scope, params: item1 });
    await allSettled(model.cartModel.add, { scope, params: item2 });

    await allSettled(model.copyCartToReceipt, {
      scope,
      params: { restaurantId: 'r1' },
    });

    const receiptInstances = scope.getState(
      (model.receiptModel as any).$instances,
    );
    expect(Object.keys(receiptInstances)).toHaveLength(1);
    expect(receiptInstances['item-1']).toBeDefined();
    expect(receiptInstances['item-2']).toBeUndefined();
  });
});
