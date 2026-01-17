import { useUnit } from 'effector-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createListApi } from '@effector-model/core-experimental';
import {
  openProduct,
  openCart,
  menuBack,
  selectRestaurant,
} from '../models/app';
import { cartModel, $totalPrice } from '../models/cart';
import { RESTAURANTS } from '../data/restaurants';

import dodoPizzas from '../data/dodo/pizzas.json';
import dodoDrinks from '../data/dodo/drinks.json';
import dodoCoffee from '../data/dodo/coffee.json';
import dodoCocktails from '../data/dodo/cocktails.json';
import dodoSauces from '../data/dodo/sauces.json';
import dodoSnacks from '../data/dodo/snacks.json';

import kfcBurgers from '../data/kfc/burgers.json';
import kfcTwisters from '../data/kfc/twisters.json';
import kfcBuckets from '../data/kfc/buckets.json';
import kfcSnacks from '../data/kfc/snacks.json';
import kfcDrinks from '../data/kfc/drinks.json';
import kfcSauces from '../data/kfc/sauces.json';

const DODO_CATEGORIES = [
  { id: 'pizza', title: 'Пицца', items: dodoPizzas },
  { id: 'snack', title: 'Закуски', items: dodoSnacks },
  { id: 'coffee', title: 'Кофе', items: dodoCoffee },
  { id: 'drinks', title: 'Напитки', items: dodoDrinks },
  { id: 'cocktails', title: 'Коктейли', items: dodoCocktails },
  { id: 'sauces', title: 'Соусы', items: dodoSauces },
];

const KFC_CATEGORIES = [
  { id: 'burger', title: 'Бургеры', items: kfcBurgers },
  { id: 'twister', title: 'Твистеры', items: kfcTwisters },
  { id: 'bucket', title: 'Баскеты', items: kfcBuckets },
  { id: 'snack', title: 'Снэки', items: kfcSnacks },
  { id: 'drinks', title: 'Напитки', items: kfcDrinks },
  { id: 'sauces', title: 'Соусы', items: kfcSauces },
];

interface RestaurantProps {
  id: string;
  variant: 'list' | 'full';
}

export const Restaurant = ({ id, variant }: RestaurantProps) => {
  const restaurant = useMemo(
    () => RESTAURANTS.find((r) => r.id === id) || RESTAURANTS[0],
    [id],
  );

  if (!restaurant) return null;

  if (variant === 'list') {
    return <RestaurantCard restaurant={restaurant} />;
  }

  return <RestaurantMenu restaurant={restaurant} />;
};

const RestaurantCard = ({ restaurant }: { restaurant: any }) => {
  const select = useUnit(selectRestaurant);

  return (
    <div
      className="group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98] transition-all duration-300 cursor-pointer border border-white"
      onClick={() => select(restaurant.id)}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {restaurant.tags.map((tag: string) => (
            <span
              key={tag}
              className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-[#333]"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg flex items-center gap-1.5">
          <span className="text-[#ff6900] text-sm font-black">
            ★ {restaurant.rating}
          </span>
          <span className="text-gray-400 text-[10px] font-bold">
            ({restaurant.reviews})
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-xl font-black text-[#333] leading-tight group-hover:text-[#ff6900] transition-colors">
            {restaurant.name}
          </h2>
          <div className="bg-gray-50 px-3 py-1 rounded-xl text-[10px] font-black text-gray-500 uppercase tracking-tighter">
            {restaurant.time}
          </div>
        </div>
        <p className="text-gray-400 text-sm font-medium">
          {restaurant.address}
        </p>
      </div>
    </div>
  );
};

const RestaurantMenu = ({ restaurant }: { restaurant: any }) => {
  const open = useUnit(openProduct);
  const toCart = useUnit(openCart);
  const back = useUnit(menuBack);
  const cartState = useUnit(cartModel.$state);

  const cartView = useMemo(() => {
    return createListApi(cartModel).filter((item: any) =>
      item.facets.product.$restaurantId.map(
        (id: string) => id === restaurant.id,
      ),
    );
  }, [restaurant.id]);

  const filteredIds = useUnit(cartView.$items);

  const total = useMemo(() => {
    return filteredIds.reduce((sum: number, id: string) => {
      const itemState = cartState[id];
      if (!itemState) return sum;

      const price = itemState.facets?.product?.$price || 0;
      const quantity = itemState.facets?.product?.$quantity || 0;
      const isDeleted = itemState.facets?.product?.$isDeleted || false;

      if (isDeleted) return sum;
      return sum + price * quantity;
    }, 0);
  }, [filteredIds, cartState]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  const categories = useMemo(() => {
    if (restaurant.id === 'kfc') return KFC_CATEGORIES;
    return DODO_CATEGORIES;
  }, [restaurant.id]);

  const [activeTab, setActiveTab] = useState(categories[0].id);

  useEffect(() => {
    setActiveTab(categories[0].id);
  }, [categories]);

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
