import { useUnit } from 'effector-react';
import { selectRestaurant, openCart } from '../models/app';
import { cartModel, $totalPrice } from '../models/cart';

export const RESTAURANTS = [
  {
    id: '1',
    name: 'Dodo Pizza Moscow',
    address: 'ul. Amurskaya 1A',
    rating: 4.8,
    reviews: '1.2k',
    time: '35 мин',
    image: 'https://picsum.photos/seed/dodo1/600/400',
    tags: ['Пицца', 'Паста'],
  },
  {
    id: '2',
    name: 'Dodo Pizza Center',
    address: 'Red Square 1',
    rating: 4.9,
    reviews: '2.5k',
    time: '45 мин',
    image: 'https://picsum.photos/seed/dodo2/600/400',
    tags: ['Пицца', 'Кофе'],
  },
];

export const RestaurantScreen = () => {
  const [select, toCart] = useUnit([selectRestaurant, openCart]);
  const cartItems = useUnit(cartModel.$items);
  const total = useUnit($totalPrice);

  const handleSelect = (id: string) => {
    select(id);
  };

  return (
    <div className="h-full bg-[#f3f3f7] flex flex-col relative">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-20 px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-black text-[#333] tracking-tight">
          Рестораны
        </h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 pt-6 space-y-6 pb-24 flex-1 overflow-y-auto no-scrollbar">
        {RESTAURANTS.map((r) => (
          <div
            key={r.id}
            className="group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98] transition-all duration-300 cursor-pointer border border-white"
            onClick={() => handleSelect(r.id)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={r.image}
                alt={r.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                {r.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-[#333]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-1.5">
                <span className="text-[#ff6900] text-sm font-black">
                  ★ {r.rating}
                </span>
                <span className="text-gray-400 text-[10px] font-bold">
                  ({r.reviews})
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-1">
                <h2 className="text-xl font-black text-[#333] leading-tight group-hover:text-[#ff6900] transition-colors">
                  {r.name}
                </h2>
                <div className="bg-gray-50 px-3 py-1 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-tighter">
                  {r.time}
                </div>
              </div>
              <p className="text-gray-400 text-sm font-medium">{r.address}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Action Button for Cart */}
      {cartItems.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f3f3f7] via-[#f3f3f7] to-transparent z-30">
          <button
            onClick={() => toCart()}
            className="w-full bg-[#ff6900] text-white py-4 rounded-2xl text-lg font-black shadow-2xl shadow-orange-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span>Корзина</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-sm">
              {total} ₽
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
