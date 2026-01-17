import { useUnit } from 'effector-react';
import { useLens } from '../hooks';

export const ProductView = ({
  item,
  mode = 'full',
}: {
  item: any;
  mode?: 'full' | 'selectors' | 'ingredients';
}) => {
  return (
    <div className="space-y-8">
      <Match
        model={item}
        cases={{
          pizza: PizzaDetails,
          drink: DrinkDetails,
          coffee: CoffeeDetails,
          cocktail: CocktailDetails,
          sauce: SauceDetails,
        }}
        mode={mode}
      />
    </div>
  );
};

export const Match = ({ model, cases, mode }: any) => {
  const variant = useLens(model.activeVariant, null);
  const Component = cases[variant];
  if (!Component) return null;
  return <Component item={model} mode={mode} />;
};

export const PizzaDetails = ({ item, mode }: { item: any; mode: string }) => {
  const size = useLens(item.facets.size.$size, '');
  const dough = useLens(item.facets.dough.$dough, '');
  const sizes = useLens(item.input.sizes, []);
  const doughs = useLens(item.input.doughs, []);

  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const removedDefaults = useLens(
    item.facets.ingredients.$removedDefaults,
    {} as Record<string, boolean>,
  );

  const extraIngredients = useLens(item.input.extraIngredients, []);
  const defaultIngredients = useLens(item.input.defaultIngredients, []);

  const { toggleExtra, toggleDefault, setSize, setDough } = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra,
    toggleDefault: item.facets.ingredients.toggleDefault,
    setSize: item.facets.size.setSize,
    setDough: item.facets.dough.setDough,
  });

  const showSelectors = mode === 'full' || mode === 'selectors';
  const showIngredients = mode === 'full' || mode === 'ingredients';

  return (
    <div className="space-y-6">
      {/* Selectors */}
      {showSelectors && (
        <div className="space-y-3">
          {sizes.length > 0 && (
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {sizes.map((s: any) => (
                <button
                  key={s.id}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    size === s.id ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                  onClick={() => setSize(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
          {doughs.length > 0 && (
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {doughs.map((d: any) => (
                <button
                  key={d.id}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    dough === d.id ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                  onClick={() => setDough(d.id)}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Defaults */}
      {showIngredients && defaultIngredients.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">Ingredients</h3>
          <div className="flex flex-wrap gap-2">
            {defaultIngredients.map((ing: any) => (
              <button
                key={ing.id}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
                  removedDefaults[ing.id]
                    ? 'bg-gray-50 border-transparent text-gray-400 line-through'
                    : 'bg-white border-gray-200 text-gray-700 shadow-sm'
                }`}
                onClick={() => toggleDefault(ing.id)}
              >
                {ing.name} {!removedDefaults[ing.id] && '✕'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extras */}
      {showIngredients && extraIngredients.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">Add to taste</h3>
          <div className="grid grid-cols-3 gap-3">
            {extraIngredients.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center h-full ${
                  selectedExtras[ing.id]
                    ? 'border-[#ff6900] bg-orange-50 shadow-sm ring-1 ring-[#ff6900]'
                    : 'border-transparent bg-white shadow-sm hover:shadow-md'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <img
                  src={`https://placehold.co/100x100/fff0e6/ff6900?text=${ing.name.substring(0, 2)}`}
                  alt=""
                  className="w-12 h-12 object-contain mb-2"
                />
                <div className="text-[0.7rem] font-bold leading-tight mb-1 flex-1 flex items-center">
                  {ing.name}
                </div>
                <div className="text-[0.8rem] font-black text-gray-900">
                  {ing.price} ₽
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const DrinkDetails = ({ item, mode }: { item: any; mode: string }) => {
  const size = useLens(item.facets.size.$size, '');
  const sizes = useLens(item.input.sizes, []);
  const { setSize } = useUnit({
    setSize: item.facets.size.setSize,
  });

  if (mode === 'ingredients') return null;

  return (
    <div className="space-y-4">
      {sizes.length > 0 && (
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {sizes.map((s: any) => (
            <button
              key={s.id}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                size === s.id ? 'bg-white shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setSize(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CoffeeDetails = ({ item, mode }: { item: any; mode: string }) => {
  const size = useLens(item.facets.size.$size, '');
  const sizes = useLens(item.input.sizes, []);
  const additions = useLens(item.input.additions, []);
  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const { setSize, toggleExtra } = useUnit({
    setSize: item.facets.size.setSize,
    toggleExtra: item.facets.ingredients.toggleExtra,
  });

  const showSelectors = mode === 'full' || mode === 'selectors';
  const showIngredients = mode === 'full' || mode === 'ingredients';

  return (
    <div className="space-y-6">
      {showSelectors && sizes.length > 0 && (
        <div className="flex bg-gray-100 p-1 rounded-xl">
          {sizes.map((s: any) => (
            <button
              key={s.id}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                size === s.id ? 'bg-white shadow-sm' : 'text-gray-500'
              }`}
              onClick={() => setSize(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {showIngredients && additions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">Additions</h3>
          <div className="grid grid-cols-3 gap-3">
            {additions.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center h-full ${
                  selectedExtras[ing.id]
                    ? 'border-[#ff6900] bg-orange-50 shadow-sm ring-1 ring-[#ff6900]'
                    : 'border-transparent bg-white shadow-sm hover:shadow-md'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <img
                  src={`https://placehold.co/100x100/fff0e6/ff6900?text=${ing.name.substring(0, 2)}`}
                  alt=""
                  className="w-12 h-12 object-contain mb-2"
                />
                <div className="text-[0.7rem] font-bold leading-tight mb-1 flex-1 flex items-center">
                  {ing.name}
                </div>
                <div className="text-[0.8rem] font-black text-gray-900">
                  {ing.price} ₽
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const CocktailDetails = ({
  item,
  mode,
}: {
  item: any;
  mode: string;
}) => {
  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const decorations = useLens(item.input.decorations, []);
  const { toggleExtra } = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra,
  });

  if (mode === 'selectors') return null;

  return (
    <div className="space-y-4">
      {decorations.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">Decorations</h3>
          <div className="grid grid-cols-3 gap-3">
            {decorations.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-3 rounded-2xl border transition-all text-center h-full ${
                  selectedExtras[ing.id]
                    ? 'border-[#ff6900] bg-orange-50 shadow-sm ring-1 ring-[#ff6900]'
                    : 'border-transparent bg-white shadow-sm hover:shadow-md'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <img
                  src={`https://placehold.co/100x100/fff0e6/ff6900?text=${ing.name.substring(0, 2)}`}
                  alt=""
                  className="w-12 h-12 object-contain mb-2"
                />
                <div className="text-[0.7rem] font-bold leading-tight mb-1 flex-1 flex items-center">
                  {ing.name}
                </div>
                <div className="text-[0.8rem] font-black text-gray-900">
                  {ing.price} ₽
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const SauceDetails = ({ item }: { item: any }) => {
  return (
    <div className="text-gray-400 py-10 text-center italic text-sm">
      No customization available for this item
    </div>
  );
};
