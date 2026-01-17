import { useUnit } from 'effector-react';
import { select } from '@effector-model/core-experimental';
import {
  draftModel,
  closeProduct,
  addToCart,
  toggleProductMode,
  appInstance,
} from '../models/app';
import { ProductView } from './components/ProductView';
import { useLens } from './hooks';

export const ProductScreen = () => {
  const close = useUnit(closeProduct);
  const submit = useUnit(addToCart);
  const toggleMode = useUnit(toggleProductMode);
  const params = useUnit(appInstance.input.$params);
  const mode = params.mode || 'preview'; // 'preview' | 'ingredients'

  const draftItem = draftModel.getItem('draft');

  // Common Product Facet (Safe Access)
  const name = useLens((draftItem as any).facets.product.$name, '');
  const description = useLens(
    (draftItem as any).facets.product.$description,
    '',
  );
  const price = useLens((draftItem as any).facets.product.$price, 0);
  const quantity = useLens((draftItem as any).facets.product.$quantity, 1);
  const image = useLens<string>((draftItem as any).facets.product.$image, '');
  const nutritionalInfo = useLens<{ calories: number; weight: number } | null>(
    (draftItem as any).facets.product.$nutritionalInfo,
    null,
  );
  const total = price * quantity;

  if (!draftItem || !(draftItem as any).facets?.product) {
    return null;
  }

  // Optional Facets (Safe Topological Access via select)
  const size = useLens(
    select(draftItem)
      .facet('size')
      .path((s) => s.$size),
    '',
  );
  const dough = useLens(
    select(draftItem)
      .facet('dough')
      .path((s) => s.$dough),
    '',
  );
  const sizes = useLens(
    select(draftItem)
      .facet('size')
      .path((s) => s.$options),
    [],
  );
  const doughs = useLens(
    select(draftItem)
      .facet('dough')
      .path((s) => s.$options),
    [],
  );

  const sizeLabel = (
    (Array.isArray(sizes) ? sizes : Object.values(sizes || {})) as any[]
  ).find((s: any) => s.id === size)?.label;
  const doughLabel = (
    (Array.isArray(doughs) ? doughs : Object.values(doughs || {})) as any[]
  ).find((d: any) => d.id === dough)?.label;
  const configString = [sizeLabel, doughLabel].filter(Boolean).join(', ');

  const { increment, decrement } = useUnit({
    increment: (draftItem as any).facets.product.increment as any,
    decrement: (draftItem as any).facets.product.decrement as any,
  }) as { increment: () => void; decrement: () => void };

  // Use consistent seeded image for product details at higher resolution
  const bg = `https://picsum.photos/seed/${encodeURIComponent(name)}/800/800`;

  const mainAction = (
    <button
      className="w-full bg-[#ff6900] text-white py-5 rounded-[24px] text-xl font-black shadow-2xl shadow-orange-300 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
      onClick={() => submit()}
    >
      {params.editId ? (
        <span>Готово</span>
      ) : (
        <>
          <span className="text-2xl font-light">+</span>
          <span>{total} ₽</span>
        </>
      )}
    </button>
  );

  if (mode === 'ingredients') {
    return (
      <div className="absolute inset-0 bg-[#f3f3f7] z-[100] flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="w-full h-full flex flex-col">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 px-4 py-4 border-b border-gray-100 flex justify-between items-center">
            <button
              onClick={() => toggleMode()}
              className="text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            >
              ✕
            </button>
            <div className="flex flex-col items-center">
              <div className="font-bold text-lg text-[#333]">{name}</div>
              {configString && (
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  {configString}
                </div>
              )}
            </div>
            <div className="w-10"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
            <ProductView item={draftItem} mode="ingredients" />

            <div className="mt-12 pt-8 border-t border-gray-200 space-y-4 pb-10">
              <h3 className="font-bold text-lg text-[#333]">Детали продукта</h3>
              {nutritionalInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white/40 shadow-sm">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">
                      Энергия
                    </div>
                    <div className="font-black">
                      {nutritionalInfo.calories} ккал
                    </div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white/40 shadow-sm">
                    <div className="text-[10px] text-gray-400 font-bold uppercase">
                      Вес
                    </div>
                    <div className="font-black">{nutritionalInfo.weight} г</div>
                  </div>
                </div>
              )}
              <p className="text-gray-400 text-xs leading-relaxed">
                Цены и ингредиенты могут отличаться в зависимости от ресторана.
                Изображения приведены для демонстрации.
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
            {mainAction}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white relative animate-in fade-in duration-200">
      <div className="w-full h-full flex flex-col relative bg-white">
        <button
          onClick={close}
          className="absolute top-6 left-6 z-50 w-10 h-10 bg-white/40 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-xl shadow-md hover:bg-white/60 active:scale-90 transition-all"
        >
          ✕
        </button>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="flex items-center justify-center relative bg-[#fff0e6]">
            <img
              src={bg}
              alt={name}
              className="w-full aspect-square object-cover animate-in zoom-in duration-500"
            />
            {/* Secondary FAB (4.2) */}
            <button
              onClick={() => toggleMode()}
              className="absolute bottom-4 right-8 bg-white text-[#333] px-5 py-2.5 rounded-full shadow-xl border border-gray-100 flex items-center gap-2 font-bold text-sm hover:bg-gray-50 active:scale-95 transition-all z-20"
            >
              <span className="text-base">✏️</span>
              <span>Состав</span>
            </button>
          </div>

          <div className="px-8 pb-32 pt-6">
            <h2 className="text-[2rem] font-black leading-tight mb-3 text-[#333]">
              {name}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {description}
            </p>

            <ProductView item={draftItem} mode="selectors" />
          </div>
        </div>

        {/* Main Floating Action Button (Bottom Center) */}
        <div className="sticky bottom-0 left-0 right-0 px-8 pb-10 pt-4 bg-gradient-to-t from-white via-white to-transparent flex flex-col items-center gap-4">
          {mainAction}
        </div>
      </div>
    </div>
  );
};
