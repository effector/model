import {
  model,
  define,
  keyval,
  serialize,
  create,
} from '@effector-model/core-experimental';
import { createStore, createEvent, sample } from 'effector';
import { cartModel, productUnion, copyCartToReceipt } from './cart';

// --- Types ---
export type ScreenName =
  | 'restaurants'
  | 'menu'
  | 'product'
  | 'cart'
  | 'congrats';

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

// --- Public Events (Controller) ---
export const selectRestaurant = createEvent<string>();
export const openProduct = createEvent<any>();
export const openCart = createEvent();
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
    },
    menu: (input: any) => {
      sample({
        clock: openProduct,
        fn: (payload) => {
          const data = payload.data || payload;
          const model = (productUnion.models as any)[data.type];
          const state = model && model.init ? model.init(data) : {};
          return {
            screen: 'product' as const,
            params: { mode: 'preview', draftId: 'draft', returnTo: 'menu' },
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
        fn: () => ({ screen: 'cart' as const, params: {} }),
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
          };
        },
        filter: (payload: any): payload is any => !!payload,
        target: commitDraft,
      } as any);

      sample({
        clock: closeProduct,
        source: input.$params,
        fn: (params: any) => ({ screen: params.returnTo, params: {} }),
        target: updateState,
      });

      return {
        item: draftModel.getItem('draft'),
      };
    },
    cart: (input: any) => {
      sample({
        clock: cartBack,
        fn: () => ({ screen: 'menu' as const, params: {} }),
        target: updateState,
      });

      sample({
        clock: editItem,
        source: (cartModel as any).$instances,
        fn: (cart: any, id: string) => {
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
        target: copyCartToReceipt,
      });

      sample({
        clock: checkout,
        fn: () => ({ screen: 'congrats' as const, params: {} }),
        target: [updateState, cartModel.reset],
      });
    },
    congrats: (input: any) => {
      sample({
        clock: finishOrder,
        fn: () => ({ screen: 'menu' as const, params: {} }),
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
  fn: ({ item, editId }) => {
    if (editId) return { ...item, id: editId };
    return item;
  },
  target: cartModel.add,
});

sample({
  clock: commitDraft,
  fn: ({ returnTo }) => ({ screen: returnTo, params: {} }),
  target: updateState,
});
