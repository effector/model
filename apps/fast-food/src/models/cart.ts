import { createEvent, sample, createEffect } from 'effector';
import { createFactory } from '@withease/factories';
import { keyval, union, serialize } from '@effector-model/core-experimental';
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
      const price = item?.facets?.product?.$price || 0;
      const quantity = item?.facets?.product?.$quantity || 0;
      const isDeleted = item?.facets?.product?.$isDeleted || false;

      if (isDeleted) return sum;
      return sum + price * quantity;
    }, 0);
  });

  const $receiptTotalPrice = receiptModel.$state.map((state) => {
    return Object.values(state).reduce((sum: number, item: any) => {
      const price = item?.facets?.product?.$price || 0;
      const quantity = item?.facets?.product?.$quantity || 0;
      const isDeleted = item?.facets?.product?.$isDeleted || false;

      if (isDeleted) return sum;
      return sum + price * quantity;
    }, 0);
  });

  const copyCartToReceipt = createEvent<{
    restaurantId?: string;
  } | void>();

  const copyToReceiptFx = createEffect((items: any[]) => {
    items.forEach((item) => receiptModel.add(item));
  });

  sample({
    clock: copyCartToReceipt,
    target: receiptModel.reset,
  });

  sample({
    clock: copyCartToReceipt,
    source: {
      instances: (cartModel as any).$instances,
      variants: cartModel.$activeVariants,
    },
    fn: (
      {
        instances,
        variants,
      }: {
        instances: any;
        variants: Record<string, string | null>;
      },
      payload,
    ) => {
      const restaurantId =
        typeof payload === 'object' ? payload?.restaurantId : undefined;

      return Object.entries(instances)
        .filter(([_, instance]: [any, any]) => {
          if (!restaurantId) return true;
          const rId = instance.facets?.product?.$restaurantId?.getState();
          return rId === restaurantId;
        })
        .map(([id, instance]: [string, any]) => {
          const snapshot = serialize(instance);
          const variant =
            variants[id] || instance._variant || snapshot.activeVariant;
          const input = snapshot.extra || snapshot.input;

          return {
            id,
            variant,
            input,
            state: snapshot.facets,
            isDeleted: snapshot.facets?.product?.$isDeleted || false,
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
    (instances: any) => {
      const grouped: Record<
        string,
        { items: any[]; total: number; count: number }
      > = {};

      Object.values(instances).forEach((instance: any) => {
        const snapshot = serialize(instance);
        const state = snapshot.facets;

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
    (grouped: Record<string, any>) => {
      const total = Object.values(grouped).reduce(
        (acc: number, g: any) => acc + g.total,
        0,
      );
      const count = Object.values(grouped).reduce(
        (acc: number, g: any) => acc + g.count,
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
