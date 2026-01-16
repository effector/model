import { useUnit } from 'effector-react';
import { cartModel } from '../models/cart';
import { CartScreen } from './CartScreen';
import { DrinkInput, PizzaInput } from '../types';

export const AppView = () => {
  const add = useUnit(cartModel.add);

  const addPizza = () => {
    const input: PizzaInput = {
      name: 'Pepperoni',
      description: 'Spicy pepperoni, mozzarella, tomato sauce',
      basePrice: 10,
      sizePrices: { '25': 0, '30': 2, '35': 4 },
      ingredientPrices: { cheese: 1, jalapeno: 0.5 },
      defaultSize: '30',
      defaultDough: 'Traditional',
    };

    add({
      id: crypto.randomUUID(),
      variant: 'pizza',
      input,
    });
  };

  const addDrink = () => {
    const input: DrinkInput = {
      name: 'Coca-Cola',
      description: 'Chilled soda',
      basePrice: 2,
      sizePrices: { '0.3': 0, '0.5': 0.5 },
      defaultSize: '0.5',
    };

    add({
      id: crypto.randomUUID(),
      variant: 'drink',
      input,
    });
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        padding: '20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ padding: '20px', borderRight: '1px solid #eee' }}>
        <h2 style={{ marginBottom: '20px' }}>Menu</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={addPizza}
            style={{
              padding: '12px',
              fontSize: '1em',
              cursor: 'pointer',
              backgroundColor: '#ff6900',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            Add Pepperoni Pizza ($10+)
          </button>
          <button
            onClick={addDrink}
            style={{
              padding: '12px',
              fontSize: '1em',
              cursor: 'pointer',
              backgroundColor: '#444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
            }}
          >
            Add Coca-Cola ($2+)
          </button>
        </div>
      </div>
      <div>
        <CartScreen />
      </div>
    </div>
  );
};
