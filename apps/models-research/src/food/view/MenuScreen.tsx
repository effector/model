import { useUnit } from 'effector-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { openProduct, openCart, menuBack, appInstance } from '../models/app';
import { cartModel, $totalPrice } from '../models/cart';
import { RESTAURANTS } from './RestaurantScreen';

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
  const open = useUnit(openProduct);
  const toCart = useUnit(openCart);
  const back = useUnit(menuBack);
  const cartItems = useUnit(cartModel.$items);
  const total = useUnit($totalPrice);
  const params = useUnit(appInstance.input.$params);
  const restaurantId = params.restaurantId;
  const [activeTab, setActiveTab] = useState('pizza');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const restaurant = useMemo(
    () => RESTAURANTS.find((r) => r.id === restaurantId) || RESTAURANTS[0],
    [restaurantId],
  );

  const categories = useMemo(() => {
    // If restaurant 2, shuffle/filter items to simulate isolation
    if (restaurantId === '2') {
      return CATEGORIES.map((cat) => ({
        ...cat,
        items: cat.items.filter((_, i) => i % 2 === 0), // Simple filter for demo
      }));
    }
    return CATEGORIES;
  }, [restaurantId]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const tabsEl = tabsRef.current;
      if (!tabsEl) return;

      const tabsRect = tabsEl.getBoundingClientRect();
      const threshold = tabsRect.bottom + 10;

      let currentActive = categories[0].id;

      for (const cat of categories) {
        const el = document.getElementById(cat.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            currentActive = cat.id;
          } else {
            break;
          }
        }
      }

      setActiveTab(currentActive);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    const headerEl = headerRef.current;
    const tabsEl = tabsRef.current;
    const container = scrollContainerRef.current;

    if (el && headerEl && tabsEl && container) {
      isScrollingRef.current = true;
      setActiveTab(id);

      const stickyHeight = headerEl.offsetHeight + tabsEl.offsetHeight;
      const containerRect = container.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPositionInContainer = elementRect - containerRect;

      const newScrollTop =
        container.scrollTop + elementPositionInContainer - stickyHeight;

      container.scrollTo({
        top: newScrollTop,
        behavior: 'auto',
      });

      setTimeout(() => {
        isScrollingRef.current = false;
      }, 50);
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto no-scrollbar bg-white relative flex flex-col"
    >
      <div className="sticky top-0 z-20 bg-white">
        <div
          ref={headerRef}
          className="px-4 py-4 border-b border-[#e2e2e9] flex justify-between items-center"
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => back()}
              className="text-2xl p-1 active:scale-90 transition-transform"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-[#333]">Меню</h1>
          </div>

          <div
            className="flex-1 text-center cursor-pointer px-2"
            onClick={() => back()}
          >
            <span className="text-[#ff6900] text-sm font-bold whitespace-nowrap">
              {restaurant.name} ▾
            </span>
          </div>

          <button
            onClick={() => toCart()}
            className="bg-[#ff6900] text-white p-2 rounded-full shadow-lg shadow-orange-200 active:scale-90 transition-all flex items-center gap-2 pr-5 pl-4"
          >
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <span className="font-bold text-base leading-none">{total} ₽</span>
          </button>
        </div>

        <div
          ref={tabsRef}
          className="flex overflow-x-auto px-4 py-3 gap-2 border-b border-[#e2e2e9] no-scrollbar"
        >
          {categories.map((cat) => (
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
      </div>

      <div className="px-4 pb-24 flex-1">
        {categories.map((cat) => (
          <div key={cat.id} id={cat.id} className="scroll-mt-[120px]">
            <h2 className="text-2xl font-bold pt-4 pb-4">{cat.title}</h2>
            <div className="grid grid-cols-2 gap-3">
              {cat.items.map((item: any, idx: number) => (
                <ProductCard
                  key={item.name}
                  item={item}
                  index={idx}
                  category={cat.id}
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

const ProductCard = ({ item, onAdd, index, category }: any) => {
  const seed = `${category}-${index}`;
  const bg = `https://picsum.photos/seed/${seed}/500/500`;

  return (
    <div
      className="flex flex-col bg-white rounded-[24px] overflow-hidden border border-[#e2e2e9] p-3 h-full cursor-pointer active:scale-[0.98] transition-transform shadow-sm hover:shadow-md"
      onClick={onAdd}
    >
      <img
        src={bg}
        alt={item.name}
        className="w-full aspect-square object-cover mb-3 rounded-xl"
      />
      <div className="flex-1 flex flex-col px-1">
        <div className="font-bold text-[1rem] mb-1 line-clamp-2 leading-tight text-[#333]">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 line-clamp-3 mb-3 flex-1 leading-normal">
          {item.description}
        </div>
        <div className="flex justify-start items-center mt-auto pb-1">
          <div className="bg-[#fff0e6] text-[#e05c00] px-4 py-1.5 rounded-full font-black text-[0.8rem]">
            от {item.basePrice} ₽
          </div>
        </div>
      </div>
    </div>
  );
};
