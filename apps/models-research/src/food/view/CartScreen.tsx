import { useUnit } from 'effector-react';
import { cartModel, $totalPrice } from '../../models/cart';
import { CartItem } from './components/CartItem';

export const CartScreen = () => {
  const items = useUnit(cartModel.$items);
  const total = useUnit($totalPrice);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2>Shopping Cart</h2>
      {items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {items.map((id) => (
            <CartItem key={id} id={id} />
          ))}
        </div>
      )}
      <div
        style={{
          marginTop: '20px',
          padding: '16px',
          borderTop: '2px solid #eee',
          fontSize: '1.2em',
          fontWeight: 'bold',
          textAlign: 'right',
        }}
      >
        Total: ${total}
      </div>
    </div>
  );
};
