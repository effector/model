import { useUnit } from 'effector-react';
import { cartModel, $totalPrice } from '../models/cart';
import { CartItem } from './components/CartItem';
import { navigate } from '../models/router';

export const CartScreen = () => {
  const items = useUnit(cartModel.$items);
  const total = useUnit($totalPrice);
  const goMenu = useUnit(navigate);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white flex flex-col shadow-lg">
      <div className="sticky top-0 bg-white z-20 px-4 py-4 border-b border-[#e2e2e9] flex items-center gap-4">
        <button
          onClick={() => goMenu('menu')}
          className="text-2xl p-1 active:scale-90 transition-transform"
        >
          ←
        </button>
        <h1 className="text-xl font-bold">Cart</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-px bg-gray-50">
        {items.length === 0 ? (
          <div className="text-center mt-20 text-gray-400">
            <div className="text-6xl mb-4">🕸️</div>
            <p className="text-lg">Your cart is empty.</p>
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
            onClick={() => goMenu('success')}
          >
            Checkout {total} ₽
          </button>
        </div>
      )}
    </div>
  );
};
