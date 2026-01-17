import { useUnit } from 'effector-react';
import { useLens } from '../hooks';

export const ProductView = ({
  item,
  mode = 'full',
}: {
  item: any;
  mode?: 'full' | 'selectors' | 'ingredients' | 'cart';
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
          burger: BurgerDetails,
          twister: BurgerDetails,
          bucket: DrinkDetails,
          snack: DrinkDetails,
        }}
        mode={mode}
      />
    </div>
  );
};

export const Match = ({
  model,
  cases,
  mode,
}: {
  model: any;
  cases: Record<string, React.ComponentType<any>>;
  mode: string;
}) => {
  const variant = useLens(model.activeVariant, null) as any;
  const Component = cases[variant];

  if (!Component) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Unknown variant: {variant}. Available: {Object.keys(cases).join(', ')}
      </div>
    );
  }

  if (mode === 'cart') {
    return <CartSummary item={model} variant={variant} />;
  }

  return <Component item={model} mode={mode} />;
};

const CartSummary = ({ item, variant }: { item: any; variant: string }) => {
  if (variant === 'pizza') {
    const sizeId = useLens(item.facets.size.$size, '');
    const doughId = useLens(item.facets.dough.$dough, '');
    const rawSizes = useLens(item.facets.size.$options, []);
    const rawDoughs = useLens(item.facets.dough.$options, []);

    const sizesList = Array.isArray(rawSizes)
      ? rawSizes
      : Object.values(rawSizes || {});
    const sizeObj = (sizesList as any[]).find((s: any) => s.id === sizeId);
    const sizeLabel = sizeObj?.label || '';

    const doughsList = Array.isArray(rawDoughs)
      ? rawDoughs
      : Object.values(rawDoughs || {});
    const doughObj = (doughsList as any[]).find((d: any) => d.id === doughId);
    const doughLabel = doughObj?.label || '';

    const selectedExtras = useLens(
      item.facets.ingredients.$selectedExtras,
      {},
    ) as Record<string, boolean>;
    const removedDefaults = useLens(
      item.facets.ingredients.$removedDefaults,
      {},
    ) as Record<string, boolean>;
    const rawExtra = useLens(item.input.extraIngredients, []);
    const rawDefault = useLens(item.input.defaultIngredients, []);

    const extras = (
      Array.isArray(rawExtra) ? rawExtra : Object.values(rawExtra || {})
    )
      .filter((ing: any) => selectedExtras[ing.id])
      .map((ing: any) => `+ ${ing.name}`);

    const removed = (
      Array.isArray(rawDefault) ? rawDefault : Object.values(rawDefault || {})
    )
      .filter((ing: any) => removedDefaults[ing.id])
      .map((ing: any) => `- ${ing.name}`);

    const config = [sizeLabel, doughLabel].filter(Boolean).join(', ');
    const mods = [...extras, ...removed].join(', ');

    return (
      <div className="space-y-0.5 mt-0.5">
        {config && <div className="text-gray-600 text-sm">{config}</div>}
        {mods && <div className="text-gray-400 italic text-sm">{mods}</div>}
      </div>
    );
  }

  if (
    variant === 'coffee' ||
    variant === 'drink' ||
    variant === 'bucket' ||
    variant === 'snack'
  ) {
    const sizeId = useLens(item.facets.size.$size, '');
    const rawSizes = useLens(item.facets.size.$options, []);
    const sizesList = Array.isArray(rawSizes)
      ? rawSizes
      : Object.values(rawSizes || {});
    const sizeObj = (sizesList as any[]).find((s: any) => s.id === sizeId);
    const sizeLabel = sizeObj?.label || '';

    let mods = '';
    if (variant === 'coffee') {
      const selectedExtras = useLens(
        item.facets.ingredients.$selectedExtras,
        {},
      ) as Record<string, boolean>;
      const rawAdditions = useLens(item.input.additions, []);
      mods = (
        Array.isArray(rawAdditions)
          ? rawAdditions
          : Object.values(rawAdditions || {})
      )
        .filter((ing: any) => selectedExtras[ing.id])
        .map((ing: any) => `+ ${ing.name}`)
        .join(', ');
    }

    return (
      <div className="space-y-0.5">
        {sizeLabel && (
          <div className="text-gray-500 font-medium">{sizeLabel}</div>
        )}
        {mods && (
          <div className="text-gray-400 italic text-[0.7rem]">{mods}</div>
        )}
      </div>
    );
  }

  if (variant === 'burger' || variant === 'twister') {
    const selectedExtras = useLens(
      item.facets.ingredients.$selectedExtras,
      {},
    ) as Record<string, boolean>;
    const removedDefaults = useLens(
      item.facets.ingredients.$removedDefaults,
      {},
    ) as Record<string, boolean>;
    const rawExtra = useLens(item.input.extraIngredients, []);
    const rawDefault = useLens(item.input.defaultIngredients, []);

    const extras = (
      Array.isArray(rawExtra) ? rawExtra : Object.values(rawExtra || {})
    )
      .filter((ing: any) => selectedExtras[ing.id])
      .map((ing: any) => `+ ${ing.name}`);

    const removed = (
      Array.isArray(rawDefault) ? rawDefault : Object.values(rawDefault || {})
    )
      .filter((ing: any) => removedDefaults[ing.id])
      .map((ing: any) => `- ${ing.name}`);

    const mods = [...extras, ...removed].join(', ');

    return (
      <div className="space-y-0.5 mt-0.5">
        {mods && <div className="text-gray-400 italic text-sm">{mods}</div>}
      </div>
    );
  }

  if (variant === 'cocktail') {
    const selectedExtras = useLens(
      item.facets.ingredients.$selectedExtras,
      {},
    ) as Record<string, boolean>;
    const rawDecorations = useLens(item.input.decorations, []);
    const mods = (
      Array.isArray(rawDecorations)
        ? rawDecorations
        : Object.values(rawDecorations || {})
    )
      .filter((ing: any) => selectedExtras[ing.id])
      .map((ing: any) => `+ ${ing.name}`)
      .join(', ');

    return (
      <div className="space-y-0.5">
        {mods && (
          <div className="text-gray-400 italic text-[0.7rem]">{mods}</div>
        )}
      </div>
    );
  }

  return null;
};

export const PizzaDetails = ({ item, mode }: { item: any; mode: string }) => {
  const size = useLens(item.facets.size.$size, '');
  const dough = useLens(item.facets.dough.$dough, '');
  const rawSizes = useLens(item.facets.size.$options, []);
  const sizes = (
    Array.isArray(rawSizes) ? rawSizes : Object.values(rawSizes || {})
  ) as any[];

  const rawDoughs = useLens(item.facets.dough.$options, []);
  const doughs = (
    Array.isArray(rawDoughs) ? rawDoughs : Object.values(rawDoughs || {})
  ) as any[];

  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const removedDefaults = useLens(
    item.facets.ingredients.$removedDefaults,
    {} as Record<string, boolean>,
  );

  const rawExtra = useLens(item.input.extraIngredients, []);
  const extraIngredients = (
    Array.isArray(rawExtra) ? rawExtra : Object.values(rawExtra || {})
  ) as any[];

  const rawDefault = useLens(item.input.defaultIngredients, []);
  const defaultIngredients = (
    Array.isArray(rawDefault) ? rawDefault : Object.values(rawDefault || {})
  ) as any[];

  const units = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra as any,
    toggleDefault: item.facets.ingredients.toggleDefault as any,
    setSize: item.facets.size.setSize as any,
    setDough: item.facets.dough.setDough as any,
  });

  const toggleExtra = units.toggleExtra as (id: string) => void;
  const toggleDefault = units.toggleDefault as (id: string) => void;
  const setSize = units.setSize as (id: string) => void;
  const setDough = units.setDough as (id: string) => void;

  const showSelectors = mode === 'full' || mode === 'selectors';
  const showIngredients = mode === 'full' || mode === 'ingredients';

  return (
    <div className="space-y-6">
      {/* Selectors */}
      {showSelectors && (
        <div className="space-y-3">
          {sizes.length > 0 ? (
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
          ) : (
            <div className="text-red-500 text-xs p-2 bg-red-50 rounded">
              No Sizes ({sizes.length}).
            </div>
          )}
          {doughs.length > 0 ? (
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
          ) : (
            <div className="text-red-500 text-xs p-2 bg-red-50 rounded">
              No Doughs ({doughs.length}).
            </div>
          )}
        </div>
      )}

      {/* Extras - Liquid Glass Design - Static Dimensions */}
      {showIngredients && extraIngredients.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-800">Добавить по вкусу</h3>
          <div className="grid grid-cols-3 gap-3">
            {extraIngredients.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-2 rounded-3xl transition-all duration-200 text-center h-full relative group overflow-hidden border-2 ${
                  selectedExtras[ing.id]
                    ? 'bg-white shadow-lg border-[var(--theme-color,#ff6900)]'
                    : 'bg-white/80 backdrop-blur-md border-white shadow-sm hover:shadow-md hover:bg-white'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {selectedExtras[ing.id] && (
                  <div className="absolute top-1.5 right-1.5 bg-[var(--theme-color,#ff6900)] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200 z-20">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full flex flex-col items-center">
                  <img
                    src={`https://picsum.photos/seed/${ing.name}/100/100`}
                    alt=""
                    className="w-12 h-12 object-cover mb-1.5 rounded-2xl shadow-sm"
                  />
                  <div className="text-[0.65rem] font-bold leading-tight mb-1 min-h-[2.4em] flex items-center justify-center px-1">
                    {ing.name}
                  </div>
                  <div className="text-[0.75rem] font-black text-[var(--theme-color,#ff6900)]">
                    {ing.price} ₽
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Defaults */}
      {showIngredients && defaultIngredients.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">
            Убрать ингредиенты
          </h3>
          <div className="flex flex-wrap gap-2">
            {defaultIngredients.map((ing: any) => (
              <button
                key={ing.id}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
                  removedDefaults[ing.id]
                    ? 'bg-gray-100 border-transparent text-gray-400 line-through'
                    : 'bg-white border-gray-200 text-gray-700 shadow-sm'
                }`}
                onClick={() => toggleDefault(ing.id)}
              >
                {ing.name}{' '}
                {!removedDefaults[ing.id] && (
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
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
  const rawSizes = useLens(item.facets.size.$options, []);
  const sizes = (
    Array.isArray(rawSizes) ? rawSizes : Object.values(rawSizes || {})
  ) as any[];
  const units = useUnit({
    setSize: item.facets.size.setSize as any,
  });
  const setSize = units.setSize as (id: string) => void;

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
  const rawSizes = useLens(item.facets.size.$options, []);
  const sizes = (
    Array.isArray(rawSizes) ? rawSizes : Object.values(rawSizes || {})
  ) as any[];
  const rawAdditions = useLens(item.input.additions, []);
  const additions = (
    Array.isArray(rawAdditions)
      ? rawAdditions
      : Object.values(rawAdditions || {})
  ) as any[];
  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const units = useUnit({
    setSize: item.facets.size.setSize as any,
    toggleExtra: item.facets.ingredients.toggleExtra as any,
  });
  const setSize = units.setSize as (id: string) => void;
  const toggleExtra = units.toggleExtra as (id: string) => void;

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

      {/* Additions - Liquid Glass Design - Static Dimensions */}
      {showIngredients && additions.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-800">Добавить по вкусу</h3>
          <div className="grid grid-cols-3 gap-3">
            {additions.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-2 rounded-3xl transition-all duration-200 text-center h-full relative group overflow-hidden border-2 ${
                  selectedExtras[ing.id]
                    ? 'bg-white shadow-lg border-[var(--theme-color,#ff6900)]'
                    : 'bg-white/80 backdrop-blur-md border-white shadow-sm hover:shadow-md hover:bg-white'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {selectedExtras[ing.id] && (
                  <div className="absolute top-1.5 right-1.5 bg-[var(--theme-color,#ff6900)] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200 z-20">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full flex flex-col items-center">
                  <img
                    src={`https://picsum.photos/seed/${ing.name}/100/100`}
                    alt=""
                    className="w-12 h-12 object-cover mb-1.5 rounded-2xl shadow-sm"
                  />
                  <div className="text-[0.65rem] font-bold leading-tight mb-1 min-h-[2.4em] flex items-center justify-center px-1">
                    {ing.name}
                  </div>
                  <div className="text-[0.75rem] font-black text-[var(--theme-color,#ff6900)]">
                    {ing.price} ₽
                  </div>
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
  const rawDecorations = useLens(item.input.decorations, []);
  const decorations = (
    Array.isArray(rawDecorations)
      ? rawDecorations
      : Object.values(rawDecorations || {})
  ) as any[];
  const units = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra as any,
  });
  const toggleExtra = units.toggleExtra as (id: string) => void;

  if (mode === 'selectors') return null;

  return (
    <div className="space-y-4">
      {/* Decorations - Liquid Glass Design - Static Dimensions */}
      {decorations.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-800">Добавить по вкусу</h3>
          <div className="grid grid-cols-3 gap-3">
            {decorations.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-2 rounded-3xl transition-all duration-200 text-center h-full relative group overflow-hidden border-2 ${
                  selectedExtras[ing.id]
                    ? 'bg-white shadow-lg border-[var(--theme-color,#ff6900)]'
                    : 'bg-white/80 backdrop-blur-md border-white shadow-sm hover:shadow-md hover:bg-white'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {selectedExtras[ing.id] && (
                  <div className="absolute top-1.5 right-1.5 bg-[var(--theme-color,#ff6900)] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200 z-20">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full flex flex-col items-center">
                  <img
                    src={`https://picsum.photos/seed/${ing.name}/100/100`}
                    alt=""
                    className="w-12 h-12 object-cover mb-1.5 rounded-2xl shadow-sm"
                  />
                  <div className="text-[0.65rem] font-bold leading-tight mb-1 min-h-[2.4em] flex items-center justify-center px-1">
                    {ing.name}
                  </div>
                  <div className="text-[0.75rem] font-black text-[var(--theme-color,#ff6900)]">
                    {ing.price} ₽
                  </div>
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
      Для этого товара нет настроек
    </div>
  );
};

export const BurgerDetails = ({ item, mode }: { item: any; mode: string }) => {
  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const removedDefaults = useLens(
    item.facets.ingredients.$removedDefaults,
    {} as Record<string, boolean>,
  );

  const rawExtra = useLens(item.input.extraIngredients, []);
  const extraIngredients = (
    Array.isArray(rawExtra) ? rawExtra : Object.values(rawExtra || {})
  ) as any[];

  const rawDefault = useLens(item.input.defaultIngredients, []);
  const defaultIngredients = (
    Array.isArray(rawDefault) ? rawDefault : Object.values(rawDefault || {})
  ) as any[];

  const units = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra as any,
    toggleDefault: item.facets.ingredients.toggleDefault as any,
  });

  const toggleExtra = units.toggleExtra as (id: string) => void;
  const toggleDefault = units.toggleDefault as (id: string) => void;

  const showIngredients = mode === 'full' || mode === 'ingredients';

  if (!showIngredients) return null;

  return (
    <div className="space-y-6">
      {/* Extras */}
      {extraIngredients.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-800">Добавить по вкусу</h3>
          <div className="grid grid-cols-3 gap-3">
            {extraIngredients.map((ing: any) => (
              <button
                key={ing.id}
                className={`flex flex-col items-center p-2 rounded-3xl transition-all duration-200 text-center h-full relative group overflow-hidden border-2 ${
                  selectedExtras[ing.id]
                    ? 'bg-white shadow-lg border-[var(--theme-color,#ff6900)]'
                    : 'bg-white/80 backdrop-blur-md border-white shadow-sm hover:shadow-md hover:bg-white'
                }`}
                onClick={() => toggleExtra(ing.id)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {selectedExtras[ing.id] && (
                  <div className="absolute top-1.5 right-1.5 bg-[var(--theme-color,#ff6900)] text-white w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200 z-20">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}

                <div className="relative z-10 w-full flex flex-col items-center">
                  <img
                    src={`https://picsum.photos/seed/${ing.name}/100/100`}
                    alt=""
                    className="w-12 h-12 object-cover mb-1.5 rounded-2xl shadow-sm"
                  />
                  <div className="text-[0.65rem] font-bold leading-tight mb-1 min-h-[2.4em] flex items-center justify-center px-1">
                    {ing.name}
                  </div>
                  <div className="text-[0.75rem] font-black text-[var(--theme-color,#ff6900)]">
                    {ing.price} ₽
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Defaults */}
      {defaultIngredients.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-lg text-gray-800">
            Убрать ингредиенты
          </h3>
          <div className="flex flex-wrap gap-2">
            {defaultIngredients.map((ing: any) => (
              <button
                key={ing.id}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all flex items-center gap-2 ${
                  removedDefaults[ing.id]
                    ? 'bg-gray-100 border-transparent text-gray-400 line-through'
                    : 'bg-white border-gray-200 text-gray-700 shadow-sm'
                }`}
                onClick={() => toggleDefault(ing.id)}
              >
                {ing.name}{' '}
                {!removedDefaults[ing.id] && (
                  <svg
                    className="w-3 h-3 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
