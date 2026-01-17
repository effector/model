import { useUnit } from 'effector-react';
import { navigate } from '../models/router';
import { useEffect } from 'react';

export const CheckoutScreen = () => {
  const go = useUnit(navigate);

  useEffect(() => {
    const t = setTimeout(() => {
      go('menu');
    }, 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white flex flex-col justify-center items-center text-center p-6 shadow-lg">
      <div className="text-8xl mb-8 animate-bounce">🎉</div>
      <h1 className="text-3xl font-black mb-4">Order Placed!</h1>
      <p className="text-gray-500 mb-10 text-lg">
        Your delicious food is on its way.
      </p>
      <button
        className="w-full bg-[#ff6900] text-white py-4 rounded-2xl text-lg font-bold shadow-lg shadow-orange-100 active:scale-95 transition-all"
        onClick={() => go('menu')}
      >
        Back to Menu
      </button>
    </div>
  );
};
