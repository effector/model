import { useUnit } from 'effector-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createCursor } from '@effector-model/core-experimental';
import { useApp } from './AppContext';
import { RESTAURANTS, getRestaurantTheme } from '../data/restaurants';
import { MainButton } from './components/Common';

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
  { id: 'dodo_pizza', title: 'Пицца', items: dodoPizzas },
  { id: 'dodo_snack', title: 'Закуски', items: dodoSnacks },
  { id: 'dodo_coffee', title: 'Кофе', items: dodoCoffee },
  { id: 'dodo_drinks', title: 'Напитки', items: dodoDrinks },
  { id: 'dodo_cocktails', title: 'Коктейли', items: dodoCocktails },
  { id: 'dodo_sauces', title: 'Соусы', items: dodoSauces },
];

const KFC_CATEGORIES = [
  { id: 'kfc_burger', title: 'Бургеры', items: kfcBurgers },
  { id: 'kfc_twister', title: 'Твистеры', items: kfcTwisters },
  { id: 'kfc_bucket', title: 'Баскеты', items: kfcBuckets },
  { id: 'kfc_snack', title: 'Снэки', items: kfcSnacks },
  { id: 'kfc_drinks', title: 'Напитки', items: kfcDrinks },
  { id: 'kfc_sauces', title: 'Соусы', items: kfcSauces },
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
  const { events } = useApp();
  const select = useUnit(events.selectRestaurant);

  return (
    <div
      className="group bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl active:scale-[0.98] transition-all duration-300 cursor-pointer border border-white"
      onClick={() => select(restaurant.id)}
      style={getRestaurantTheme(restaurant.id)}
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
          <span className="text-[var(--theme-color,#ff6900)] text-sm font-black">
            ★ {restaurant.rating}
          </span>
          <span className="text-gray-400 text-[10px] font-bold">
            ({restaurant.reviews})
          </span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-1">
          <h2 className="text-xl font-black text-[#333] leading-tight group-hover:text-[var(--theme-color,#ff6900)] transition-colors">
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
  const { events, cartModel } = useApp();
  const open = useUnit(events.openProduct);
  const toCart = useUnit(events.openCart);
  const back = useUnit(events.menuBack);

  const cartView = useMemo(() => {
    return createCursor(cartModel).filter((item: any) =>
      item.facets.product.$restaurantId.map(
        (id: string) => id === restaurant.id,
      ),
    );
  }, [restaurant.id, cartModel]);

  const $itemTotals = useMemo(() => {
    return cartView.map((item: any) => {
      const product = item.facets.product;
      const price = product?.$price || 0;
      const quantity = product?.$quantity || 0;
      const isDeleted = product?.$isDeleted || false;

      return isDeleted ? 0 : price * quantity;
    });
  }, [cartView]);

  const itemTotals = useUnit($itemTotals);
  const total = itemTotals.reduce((a, b) => a + b, 0);

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
      // Increased threshold to be more forgiving and prevent flickering
      const threshold = tabsRect.bottom + 25;

      // Check if we are at the bottom of the scroll container
      const isAtBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight <
        50;

      if (isAtBottom) {
        setActiveTab(categories[categories.length - 1].id);
        return;
      }

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
      className="h-full relative bg-white overflow-hidden"
      style={getRestaurantTheme(restaurant.id)}
    >
      <div
        ref={scrollContainerRef}
        className="h-full overflow-y-auto no-scrollbar flex flex-col"
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
              <span className="text-[var(--theme-color,#ff6900)] text-xl font-bold whitespace-nowrap">
                {restaurant.name} ▾
              </span>
            </div>
            <div className="w-10"></div>
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

      {total > 0 && (
        <div className="absolute bottom-6 left-0 w-full flex justify-center z-30 pointer-events-none px-4">
          <MainButton
            onClick={() => toCart()}
            price={total}
            className="pointer-events-auto"
          />
        </div>
      )}
    </div>
  );
};

const ProductCard = ({ item, onAdd, index, category }: any) => {
  const seed = `${category}-${index}`;
  const bg = `https://picsum.photos/seed/${seed}/500/500`;

  return (
    <div
      className="group flex flex-col bg-white rounded-[24px] overflow-hidden border border-[#e2e2e9] p-3 h-full cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:shadow-md"
      onClick={onAdd}
    >
      <img
        src={bg}
        alt={item.name}
        className="w-full aspect-square object-cover mb-3 rounded-xl"
      />
      <div className="flex-1 flex flex-col px-1">
        <div className="font-bold text-[1rem] mb-1 line-clamp-2 leading-tight text-[#333] group-hover:text-[var(--theme-color,#ff6900)] transition-colors">
          {item.name}
        </div>
        <div className="text-xs text-gray-400 line-clamp-3 mb-3 flex-1 leading-normal">
          {item.description}
        </div>
        <div className="flex justify-start items-center mt-auto pb-1">
          <div className="bg-[var(--theme-color-bg,#fff0e6)] text-[var(--theme-color,#ff6900)] px-4 py-1.5 rounded-full font-black text-[0.8rem]">
            от {item.basePrice} ₽
          </div>
        </div>
      </div>
    </div>
  );
};
