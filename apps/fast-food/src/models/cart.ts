import { createEvent, sample, createEffect } from 'effector';
import { createFactory } from '@withease/factories';
import { keyval, union, serialize } from '@effector-model/core-experimental';
import { ProductData } from '../types';
import { pizzaModel } from './products/pizza';
import { drinkModel } from './products/drink';
import { coffeeModel } from './products/coffee';
import { cocktailModel } from './products/cocktail';
import { sauceModel } from './products/sauce';
import { burgerModel } from './products/burger';
import { twisterModel } from './products/twister';
import { bucketModel } from './products/bucket';
import { snackModel } from './products/snack';

export const productUnion = union({
  pizza: pizzaModel,
  drink: drinkModel,
  coffee: coffeeModel,
  cocktail: cocktailModel,
  sauce: sauceModel,
  burger: burgerModel,
  twister: twisterModel,
  bucket: bucketModel,
  snack: snackModel,
});

import { Store } from 'effector';

export type ProductInstance =
  (typeof productUnion.models)[keyof typeof productUnion.models]['_InstanceType'];

export type PizzaInstance = (typeof productUnion.models.pizza)['_InstanceType'];
export type DrinkInstance = (typeof productUnion.models.drink)['_InstanceType'];
export type CoffeeInstance =
  (typeof productUnion.models.coffee)['_InstanceType'];
export type CocktailInstance =
  (typeof productUnion.models.cocktail)['_InstanceType'];
export type SauceInstance = (typeof productUnion.models.sauce)['_InstanceType'];
export type BurgerInstance =
  (typeof productUnion.models.burger)['_InstanceType'];
export type TwisterInstance =
  (typeof productUnion.models.twister)['_InstanceType'];
export type BucketInstance =
  (typeof productUnion.models.bucket)['_InstanceType'];
export type SnackInstance = (typeof productUnion.models.snack)['_InstanceType'];

export interface ProductState {
  product?: {
    $price?: number;
    $quantity?: number;
    $isDeleted?: boolean;
    $name?: string;
    $restaurantId?: string;
  };
}

import { EventCallable } from 'effector';

interface CommonProductFacet {
  $price: Store<number>;
  $quantity: Store<number>;
  $isDeleted: Store<boolean>;
  $restaurantId: Store<string>;
  $name: Store<string>;
  increment: EventCallable<void>;
  decrement: EventCallable<void>;
}

export interface CartItem {
  id: string;
  variant: string;
  input: ProductData;
  state: Record<string, unknown>;
  isDeleted?: boolean;
}

const createCartModelImpl = () => {
  const cartModel = keyval({
    model: productUnion,
  });

  const receiptModel = keyval({
    model: productUnion,
  });

  const cartApi = cartModel.getItem(createEvent<{ id: string }>());

  const $totalPrice = cartModel.$state.map((state) => {
    return Object.values(state).reduce((sum: number, item: any) => {
      const price = (item as any)?.facets?.product?.$price || 0;
      const quantity = item?.facets?.product?.$quantity || 0;
      const isDeleted = item?.facets?.product?.$isDeleted || false;

      if (isDeleted) return sum;
      return sum + price * quantity;
    }, 0);
  });

  const $receiptTotalPrice = receiptModel.$state.map((state) => {
    return Object.values(state).reduce((sum: number, item: any) => {
      const price = (item as any)?.facets?.product?.$price || 0;
      const quantity = item?.facets?.product?.$quantity || 0;
      const isDeleted = item?.facets?.product?.$isDeleted || false;

      if (isDeleted) return sum;
      return sum + price * quantity;
    }, 0);
  });

  const copyCartToReceipt = createEvent<{
    restaurantId?: string;
  } | void>();

  const copyToReceiptFx = createEffect((items: CartItem[]) => {
    items.forEach((item) => receiptModel.add(item));
  });

  sample({
    clock: copyCartToReceipt,
    target: receiptModel.reset,
  });

  sample({
    clock: copyCartToReceipt,
    source: {
      instances: (cartModel as any).$instances as Store<
        Record<string, unknown>
      >,
      variants: cartModel.$activeVariants,
    },
    fn: (
      {
        instances,
        variants,
      }: {
        instances: Record<string, unknown>;
        variants: Record<string, string | null>;
      },
      payload,
    ) => {
      const restaurantId =
        typeof payload === 'object' ? payload?.restaurantId : undefined;

      return Object.entries(instances)
        .filter(([_, instance]) => {
          if (!restaurantId) return true;
          const inst = instance as ProductInstance;
          const product = inst.facets.product as unknown as CommonProductFacet;
          const rId = product.$restaurantId.getState();
          return rId === restaurantId;
        })
        .map(([id, instance]) => {
          const inst = instance as ProductInstance;
          const snapshot = serialize(inst) as {
            activeVariant: string;
            extra: unknown;
            input: unknown;
            facets: Record<string, unknown>;
          };
          const variant =
            variants[id] ||
            (inst as unknown as { _variant: string })._variant ||
            snapshot.activeVariant;
          const input = (snapshot.extra || snapshot.input) as ProductData;

          return {
            id,
            variant,
            input,
            state: snapshot.facets,
            isDeleted:
              (snapshot.facets as ProductState).product?.$isDeleted || false,
          };
        })
        .filter((item) => !item.isDeleted)
        .map(({ id, variant, input, state }) => ({
          id,
          variant,
          input,
          state,
        }));
    },
    target: copyToReceiptFx,
  });

  const $cartByRestaurant = (cartModel as any).$instances.map(
    (instances: Record<string, unknown>) => {
      const grouped: Record<
        string,
        { items: any[]; total: number; count: number }
      > = {};

      Object.values(instances).forEach((instance) => {
        const inst = instance as ProductInstance;
        const snapshot = serialize(inst) as {
          facets: Record<string, unknown>;
        };
        const state = snapshot.facets as ProductState;

        // Skip deleted items
        if (state.product?.$isDeleted) return;

        // Get Restaurant ID
        const rId = state.product?.$restaurantId;
        if (!rId) return;

        if (!grouped[rId]) grouped[rId] = { items: [], total: 0, count: 0 };

        const price = state.product?.$price || 0;
        const quantity = state.product?.$quantity || 0;
        const itemTotal = price * quantity;

        grouped[rId].items.push({
          ...snapshot,
          name: state.product?.$name || 'Unknown',
        });
        grouped[rId].total += itemTotal;
        grouped[rId].count += quantity;
      });

      return grouped;
    },
  );

  const $globalCartStats = $cartByRestaurant.map(
    (grouped: Record<string, { total: number; count: number }>) => {
      const total = Object.values(grouped).reduce(
        (acc: number, g) => acc + g.total,
        0,
      );
      const count = Object.values(grouped).reduce(
        (acc: number, g) => acc + g.count,
        0,
      );
      const cartsCount = Object.keys(grouped).length;
      return { total, count, cartsCount };
    },
  );

  return {
    cartModel,
    receiptModel,
    cartApi,
    $totalPrice,
    $receiptTotalPrice,
    copyCartToReceipt,
    $cartByRestaurant,
    $globalCartStats,
  };
};

export const createCartModel = createFactory(createCartModelImpl);

export type CartInstance = ReturnType<typeof createCartModelImpl>;
