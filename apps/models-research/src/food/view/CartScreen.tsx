import { useUnit } from 'effector-react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { cartModel, $totalPrice } from '../models/cart';
import { CartItem } from './components/CartItem';
import { cartBack, checkout } from '../models/app';

export const CartScreen = () => {
  const items = useUnit(cartModel.$items);
  const total = useUnit($totalPrice);
  const [goBack, doCheckout, clear] = useUnit([
    cartBack,
    checkout,
    cartModel.reset,
  ]);

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
        {items.length > 0 && (
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
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center pt-[33%] text-gray-400">
            <div className="text-6xl mb-4">🕸️</div>
            <p className="text-lg font-medium">Ваша корзина пуста.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#e2e2e9]">
            {items.map((id) => (
              <CartItem key={id} id={id} />
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
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
