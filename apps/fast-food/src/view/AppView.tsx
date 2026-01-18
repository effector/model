import { useUnit } from 'effector-react';
import { useApp } from './AppContext';
import { Restaurant } from './Restaurant';
import { CartScreen } from './CartScreen';
import { ProductScreen } from './ProductScreen';
import { RestaurantScreen } from './RestaurantScreen';
import { CheckoutScreen } from './CheckoutScreen';
import { GlobalCartScreen } from './GlobalCartScreen';

// --- Configuration ---
const FRAME_COLOR = '#9f9d9c';
const FRAME_WIDTH = '472px';
const FRAME_HEIGHT = '900px';
const FRAME_BORDER_WIDTH = '8px'; // Added as a parameter to adjust border thickness
// ---------------------

export const AppView = () => {
  const { appInstance } = useApp();
  const variant = useUnit(appInstance.activeVariant) as unknown as string;
  const params = useUnit(appInstance.input.$params) as any;

  return (
    <div className="min-h-screen font-sans text-[#333] flex items-center justify-center p-8 bg-gray-50">
      {/* Framed mini-app with adjustable "smartphone case" border */}
      <div
        className="relative rounded-[40px] shadow-2xl transition-all duration-300"
        style={{
          backgroundColor: FRAME_COLOR,
          padding: FRAME_BORDER_WIDTH,
        }}
      >
        {/* Inner border for definition */}
        <div className="p-0.5 bg-black/10 rounded-[34px]">
          <div
            className="bg-white rounded-[32px] overflow-hidden relative flex flex-col"
            style={{ width: FRAME_WIDTH, height: FRAME_HEIGHT }}
          >
            <div className="h-full overflow-y-auto no-scrollbar scroll-smooth">
              {variant === 'restaurants' && <RestaurantScreen />}
              {variant === 'menu' && (
                <Restaurant id={params.restaurantId} variant="full" />
              )}
              {variant === 'product' && <ProductScreen />}
              {variant === 'cart' && <CartScreen />}
              {variant === 'congrats' && <CheckoutScreen />}
              {variant === 'globalCart' && <GlobalCartScreen />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
