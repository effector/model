import { useUnit } from 'effector-react';
import { useState, useEffect } from 'react';
import { openConfigurator } from '../models/draft';
import { navigate } from '../models/router';
import { cartModel, $totalPrice } from '../models/cart';

import pizzas from '../data/pizzas.json';
import drinks from '../data/drinks.json';
import coffee from '../data/coffee.json';
import cocktails from '../data/cocktails.json';
import sauces from '../data/sauces.json';

const CATEGORIES = [
  { id: 'pizza', title: 'Пицца', items: pizzas },
  { id: 'coffee', title: 'Кофе', items: coffee },
  { id: 'drinks', title: 'Напитки', items: drinks },
  { id: 'cocktails', title: 'Коктейли', items: cocktails },
  { id: 'sauces', title: 'Соусы', items: sauces },
];

export const MenuScreen = () => {
  const open = useUnit(openConfigurator);
  const goToCart = useUnit(navigate);
  const total = useUnit($totalPrice);
  const cartItems = useUnit(cartModel.$items);
  const [activeTab, setActiveTab] = useState('pizza');

  useEffect(() => {
    const handleScroll = () => {
      const offsets = CATEGORIES.map((cat) => {
        const el = document.getElementById(cat.id);
        return { id: cat.id, offset: el ? el.getBoundingClientRect().top : 0 };
      });

      const active = offsets.find((o) => o.offset > 0 && o.offset < 300);
      if (active) setActiveTab(active.id);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 110,
        behavior: 'smooth',
      });
      setActiveTab(id);
    }
  };

  return (
    <div className="max-w-[480px] mx-auto min-h-screen bg-white relative shadow-lg">
      <div className="sticky top-0 bg-white z-20 px-4 py-4 border-b border-[#e2e2e9] flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold">Menu</h1>
          <span
            className="text-[#ff6900] cursor-pointer text-xs font-bold"
            onClick={() => goToCart('restaurant')}
          >
            Moscow ▾
          </span>
        </div>
        <button
          onClick={() => goToCart('cart')}
          className="relative p-2 bg-gray-50 rounded-full hover:bg-gray-100 active:scale-90 transition-all"
        >
          <span className="text-xl">🛒</span>
          {cartItems.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ff6900] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="sticky top-[61px] bg-white z-10 flex overflow-x-auto px-4 py-3 gap-2 border-b border-[#e2e2e9] no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === cat.id
                ? 'bg-[#333] text-white'
                : 'bg-gray-100 text-[#333]'
            }`}
            onClick={() => scrollTo(cat.id)}
          >
            {cat.title}
          </button>
        ))}
      </div>

      <div className="px-4 pb-24">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} id={cat.id} className="scroll-mt-[120px]">
            <h2 className="text-2xl font-bold my-6">{cat.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {cat.items.map((item: any) => (
                <ProductCard
                  key={item.name}
                  item={item}
                  onAdd={() => open({ mode: 'new', data: item })}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductCard = ({ item, onAdd }: any) => {
  const bg = `https://placehold.co/400x400/fff0e6/ff6900?text=${encodeURIComponent(
    item.name.split(' ')[0],
  )}`;

  return (
    <div
      className="flex flex-col bg-white rounded-2xl overflow-hidden border border-[#e2e2e9] p-3 h-full cursor-pointer active:scale-[0.98] transition-transform"
      onClick={onAdd}
    >
      <img
        src={bg}
        alt={item.name}
        className="w-full aspect-square object-contain mb-3"
      />
      <div className="flex-1 flex flex-col">
        <div className="font-semibold text-[0.95rem] mb-1 line-clamp-2 leading-tight">
          {item.name}
        </div>
        <div className="text-xs text-gray-500 line-clamp-3 mb-3 flex-1">
          {item.description}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <div className="bg-[#fff0e6] text-[#e05c00] px-2 py-1 rounded-lg font-bold text-xs">
            от {item.basePrice} ₽
          </div>
          <button className="bg-[#fff0e6] text-[#ff6900] w-8 h-8 rounded-full font-bold flex items-center justify-center">
            +
          </button>
        </div>
      </div>
    </div>
  );
};
