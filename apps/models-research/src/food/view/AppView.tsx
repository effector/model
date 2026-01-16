import { useUnit } from 'effector-react';
import { cartModel } from '../models/cart';
import { CartScreen } from './CartScreen';
import {
  DrinkData,
  PizzaData,
  CoffeeData,
  CocktailData,
  SauceData,
  ProductData,
} from '../types';

import pizzas from '../data/pizzas.json';
import drinks from '../data/drinks.json';
import coffee from '../data/coffee.json';
import cocktails from '../data/cocktails.json';
import sauces from '../data/sauces.json';

export const AppView = () => {
  const add = useUnit(cartModel.add);

  const addItem = (item: any) => {
    add({
      id: crypto.randomUUID(),
      variant: item.type,
      input: item,
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
        <h2 style={{ marginBottom: '20px' }}>Menu (Dodo Pizza Moscow)</h2>

        <CategorySection
          title="Пицца"
          items={pizzas}
          onAdd={addItem}
          color="#ff6900"
        />
        <CategorySection
          title="Кофе"
          items={coffee}
          onAdd={addItem}
          color="#6f4e37"
        />
        <CategorySection
          title="Напитки"
          items={drinks}
          onAdd={addItem}
          color="#d00000"
        />
        <CategorySection
          title="Коктейли"
          items={cocktails}
          onAdd={addItem}
          color="#00a86b"
        />
        <CategorySection
          title="Соусы"
          items={sauces}
          onAdd={addItem}
          color="#f4a460"
        />
      </div>
      <div>
        <CartScreen />
      </div>
    </div>
  );
};

const CategorySection = ({ title, items, onAdd, color }: any) => (
  <div style={{ marginBottom: '20px' }}>
    <h3 style={{ marginBottom: '10px', color: '#333' }}>{title}</h3>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
      {items.map((item: any) => (
        <button
          key={item.name}
          onClick={() => onAdd(item)}
          style={{
            padding: '10px',
            fontSize: '0.9em',
            cursor: 'pointer',
            backgroundColor: 'white',
            color: '#333',
            border: `1px solid ${color}`,
            borderLeft: `4px solid ${color}`,
            borderRadius: '4px',
            textAlign: 'left',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 500 }}>{item.name}</span>
          <span style={{ fontSize: '0.8em', color: '#666' }}>
            {item.basePrice} ₽
          </span>
        </button>
      ))}
    </div>
  </div>
);
