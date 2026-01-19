import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import { createCursor } from '@effector-model/core-experimental';
import { TrashIcon } from '@heroicons/react/24/outline';
import { CartItem } from './components/CartItem';
import { useApp } from './AppContext';
import { MainButton } from './components/Common';
import { getRestaurantTheme } from '../data/restaurants';

export const CartScreen = () => {
  const { cartModel, stores, events, appInstance } = useApp();
  const globalTotal = useUnit(stores.$totalPrice);
  const params = useUnit(appInstance.input.$params) as any;

  const currentRestaurantId = params.returnToRestaurantId;

  const cartView = useMemo(() => {
    if (!currentRestaurantId) return createCursor(cartModel);
    return createCursor(cartModel).filter((item: any) =>
      item.facets.product.$restaurantId.map(
        (id: string) => id === currentRestaurantId,
      ),
    );
  }, [currentRestaurantId, cartModel]);

  const [goBack, doCheckout, clear] = useUnit([
    events.cartBack,
    events.checkout,
    cartView.remove,
  ]);

  const filteredItems = useUnit(cartView.$items);

  const $itemTotals = useMemo(() => {
    return cartView.map((item: any) => {
      const product = item.facets.product;
      const price = product?.$price || 0;
      const quantity = product?.$quantity || 0;
      const isDeleted = product?.$isDeleted || false;

      return isDeleted ? 0 : price * quantity;
    });
  }, [cartView]);

  const $isDeletedList = useMemo(() => {
    return cartView.map((item: any) => item.facets.product.$isDeleted);
  }, [cartView]);

  const isDeletedList = useUnit($isDeletedList);
  const hasActiveItems = isDeletedList.some((deleted) => !deleted);

  const itemTotals = useUnit($itemTotals);

  const total = useMemo(() => {
    if (!currentRestaurantId) return globalTotal;
    return itemTotals.reduce((a, b) => a + b, 0);
  }, [itemTotals, globalTotal, currentRestaurantId]);

  return (
    <div
      className="h-full bg-white flex flex-col"
      style={getRestaurantTheme(currentRestaurantId)}
    >
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

      <div className="flex-1 overflow-y-auto px-4 pt-4 space-y-px bg-gray-50 no-scrollbar">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center pt-[33%] text-gray-400">
            <div className="text-6xl mb-4">🕸️</div>
            <p className="text-lg font-medium">Ваша корзина пуста.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e2e2e9]">
              {filteredItems.map((id) => (
                <CartItem key={id} id={id} />
              ))}
            </div>
            <div className="h-32" />
          </>
        )}
      </div>

      {filteredItems.length > 0 && hasActiveItems && (
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-30 pointer-events-none px-4">
          <MainButton
            onClick={() => doCheckout()}
            label="Оформить за"
            price={total}
            className="pointer-events-auto"
            icon={null}
          />
        </div>
      )}
    </div>
  );
};
