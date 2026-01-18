import {
  model,
  define,
  keyval,
  serialize,
  create,
} from '@effector-model/core-experimental';
import { createFactory, invoke } from '@withease/factories';
import {
  createStore,
  createEvent,
  sample,
  createEffect,
  Store,
} from 'effector';
import { ProductData } from '../types';
import { createCartModel, productUnion, CartItem } from './cart';

// --- Types ---
export type ScreenName =
  | 'restaurants'
  | 'menu'
  | 'product'
  | 'cart'
  | 'congrats'
  | 'globalCart';

export interface ProductScreenParams {
  mode: 'preview' | 'ingredients';
  draftId: string;
  returnTo: 'menu' | 'cart';
  editId?: string;
}

export interface MenuScreenParams {
  restaurantId: string;
}

export interface AppParams {
  restaurantId?: string;
  returnToRestaurantId?: string;
  mode?: 'preview' | 'ingredients';
  draftId?: string;
  returnTo?: ScreenName;
  editId?: string;
}

const createAppImpl = () => {
  // --- Dependencies ---
  const {
    cartModel,
    receiptModel,
    cartApi,
    $totalPrice,
    $receiptTotalPrice,
    copyCartToReceipt,
    $cartByRestaurant,
    $globalCartStats,
  } = invoke(createCartModel);

  // --- Draft Model (Internal) ---
  const draftModel = keyval({
    model: productUnion,
  });

  // --- Effects ---
  const clearRestaurantCartFx = createEffect(
    ({
      items,
      instances,
      restaurantId,
    }: {
      items: string[];
      instances: Record<string, unknown>;
      restaurantId: string;
    }) => {
      items.forEach((id) => {
        if (!restaurantId) {
          cartModel.remove(id);
          return;
        }
        const instance = instances[id] as any; // keeping internal cast for now, will fix with Cart types
        const rId = instance?.facets?.product?.$restaurantId?.getState();

        if (rId === restaurantId) {
          cartModel.remove(id);
        }
      });
    },
  );

  // --- Public Events (Controller) ---
  const selectRestaurant = createEvent<string>();
  const openProduct = createEvent<ProductData>();
  const openCart = createEvent<{ restaurantId?: string } | void>();
  const openGlobalCart = createEvent();
  const globalCartBack = createEvent();
  const menuBack = createEvent();
  const toggleProductMode = createEvent();
  const addToCart = createEvent();
  const closeProduct = createEvent();
  const checkout = createEvent();
  const cartBack = createEvent();
  const editItem = createEvent<string>();
  const finishOrder = createEvent();

  // --- Internal Logic Events ---
  const updateState = createEvent<{ screen: ScreenName; params: AppParams }>();
  const updateStateWithDraft = createEvent<{
    screen: ScreenName;
    params: AppParams;
    draft: CartItem;
  }>();
  const commitDraft = createEvent<{
    item: CartItem;
    editId?: string;
    returnTo: ScreenName;
    restaurantId?: string;
  }>();

  // --- App Model Definition ---
  const appModel = model({
    input: {
      $screen: define.store<ScreenName>('restaurants'),
      $params: define.store<AppParams>({}),
      $activeScreen: define.store<ScreenName>('restaurants'),
      $context: define.store<unknown>({}),
    },
    variant: {
      source: (input: any) => input.$screen,
      cases: {
        restaurants: (s: ScreenName) => s === 'restaurants',
        menu: (s: ScreenName) => s === 'menu',
        product: (s: ScreenName) => s === 'product',
        cart: (s: ScreenName) => s === 'cart',
        congrats: (s: ScreenName) => s === 'congrats',
        globalCart: (s: ScreenName) => s === 'globalCart',
      },
    },
    impl: {
      restaurants: (input) => {
        sample({
          clock: selectRestaurant,
          fn: (id) => ({
            screen: 'menu' as const,
            params: { restaurantId: id },
          }),
          target: updateState,
        });

        sample({
          clock: openGlobalCart,
          fn: () => ({ screen: 'globalCart' as const, params: {} }),
          target: updateState,
        });
      },
      globalCart: (input) => {
        sample({
          clock: globalCartBack,
          fn: () => ({ screen: 'restaurants' as const, params: {} }),
          target: updateState,
        });

        sample({
          clock: openCart,
          fn: (payload) => ({
            screen: 'cart' as const,
            params: { returnToRestaurantId: payload?.restaurantId },
          }),
          target: updateState,
        });
      },
      menu: (input) => {
        sample({
          clock: openProduct,
          source: input.$params,
          fn: (
            params,
            payload,
          ): {
            screen: ScreenName;
            params: AppParams;
            draft: CartItem;
          } => {
            const data = payload;
            const model = (productUnion.models as any)[data.type];
            const state = model && model.init ? model.init(data) : {};
            return {
              screen: 'product' as const,
              params: {
                mode: 'preview',
                draftId: 'draft',
                returnTo: 'menu',
                restaurantId: params.restaurantId,
              },
              draft: {
                id: 'draft',
                variant: data.type,
                input: data,
                state: state as Record<string, unknown>,
              },
            };
          },
          target: updateStateWithDraft,
        });

        sample({
          clock: openCart,
          source: input.$params,
          fn: (params, payload) => ({
            screen: 'cart' as const,
            params: {
              returnToRestaurantId:
                payload?.restaurantId || params.restaurantId,
            },
          }),
          target: updateState,
        });

        sample({
          clock: menuBack,
          fn: () => ({ screen: 'restaurants' as const, params: {} }),
          target: updateState,
        });
      },
      product: (input) => {
        sample({
          clock: toggleProductMode,
          source: input.$params,
          fn: (params) => ({
            ...params,
            mode: (params.mode === 'preview' ? 'ingredients' : 'preview') as
              | 'preview'
              | 'ingredients',
          }),
          target: input.$params,
        });

        sample({
          clock: addToCart,
          source: {
            params: input.$params,
            draft: (draftModel as any).$instances as Store<
              Record<string, unknown>
            >,
          },
          filter: ({
            params,
            draft,
          }: {
            params: AppParams;
            draft: Record<string, unknown>;
          }) => !!params.draftId && !!draft[params.draftId],
          fn: ({
            params,
            draft,
          }: {
            params: AppParams;
            draft: Record<string, unknown>;
          }): {
            item: CartItem;
            editId?: string;
            returnTo: ScreenName;
            restaurantId?: string;
          } => {
            const instance = draft[params.draftId!];
            const snapshot = serialize(instance) as any;
            console.log('[app] Serialized draft for cart:', snapshot);

            return {
              item: {
                id: params.editId || crypto.randomUUID(),
                variant:
                  ((instance as any)._variant as string) ||
                  (snapshot.activeVariant as string),
                input: (snapshot.extra || snapshot.input) as ProductData,
                state: snapshot.facets as Record<string, unknown>,
              },
              editId: params.editId,
              returnTo: params.returnTo!,
              restaurantId: params.restaurantId,
            };
          },
          target: commitDraft,
        });

        sample({
          clock: closeProduct,
          source: input.$params,
          fn: (params) => ({
            screen: params.returnTo!,
            params: { restaurantId: params.restaurantId },
          }),
          target: updateState,
        });

        return {
          item: draftModel.getItem('draft'),
        };
      },
      cart: (input) => {
        sample({
          clock: cartBack,
          source: input.$params,
          fn: (params) => ({
            screen: 'menu' as const,
            params: { restaurantId: params.returnToRestaurantId },
          }),
          target: updateState,
        });

        sample({
          clock: editItem,
          source: {
            cart: (cartModel as any).$instances as Store<
              Record<string, unknown>
            >,
            params: input.$params,
          },
          filter: ({ cart }: { cart: Record<string, unknown> }, id: string) =>
            !!cart[id],
          fn: (
            {
              cart,
              params,
            }: { cart: Record<string, unknown>; params: AppParams },
            id: string,
          ): {
            screen: ScreenName;
            params: AppParams;
            draft: CartItem;
          } => {
            console.log('[app] editItem triggered for', id);
            const item = cart[id];
            const snapshot = serialize(item) as any;

            return {
              screen: 'product' as const,
              params: {
                mode: 'preview',
                draftId: 'draft',
                returnTo: 'cart',
                editId: id,
                restaurantId: params.returnToRestaurantId,
              },
              draft: {
                id: 'draft',
                variant:
                  ((item as any)._variant as string) ||
                  (snapshot.activeVariant as string),
                input: (snapshot.extra || snapshot.input) as ProductData,
                state: snapshot.facets as Record<string, unknown>,
              },
            };
          },
          target: updateStateWithDraft,
        });

        sample({
          clock: checkout,
          source: input.$params,
          fn: (params) => ({
            restaurantId: params.returnToRestaurantId,
          }),
          target: copyCartToReceipt,
        });

        sample({
          clock: checkout,
          source: {
            items: cartModel.$items,
            instances: (cartModel as any).$instances as Store<
              Record<string, unknown>
            >,
            params: input.$params,
          },
          fn: ({
            items,
            instances,
            params,
          }: {
            items: string[];
            instances: Record<string, unknown>;
            params: AppParams;
          }) => ({
            items,
            instances,
            restaurantId: params.returnToRestaurantId!, // Ensure string
          }),
          target: clearRestaurantCartFx,
        });

        sample({
          clock: clearRestaurantCartFx.done,
          fn: () => ({ screen: 'congrats' as const, params: {} }),
          target: updateState,
        });
      },
      congrats: (input) => {
        sample({
          clock: finishOrder,
          fn: () => ({ screen: 'restaurants' as const, params: {} }),
          target: updateState,
        });
      },
    },
  });

  // --- Initialize Singleton Instance ---
  const appInstance = create(appModel);

  // --- Wiring (Using Instance) ---

  sample({
    clock: [updateState, updateStateWithDraft],
    fn: ({ screen }) => screen,
    target: appInstance.input.$screen,
  });

  sample({
    clock: [updateState, updateStateWithDraft],
    fn: ({ params }) => params,
    target: appInstance.input.$params,
  });

  sample({
    clock: updateStateWithDraft,
    fn: ({ draft }) => draft,
    target: draftModel.add,
  });

  sample({
    clock: commitDraft,
    fn: ({ item, editId, restaurantId }) => {
      const nextState = { ...(item.state as any) };
      if (!nextState.product) nextState.product = {};
      nextState.product.$restaurantId = restaurantId;

      const itemWithMeta = {
        ...item,
        state: nextState,
        input: { ...item.input, restaurantId },
      };
      if (editId) return { ...itemWithMeta, id: editId };
      return itemWithMeta;
    },
    target: cartModel.add,
  });

  sample({
    clock: commitDraft,
    fn: ({ returnTo, restaurantId }) => {
      const params: AppParams = {};
      if (returnTo === 'cart') {
        params.returnToRestaurantId = restaurantId;
      } else {
        params.restaurantId = restaurantId;
      }
      return {
        screen: returnTo,
        params,
      };
    },
    target: updateState,
  });

  return {
    appInstance,
    cartModel,
    receiptModel,
    draftModel,
    cartApi,
    stores: {
      $totalPrice,
      $receiptTotalPrice,
      $globalCartStats,
      $cartByRestaurant,
    },
    events: {
      selectRestaurant,
      openProduct,
      openCart,
      openGlobalCart,
      globalCartBack,
      menuBack,
      toggleProductMode,
      addToCart,
      closeProduct,
      checkout,
      cartBack,
      editItem,
      finishOrder,
    },
  };
};

export const createApp = createFactory(createAppImpl);

export type AppInstance = ReturnType<typeof createAppImpl>;
