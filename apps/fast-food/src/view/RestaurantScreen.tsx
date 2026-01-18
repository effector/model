import { useUnit } from 'effector-react';
import { RESTAURANTS } from '../data/restaurants';
import { Restaurant } from './Restaurant';
import { $globalCartStats } from '../models/cart';
import { openGlobalCart } from '../models/app';
import { MainButton } from './components/Common';

export const RestaurantScreen = () => {
  const stats = useUnit($globalCartStats) as {
    total: number;
    count: number;
    cartsCount: number;
  };
  const handleOpenGlobalCart = useUnit(openGlobalCart);

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
          <Restaurant key={r.id} id={r.id} variant="list" />
        ))}
      </div>

      {stats.count > 0 && (
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-30 pointer-events-none px-4">
          <MainButton
            onClick={handleOpenGlobalCart}
            label="Корзины"
            count={stats.cartsCount}
            price={stats.total}
            className="pointer-events-auto"
          />
        </div>
      )}
    </div>
  );
};
