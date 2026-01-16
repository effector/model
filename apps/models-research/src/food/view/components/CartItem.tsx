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
  const selectedIngredients = useLens(
    item.facets.ingredients.$selected,
    {} as Record<string, boolean>,
  );
  const availableIngredients = useLens(
    item.input.ingredientPrices,
    {} as Record<string, number>,
  );

  const { toggleIngredient } = useUnit({
    toggleIngredient: item.facets.ingredients.toggle,
  });

  return (
    <div>
      <div>
        {size}cm, {dough} dough
      </div>
      <div
        style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#f9f9f9',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            fontSize: '0.85em',
            fontWeight: 'bold',
            marginBottom: '4px',
          }}
        >
          Deep Update Demo (Ingredients):
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {Object.keys(availableIngredients).map((id) => (
            <label
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              <input
                type="checkbox"
                checked={!!selectedIngredients[id]}
                onChange={() => (toggleIngredient as any)(id)}
              />
              {id} (+${availableIngredients[id]})
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const DrinkDetails = ({ item }: { item: any }) => {
  const size = useLens(item.facets.size.$size, '');
  return <div>Volume: {size}</div>;
};
