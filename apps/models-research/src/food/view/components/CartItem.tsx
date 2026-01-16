import { useMemo } from 'react';
import { useUnit } from 'effector-react';
import { cartModel } from '../../models/cart';
import { useLens } from '../hooks';

export const CartItem = ({ id }: { id: string }) => {
  const item = useMemo(() => cartModel.getItem(id), [id]);
  const activeVariant = useLens(item.activeVariant, null);

  const name = useLens(item.facets.product.$name, 'Loading...');
  const price = useLens(item.facets.product.$price, 0);
  const quantity = useLens(item.facets.product.$quantity, 1);
  const isDeleted = useLens(item.facets.product.$isDeleted, false);

  const { increment, decrement, restore } = useUnit({
    increment: item.facets.product.increment,
    decrement: item.facets.product.decrement,
    restore: item.facets.product.restore,
  });

  if (isDeleted) {
    return (
      <div
        style={{
          border: '1px dashed #999',
          margin: '8px',
          padding: '8px',
          opacity: 0.6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{name} (Deleted)</span>
        <button onClick={() => (restore as any)()}>Restore</button>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        margin: '8px 0',
        padding: '12px',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <h3 style={{ margin: 0 }}>{name}</h3>
        <span style={{ fontWeight: 'bold' }}>${price * quantity}</span>
      </div>

      <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '12px' }}>
        {activeVariant === 'pizza' && <PizzaDetails item={item} />}
        {activeVariant === 'drink' && <DrinkDetails item={item} />}
        {activeVariant === 'coffee' && <CoffeeDetails item={item} />}
        {activeVariant === 'cocktail' && <CocktailDetails item={item} />}
        {activeVariant === 'sauce' && <SauceDetails item={item} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => (decrement as any)()}>-</button>
          <span style={{ minWidth: '24px', textAlign: 'center' }}>
            {quantity}
          </span>
          <button onClick={() => (increment as any)()}>+</button>
        </div>
        <div style={{ fontSize: '0.8em', color: '#888' }}>
          (${price} / item)
        </div>
      </div>
    </div>
  );
};

const PizzaDetails = ({ item }: { item: any }) => {
  const size = useLens(item.facets.size.$size, '');
  const dough = useLens(item.facets.dough.$dough, '');

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

  const { toggleExtra, toggleDefault } = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra,
    toggleDefault: item.facets.ingredients.toggleDefault,
  });

  return (
    <div>
      <div>
        {size}, {dough} dough
      </div>

      {/* Defaults (Removable) */}
      {defaultIngredients.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>
            Defaults:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {defaultIngredients.map((ing: any) => (
              <label
                key={ing.id}
                style={{
                  textDecoration: removedDefaults[ing.id]
                    ? 'line-through'
                    : 'none',
                  cursor: 'pointer',
                  opacity: removedDefaults[ing.id] ? 0.5 : 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={!removedDefaults[ing.id]}
                  onChange={() => (toggleDefault as any)(ing.id)}
                />
                {ing.name}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Extras (Addable) */}
      {extraIngredients.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '0.85em', fontWeight: 'bold' }}>Extras:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {extraIngredients.map((ing: any) => (
              <label key={ing.id} style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!selectedExtras[ing.id]}
                  onChange={() => (toggleExtra as any)(ing.id)}
                />
                {ing.name} (+${ing.price})
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const DrinkDetails = ({ item }: { item: any }) => {
  const size = useLens(item.facets.size.$size, '');
  return <div>Volume: {size}</div>;
};

const CoffeeDetails = ({ item }: { item: any }) => {
  const size = useLens(item.facets.size.$size, '');
  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const additions = useLens(item.input.additions, []);
  const { toggleExtra } = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra,
  });

  return (
    <div>
      <div>Size: {size}</div>
      <div style={{ marginTop: '4px' }}>
        {additions.map((ing: any) => (
          <label key={ing.id} style={{ marginRight: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!selectedExtras[ing.id]}
              onChange={() => (toggleExtra as any)(ing.id)}
            />
            {ing.name} (+${ing.price})
          </label>
        ))}
      </div>
    </div>
  );
};

const CocktailDetails = ({ item }: { item: any }) => {
  const selectedExtras = useLens(
    item.facets.ingredients.$selectedExtras,
    {} as Record<string, boolean>,
  );
  const decorations = useLens(item.input.decorations, []);
  const { toggleExtra } = useUnit({
    toggleExtra: item.facets.ingredients.toggleExtra,
  });

  return (
    <div>
      <div>Decorations:</div>
      <div style={{ marginTop: '4px' }}>
        {decorations.map((ing: any) => (
          <label key={ing.id} style={{ marginRight: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!selectedExtras[ing.id]}
              onChange={() => (toggleExtra as any)(ing.id)}
            />
            {ing.name} (+${ing.price})
          </label>
        ))}
      </div>
    </div>
  );
};

const SauceDetails = ({ item }: { item: any }) => {
  return <div>(Atomic Item)</div>;
};
