export type Route =
  | { name: 'restaurants' }
  | { name: 'menu'; restaurant: string }
  | { name: 'order'; restaurant: string }
  | { name: 'dish'; restaurant: string; dish: string };

export type RestaurantRoute = Extract<Route, { restaurant: string }>;

export type AdditiveSimple = {
  name: string;
  amountPerItem: 'single' | 'many';
  price: number;
};

export type AdditiveSelect = {
  name: string;
  required: boolean;
  options: AdditiveSimple[];
};

export type Additive = AdditiveSimple | AdditiveSelect;

export type Dish = {
  name: string;
  description: string;
  price: number;
  additives: Additive[];
};

export type Restaurant = {
  name: string;
  description: string;
  category: string[];
  dishes: Dish[];
};

export type AdditiveOrder = {
  additive: string;
  choice: string;
  amount: number;
};

export type DishOrder = {
  dish: string;
  additives: AdditiveOrder[];
};

export type Order = {
  restaurant: string;
  dishes: DishOrder[];
};
