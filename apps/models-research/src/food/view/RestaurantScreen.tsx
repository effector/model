import { useUnit } from 'effector-react';
import { navigate } from '../models/router';
import { cartModel } from '../models/cart';

const RESTAURANTS = [
  {
    id: '1',
    name: 'Dodo Pizza Moscow',
    address: 'ul. Amurskaya 1A',
    rating: 4.8,
    time: '35 min',
    image:
      'https://cdn.inappstory.com/story/x/p/z/xpz3y4x54743477434743/custom_cover/logo-350x440.jpg?v=1',
  },
  {
    id: '2',
    name: 'Dodo Pizza Center',
    address: 'Red Square 1',
    rating: 4.9,
    time: '45 min',
    image:
      'https://cdn.inappstory.com/story/x/p/z/xpz3y4x54743477434743/custom_cover/logo-350x440.jpg?v=1',
  },
];

export const RestaurantScreen = () => {
  const go = useUnit(navigate);
  const cartItems = useUnit(cartModel.$items);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white shadow-lg">
      <div className="sticky top-0 bg-white z-20 px-4 py-4 border-b border-[#e2e2e9] flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">Select Restaurant</h1>
        <button
          onClick={() => go('cart')}
          className="relative p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
        >
          <span className="text-xl">🛒</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ff6900] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="px-4 space-y-4">
        {RESTAURANTS.map((r) => (
          <div
            key={r.id}
            className="flex items-center p-4 border border-[#e2e2e9] rounded-2xl cursor-pointer active:scale-95 transition-transform"
            onClick={() => go('menu')}
          >
            <div className="w-16 h-16 rounded-lg bg-gray-100 mr-4 overflow-hidden">
              <img
                src={r.image}
                alt={r.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="font-bold text-lg">{r.name}</div>
              <div className="text-[#666] text-sm">{r.address}</div>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-[#ff6900]">★ {r.rating}</span>
                <span>{r.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
