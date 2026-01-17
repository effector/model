import React from 'react';

export interface RestaurantData {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviews: string;
  time: string;
  image: string;
  tags: string[];
  themeColor: string;
  themeColorBg: string;
}

export const RESTAURANTS: RestaurantData[] = [
  {
    id: 'dodo',
    name: 'Dodo Pizza',
    address: 'ul. Amurskaya 1A',
    rating: 4.8,
    reviews: '1.2k',
    time: '35 мин',
    image: 'https://picsum.photos/seed/dodo1/600/400',
    tags: ['Пицца', 'Паста'],
    themeColor: '#ff6900',
    themeColorBg: '#fff0e6',
  },
  {
    id: 'kfc',
    name: 'KFC',
    address: 'ul. Tverskaya 10',
    rating: 4.6,
    reviews: '3.1k',
    time: '25 мин',
    image: 'https://picsum.photos/seed/kfc1/600/400',
    tags: ['Бургеры', 'Курица'],
    themeColor: '#e4002b',
    themeColorBg: '#fce5e8',
  },
];

export const getRestaurantTheme = (id?: string) => {
  const r = RESTAURANTS.find((x) => x.id === id) || RESTAURANTS[0];
  return {
    '--theme-color': r.themeColor,
    '--theme-color-bg': r.themeColorBg,
  } as React.CSSProperties;
};
