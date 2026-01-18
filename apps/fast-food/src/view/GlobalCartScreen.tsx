import { useUnit } from 'effector-react';
import { $cartByRestaurant } from '../models/cart';
import { globalCartBack, openCart } from '../models/app';
import { RESTAURANTS } from '../data/restaurants';

type CartGroup = { items: any[]; total: number; count: number };

export const GlobalCartScreen = () => {
  const cartByRestaurant = useUnit($cartByRestaurant) as Record<
    string,
    CartGroup
  >;
  const handleBack = useUnit(globalCartBack);
  const handleOpenCart = useUnit(openCart);

  const hasItems = Object.keys(cartByRestaurant).length > 0;

  return (
    <div className="h-full bg-white flex flex-col relative">
      {/* Header */}
      <div className="sticky top-0 bg-white z-20 px-6 py-5 border-b border-gray-100 flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
        >
          <svg
            className="w-6 h-6 text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#333]">Мои корзины</h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {hasItems ? (
          Object.entries(cartByRestaurant).map(([restaurantId, data]) => {
            const restaurant = RESTAURANTS.find((r) => r.id === restaurantId);
            if (!restaurant) return null;

            const summaryText = data.items
              .slice(0, 3)
              .map((item: any) => item.name)
              .join(', ');
            const moreCount = data.items.length - 3;
            const fullSummary =
              moreCount > 0 ? `${summaryText} и еще ${moreCount}` : summaryText;

            return (
              <div
                key={restaurantId}
                className="relative rounded-[24px] p-5 shadow-md border active:scale-[0.99] transition-transform"
                style={{
                  backgroundColor: restaurant.themeColorBg,
                  borderColor: `${restaurant.themeColor}20`,
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-white p-1 rounded-full shadow-sm flex-shrink-0">
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-[#222] tracking-tight leading-tight">
                    {restaurant.name}
                  </h3>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-[#222]/70 leading-relaxed line-clamp-2">
                    {fullSummary}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-[#222]">
                      {data.total} ₽
                    </span>
                    <span className="text-sm font-bold text-[#222]/50 relative -top-[2px]">
                      {data.count} шт
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenCart({ restaurantId })}
                    className="h-10 pl-5 pr-4 rounded-full font-bold text-white shadow-md flex items-center gap-2 hover:brightness-110 active:scale-95 transition-all"
                    style={{ backgroundColor: restaurant.themeColor }}
                  >
                    <span>Перейти</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 pb-20">
            <svg
              className="w-16 h-16 mb-4 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p>Корзина пуста</p>
          </div>
        )}
      </div>
    </div>
  );
};
