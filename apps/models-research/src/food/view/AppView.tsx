import { useUnit } from 'effector-react';
import { $screen, navigate } from '../models/router';
import { MenuScreen } from './MenuScreen';
import { CartScreen } from './CartScreen';
import { ProductConfigurator } from './ProductConfigurator';
import { RestaurantScreen } from './RestaurantScreen';
import { CheckoutScreen } from './CheckoutScreen';
import { cartModel, $totalPrice } from '../models/cart';

export const AppView = () => {
  const screen = useUnit($screen);
  const cartItems = useUnit(cartModel.$items);
  const total = useUnit($totalPrice);
  const goToCart = useUnit(navigate);

  const showFab =
    cartItems.length > 0 && screen !== 'cart' && screen !== 'success';

  return (
    <div className="bg-[#f3f3f7] min-h-screen font-sans text-[#333]">
      {screen === 'restaurant' && <RestaurantScreen />}
      {screen === 'menu' && <MenuScreen />}
      {screen === 'cart' && <CartScreen />}
      {(screen === 'configurator' || screen === 'ingredients') && (
        <ProductConfigurator />
      )}
      {screen === 'success' && <CheckoutScreen />}
    </div>
  );
};
