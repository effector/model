import { useMemo } from 'react';
import { useUnit } from 'effector-react';
import {
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { cartModel } from '../../models/cart';
import { useLens } from '../hooks';
import { Match } from './ProductView';
import { editItem, appInstance } from '../../models/app';

export const CartItem = ({
  id,
  model = cartModel,
}: {
  id: string;
  model?: any;
}) => {
  const item = useMemo(() => model.getItem(id), [id, model]);
  const isDeleted = useLens((item as any).facets.product.$isDeleted, false);
  const name = useLens((item as any).facets.product.$name, 'Loading...');
  const price = useLens((item as any).facets.product.$price, 0);
  const quantity = useLens((item as any).facets.product.$quantity, 1);

  const { restore, increment, decrement, remove } = useUnit({
    restore: (item as any).facets.product.restore,
    increment: (item as any).facets.product.increment,
    decrement: (item as any).facets.product.decrement,
    remove: model.remove,
  }) as any;

  const openEdit = useUnit(editItem);
  const screen = useUnit(appInstance.input.$screen);
  const isCheckout = (screen as any) === 'congrats';

  const cases = {
    pizza: () => null,
    drink: () => null,
    coffee: () => null,
    cocktail: () => null,
    sauce: () => null,
  };

  return (
    <div className="p-4 flex flex-col border-b border-gray-100 last:border-0 transition-all bg-white">
      <div
        className={`flex gap-4 transition-all ${isDeleted ? 'opacity-50 grayscale' : 'opacity-100'}`}
      >
        {/* Product Image */}
        <div className="w-20 h-20 flex-shrink-0">
          <img
            src={`https://picsum.photos/seed/${name}/200/200`}
            alt={name}
            className="w-full h-full object-contain rounded-lg"
          />
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg leading-tight mb-0.5 truncate">
            {name}
          </div>
          <div className="text-xs text-gray-500 leading-tight">
            <Match model={item} cases={cases as any} mode="cart" />
          </div>
        </div>
      </div>

      {/* Footer: Price, Edit, Quantity */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
        <div
          className={`transition-all ${isDeleted ? 'opacity-50 grayscale' : 'opacity-100'}`}
        >
          <div className="text-[#ff6900] px-3 py-1 rounded-lg font-bold text-base border border-[#ff6900]">
            {price * quantity} ₽
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isDeleted ? (
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-green-50 text-green-600 font-bold text-sm active:scale-95 transition-all border border-green-100 shadow-sm"
                onClick={() => restore()}
              >
                Вернуть
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-red-50 text-red-500 font-bold text-sm active:scale-95 transition-all border border-red-100 shadow-sm"
                onClick={() => remove(id)}
              >
                Удалить
              </button>
            </div>
          ) : (
            <>
              {!isCheckout && (
                <button
                  className="text-[#ff6900] font-semibold text-sm hover:underline"
                  onClick={() => openEdit(id)}
                >
                  Изменить
                </button>
              )}

              <div className="flex items-center gap-3 bg-gray-100 px-2 py-1 rounded-lg">
                <button
                  className="p-1 text-gray-600 hover:text-gray-900 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => decrement()}
                  disabled={isCheckout}
                >
                  <MinusIcon className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className="min-w-[1rem] text-center font-bold text-sm text-gray-900">
                  {quantity}
                </span>
                <button
                  className="p-1 text-gray-600 hover:text-gray-900 active:scale-90 transition-all disabled:opacity-30 disabled:pointer-events-none"
                  onClick={() => increment()}
                  disabled={isCheckout}
                >
                  <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
