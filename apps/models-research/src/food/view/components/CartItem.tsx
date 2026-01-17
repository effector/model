import { useMemo } from 'react';
import { useUnit } from 'effector-react';
import { cartModel } from '../../models/cart';
import { useLens } from '../hooks';
import {
  Match,
  PizzaDetails,
  DrinkDetails,
  CoffeeDetails,
  CocktailDetails,
  SauceDetails,
} from './ProductView';
import { openConfigurator } from '../../models/draft';

export const CartItem = ({ id }: { id: string }) => {
  const item = useMemo(() => cartModel.getItem(id), [id]);
  const isDeleted = useLens((item as any).facets.product.$isDeleted, false);
  const name = useLens((item as any).facets.product.$name, 'Loading...');
  const price = useLens((item as any).facets.product.$price, 0);
  const quantity = useLens((item as any).facets.product.$quantity, 1);

  const { restore, increment, decrement } = useUnit({
    restore: (item as any).facets.product.restore as any,
    increment: (item as any).facets.product.increment as any,
    decrement: (item as any).facets.product.decrement as any,
  });

  const openEdit = useUnit(openConfigurator);

  const cases = {
    pizza: PizzaDetails,
    drink: DrinkDetails,
    coffee: CoffeeDetails,
    cocktail: CocktailDetails,
    sauce: SauceDetails,
  };

  return (
    <div
      className={`p-4 flex flex-col border-b border-gray-100 last:border-0 transition-all ${
        isDeleted ? 'opacity-50 grayscale' : 'opacity-100'
      }`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="font-bold text-[1.05rem] leading-tight mb-1">
            {name}
          </div>
          <div className="text-xs text-gray-500 leading-relaxed">
            <Match model={item} cases={cases} />
          </div>
        </div>
        <div className="font-bold whitespace-nowrap">{price * quantity} ₽</div>
      </div>

      <div className="flex justify-between items-center mt-4">
        {isDeleted ? (
          <button
            className="px-4 py-2 rounded-full bg-[#fff0e6] text-[#ff6900] font-bold text-sm active:scale-95 transition-transform"
            onClick={() => restore()}
          >
            Restore
          </button>
        ) : (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-full">
            <button
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
              onClick={() => decrement()}
            >
              −
            </button>
            <span className="w-8 text-center font-bold text-sm">
              {quantity}
            </span>
            <button
              className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-lg active:scale-90 transition-transform"
              onClick={() => increment()}
            >
              +
            </button>
          </div>
        )}

        {!isDeleted && (
          <button
            className="text-[#ff6900] font-bold text-sm px-2 py-1 active:scale-95 transition-transform"
            onClick={() => openEdit({ mode: 'edit', id })}
          >
            Change
          </button>
        )}
      </div>
    </div>
  );
};
