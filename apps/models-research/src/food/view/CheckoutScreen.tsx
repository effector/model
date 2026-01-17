import { useUnit } from 'effector-react';
import { useMemo } from 'react';
import { finishOrder } from '../models/app';
import { receiptModel, $receiptTotalPrice } from '../models/cart';
import { useLens } from './hooks';

const ReceiptItem = ({ id, model }: { id: string; model: any }) => {
  const item = useMemo(() => model.getItem(id), [id, model]);
  const name = useLens((item as any).facets.product.$name, 'Loading...');
  const price = useLens((item as any).facets.product.$price, 0);
  const quantity = useLens((item as any).facets.product.$quantity, 1);

  return (
    <div className="flex justify-between items-start py-2 border-b border-dashed border-gray-300 last:border-0 font-mono text-sm text-gray-800">
      <div className="flex-1 pr-4">
        <div className="font-bold">{name}</div>
        {quantity > 1 && (
          <div className="text-gray-500 text-xs mt-0.5">
            {price} ₽ x {quantity}
          </div>
        )}
      </div>
      <div className="text-right whitespace-nowrap font-bold">
        {price * quantity} ₽
      </div>
    </div>
  );
};

export const CheckoutScreen = () => {
  const finish = useUnit(finishOrder);
  const items = useUnit(receiptModel.$items);
  const total = useUnit($receiptTotalPrice);

  return (
    <div className="h-full bg-white flex flex-col">
      <style>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="flex-1 overflow-y-auto bg-gray-50 scrollbar-none">
        <div className="pt-20 pb-8 px-8 flex flex-col items-center text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-black mb-2 text-gray-900">
            Заказ оформлен!
          </h1>
          <p className="text-gray-500 text-base mb-8">
            Ваша вкусная еда уже в пути.
          </p>
        </div>

        <div className="px-6 pb-8">
          <div className="bg-white shadow-xl shadow-gray-200/50 mx-auto max-w-sm relative">
            {/* Receipt Top Jagged Edge (Simulated with CSS or keep simple) */}
            <div className="h-2 bg-gray-800 w-full absolute top-0 left-0 opacity-0"></div>

            <div className="p-6">
              <div className="text-center border-b-2 border-dashed border-gray-800 pb-4 mb-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-gray-900 font-mono">
                  ЧЕК
                </h2>
                <div className="text-xs text-gray-400 font-mono mt-1">
                  {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="space-y-1 mb-6">
                {items.map((id) => (
                  <ReceiptItem key={id} id={id} model={receiptModel} />
                ))}
              </div>

              <div className="border-t-2 border-dashed border-gray-800 pt-4">
                <div className="flex justify-between items-center font-mono text-lg font-black text-gray-900">
                  <span>ИТОГО</span>
                  <span>{total} ₽</span>
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest">
                  Спасибо за заказ
                </div>
                <div className="mt-2 w-24 h-8 bg-gray-900 mx-auto opacity-10"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <button
          className="w-full bg-[#ff6900] text-white py-4 rounded-2xl text-lg font-bold shadow-lg shadow-orange-100 active:scale-[0.98] transition-all"
          onClick={() => finish()}
        >
          Вернуться в меню
        </button>
      </div>
    </div>
  );
};
