import {
  model,
  define,
  keyval,
  serialize,
  create,
} from '@effector-model/core-experimental';
import { createStore, createEvent, sample, createEffect } from 'effector';
import { cartModel, productUnion, copyCartToReceipt } from './cart';

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

// --- Draft Model (Internal) ---
export const draftModel = keyval({
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
    instances: any;
    restaurantId: string;
  }) => {
    items.forEach((id) => {
      if (
        !restaurantId ||
        instances[id]?.input?.restaurantId === restaurantId
      ) {
        cartModel.remove(id);
      }
    });
  },
);

// --- Public Events (Controller) ---
export const selectRestaurant = createEvent<string>();
export const openProduct = createEvent<any>();
export const openCart = createEvent<{ restaurantId?: string } | void>();
export const openGlobalCart = createEvent();
export const globalCartBack = createEvent();
export const menuBack = createEvent();
export const toggleProductMode = createEvent();
export const addToCart = createEvent();
export const closeProduct = createEvent();
export const checkout = createEvent();
export const cartBack = createEvent();
export const editItem = createEvent<string>();
export const finishOrder = createEvent();

// --- Internal Logic Events ---
const updateState = createEvent<{ screen: ScreenName; params: any }>();
const updateStateWithDraft = createEvent<{
  screen: ScreenName;
  params: any;
  draft: any;
}>();
const commitDraft = createEvent<{
  item: any;
  editId?: string;
  returnTo: ScreenName;
  restaurantId?: string;
}>();

// --- App Model Definition ---
export const appModel = model({
  input: {
    $screen: define.store<ScreenName>('restaurants'),
    $params: define.store<any>({}),
    $activeScreen: define.store<ScreenName>('restaurants'),
    $context: define.store<any>({}),
  },
  variant: {
    source: (input: any) => input.$screen,
    cases: {
      restaurants: (s: any) => s === 'restaurants',
      menu: (s: any) => s === 'menu',
      product: (s: any) => s === 'product',
      cart: (s: any) => s === 'cart',
      congrats: (s: any) => s === 'congrats',
      globalCart: (s: any) => s === 'globalCart',
    },
  },
  impl: {
    restaurants: (input: any) => {
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
    globalCart: (input: any) => {
      sample({
        clock: globalCartBack,
        fn: () => ({ screen: 'restaurants' as const, params: {} }),
        target: updateState,
      });

      sample({
        clock: openCart,
        fn: (payload: any) => ({
          screen: 'cart' as const,
          params: { returnToRestaurantId: payload?.restaurantId },
        }),
        target: updateState,
      });
    },
    menu: (input: any) => {
      sample({
        clock: openProduct,
        source: input.$params,
        fn: (params: any, payload: any) => {
          const data = payload.data || payload;
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
              state: state,
            },
          };
        },
        target: updateStateWithDraft,
      });

      sample({
        clock: openCart,
        source: input.$params,
        fn: (params: any, payload: any) => ({
          screen: 'cart' as const,
          params: {
            returnToRestaurantId: payload?.restaurantId || params.restaurantId,
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
    product: (input: any) => {
      sample({
        clock: toggleProductMode,
        source: input.$params,
        fn: (params: any) => ({
          ...params,
          mode: params.mode === 'preview' ? 'ingredients' : 'preview',
        }),
        target: input.$params,
      });

      sample({
        clock: addToCart,
        source: {
          params: input.$params,
          draft: (draftModel as any).$instances,
        },
        fn: ({ params, draft }: any) => {
          const instance = draft[params.draftId];
          if (!instance) return null;

          const snapshot = serialize(instance);
          console.log('[app] Serialized draft for cart:', snapshot);

          return {
            item: {
              id: params.editId || crypto.randomUUID(),
              variant: instance._variant || snapshot.activeVariant,
              input: snapshot.extra || snapshot.input,
              state: snapshot.facets,
            },
            editId: params.editId,
            returnTo: params.returnTo,
            restaurantId: params.restaurantId,
          };
        },
        filter: (payload: any): payload is any => !!payload,
        target: commitDraft,
      } as any);

      sample({
        clock: closeProduct,
        source: input.$params,
        fn: (params: any) => ({
          screen: params.returnTo,
          params: { restaurantId: params.restaurantId },
        }),
        target: updateState,
      });

      return {
        item: draftModel.getItem('draft'),
      };
    },
    cart: (input: any) => {
      sample({
        clock: cartBack,
        source: input.$params,
        fn: (params: any) => ({
          screen: 'menu' as const,
          params: { restaurantId: params.returnToRestaurantId },
        }),
        target: updateState,
      });

      sample({
        clock: editItem,
        source: {
          cart: (cartModel as any).$instances,
          params: input.$params,
        },
        fn: ({ cart, params }: any, id: string) => {
          console.log('[app] editItem triggered for', id);
          const item = cart[id];
          if (!item) throw new Error('Item not found');
          const snapshot = serialize(item);

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
              variant: item._variant || snapshot.activeVariant,
              input: snapshot.extra || snapshot.input,
              state: snapshot.facets,
            },
          };
        },
        target: updateStateWithDraft,
      });

      sample({
        clock: checkout,
        source: input.$params,
        fn: (params: any) => ({ restaurantId: params.returnToRestaurantId }),
        target: copyCartToReceipt,
      });

      sample({
        clock: checkout,
        source: {
          items: cartModel.$items,
          instances: (cartModel as any).$instances,
          params: input.$params,
        },
        fn: ({ items, instances, params }: any) => ({
          items,
          instances,
          restaurantId: params.returnToRestaurantId,
        }),
        target: clearRestaurantCartFx,
      });

      sample({
        clock: clearRestaurantCartFx.done,
        fn: () => ({ screen: 'congrats' as const, params: {} }),
        target: updateState,
      });
    },
    congrats: (input: any) => {
      sample({
        clock: finishOrder,
        fn: () => ({ screen: 'restaurants' as const, params: {} }),
        target: updateState,
      });
    },
  },
});

// --- Initialize Singleton Instance ---
export const appInstance: any = create(appModel);

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
  fn: ({ item, editId, restaurantId }: any) => {
    const nextState = { ...item.state };
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
  fn: ({ returnTo, restaurantId }: any) => ({
    screen: returnTo,
    params: { restaurantId },
  }),
  target: updateState,
});
