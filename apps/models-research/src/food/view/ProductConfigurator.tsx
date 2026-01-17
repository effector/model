import { useUnit } from 'effector-react';
import { select } from '@effector-model/core-experimental';
import {
  draftModel,
  closeConfigurator,
  submitConfigurator,
} from '../models/draft';
import { ProductView } from './components/ProductView';
import { useLens } from './hooks';
import { $screen, navigate } from '../models/router';

export const ProductConfigurator = () => {
  const screen = useUnit($screen);
  const close = useUnit(closeConfigurator);
  const submit = useUnit(submitConfigurator);
  const go = useUnit(navigate);
  const draftItem = draftModel.getItem('draft');

  // Common Product Facet (Safe Access)
  // draftItem is a Union, but 'product' facet is present in ALL variants.
  // However, TS might struggle with Union property access if not intersection.
  // We use 'select' for robustness here if direct access fails type check.
  const name = useLens((draftItem as any).facets.product.$name, '');
  const description = useLens(
    (draftItem as any).facets.product.$description,
    '',
  );
  const price = useLens((draftItem as any).facets.product.$price, 0);
  const quantity = useLens((draftItem as any).facets.product.$quantity, 1);
  const total = price * quantity;

  // Optional Facets (Safe Topological Access via select)
  const size = useUnit(
    select(draftItem)
      .facet('size')
      .path((s) => s.$size)
      .fallback(''),
  );
  const dough = useUnit(
    select(draftItem)
      .facet('dough')
      .path((s) => s.$dough)
      .fallback(''),
  );
  const sizes = useUnit(
    select(draftItem)
      .path((s) => s.input.sizes)
      .fallback([]),
  );
  const doughs = useUnit(
    select(draftItem)
      .path((s) => s.input.doughs)
      .fallback([]),
  );

  const sizeLabel =
    (sizes as any[]).find((s: any) => s.id === size)?.label || '';
  const doughLabel =
    (doughs as any[]).find((d: any) => d.id === dough)?.label || '';
  const configString = [sizeLabel, doughLabel].filter(Boolean).join(', ');

  const { increment, decrement } = useUnit({
    increment: (draftItem as any).facets.product.increment as any,
    decrement: (draftItem as any).facets.product.decrement as any,
  });

  const bg = `https://placehold.co/600x600/fff0e6/ff6900?text=${encodeURIComponent(
    name.split(' ')[0],
  )}`;

  if (screen === 'ingredients') {
    return (
      <div
        className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end"
        onClick={() => go('configurator')}
      >
        <div
          className="bg-white w-full max-w-[480px] h-[90vh] rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100 flex justify-between items-center">
            <button
              onClick={() => go('configurator')}
              className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              ✕
            </button>
            <div className="flex flex-col items-center">
              <div className="font-bold text-lg">{name}</div>
              {configString && (
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {configString}
                </div>
              )}
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
            <ProductView item={draftItem} mode="ingredients" />

            {/* Metadata Section 3 */}
            <div className="mt-12 pt-8 border-t border-gray-100 space-y-4 pb-10">
              <h3 className="font-bold text-lg">Product Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">
                    Energy
                  </div>
                  <div className="font-black">264.6 kcal</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <div className="text-[10px] text-gray-400 font-bold uppercase">
                    Weight
                  </div>
                  <div className="font-black">670 g</div>
                </div>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed">
                Prices and ingredients may vary by restaurant. Visuals are for
                demonstration purposes.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <button
              className="w-full bg-[#ff6900] text-white py-4 rounded-2xl text-lg font-black shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
              onClick={() => go('configurator')}
            >
              Save {total > 0 ? `${total} ₽` : ''}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex justify-center items-end"
      onClick={close}
    >
      <div
        className="bg-white w-full max-w-[480px] h-[90vh] rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100 flex justify-between items-center">
          <button
            onClick={close}
            className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
          >
            ✕
          </button>
          <div className="font-bold text-lg truncate max-w-[200px]">{name}</div>
          <div className="w-10"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <div className="text-center mb-8 relative">
            <img
              src={bg}
              alt={name}
              className="w-4/5 mx-auto aspect-square object-contain animate-in zoom-in duration-500"
            />
            {/* Customize Ingredients FAB (4.2) */}
            <button
              onClick={() => go('ingredients')}
              className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 bg-white text-[#333] px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-2 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all z-20"
            >
              <span>✏️</span>
              <span>Настроить состав</span>
            </button>
          </div>

          <div className="mt-10">
            <h2 className="text-2xl font-black mb-2">{name}</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {description}
            </p>

            <ProductView item={draftItem} mode="selectors" />
          </div>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 space-y-4">
          <div className="flex justify-center">
            <div className="flex items-center gap-4 bg-gray-100 p-1.5 rounded-full">
              <button
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center font-bold text-xl active:scale-90 transition-all disabled:opacity-50"
                onClick={() => decrement()}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="w-10 text-center font-black text-lg">
                {quantity}
              </span>
              <button
                className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center font-bold text-xl active:scale-90 transition-all"
                onClick={() => increment()}
              >
                +
              </button>
            </div>
          </div>
          <button
            className="w-full bg-[#ff6900] text-white py-4 rounded-2xl text-lg font-black shadow-lg shadow-orange-200 active:scale-[0.98] transition-all"
            onClick={submit}
          >
            Add to Cart {total > 0 ? `${total} ₽` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
