import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import { createListApi } from '@effector-model/core-experimental';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cartModel, $totalPrice } from '../models/cart';
import { CartItem } from './components/CartItem';
import { cartBack, checkout, appInstance } from '../models/app';

export const CartScreen = () => {
  const globalTotal = useUnit($totalPrice);
  const params = useUnit(appInstance.input.$params) as any;
  const cartState = useUnit(cartModel.$state);

  const [goBack, doCheckout, clear] = useUnit([
    cartBack,
    checkout,
    cartModel.reset,
  ]);

  const currentRestaurantId = params.returnToRestaurantId;

  const cartView = useMemo(() => {
    if (!currentRestaurantId) return createListApi(cartModel);
    return createListApi(cartModel).filter((item: any) =>
      item.facets.product.$restaurantId.map(
        (id: string) => id === currentRestaurantId,
      ),
    );
  }, [currentRestaurantId]);

  const filteredItems = useUnit(cartView.$items);

  const total = useMemo(() => {
    if (!currentRestaurantId) return globalTotal;
    return filteredItems.reduce((sum: number, id: string) => {
      const itemState = cartState[id];
      if (!itemState) return sum;
      const price = itemState.facets?.product?.$price || 0;
      const quantity = itemState.facets?.product?.$quantity || 0;
      const isDeleted = itemState.facets?.product?.$isDeleted || false;

      if (isDeleted) return sum;
      return sum + price * quantity;
    }, 0);
  }, [filteredItems, cartState, globalTotal, currentRestaurantId]);

  return (
    <div className="h-full bg-white flex flex-col">
      <div className="sticky top-0 bg-white z-20 px-4 py-4 border-b border-[#e2e2e9] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => goBack()}
            className="text-2xl p-1 active:scale-90 transition-transform"
          >
            ←
          </button>
          <h1 className="text-xl font-bold">Корзина</h1>
        </div>
        {filteredItems.length > 0 && (
          <button
            onClick={() => clear()}
            className="text-gray-400 p-2 hover:text-red-500 active:scale-90 transition-all"
            title="Очистить корзину"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-px bg-gray-50">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center pt-[33%] text-gray-400">
            <div className="text-6xl mb-4">🕸️</div>
            <p className="text-lg font-medium">Ваша корзина пуста.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e2e2e9]">
            {filteredItems.map((id) => (
              <CartItem key={id} id={id} />
            ))}
          </div>
        )}
      </div>

      {filteredItems.length > 0 && (
        <div className="p-4 bg-white border-t border-[#e2e2e9]">
          <button
            className="w-full bg-[#ff6900] text-white py-4 rounded-2xl text-lg font-bold hover:bg-[#e05c00] active:scale-[0.98] transition-all"
            onClick={() => doCheckout()}
          >
            Оформить за {total} ₽
          </button>
        </div>
      )}
    </div>
  );
};
