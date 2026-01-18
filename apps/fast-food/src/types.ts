export type ProductType =
  | 'pizza'
  | 'drink'
  | 'coffee'
  | 'cocktail'
  | 'sauce'
  | 'burger'
  | 'bucket'
  | 'snack'
  | 'twister';

export interface BaseProductData {
  type: ProductType;
  name: string;
  description: string;
  image?: string;
  basePrice: number;
  restaurantId?: string;
  nutritionalInfo?: {
    calories: number;
    weight: number;
  };
}

export interface SizeOption {
  id: string;
  label: string; // "30 cm", "0.5 L", "M"
  price: number;
}

export interface IngredientOption {
  id: string;
  name: string;
  price: number;
  icon?: string;
}

export interface PizzaData extends BaseProductData {
  type: 'pizza';
  sizes: SizeOption[];
  doughs: { id: string; label: string }[];
  defaultIngredients: { id: string; name: string }[]; // Removable (price 0)
  extraIngredients: IngredientOption[]; // Addable (price > 0)
  defaultSize: string;
  defaultDough: string;
}

export interface DrinkData extends BaseProductData {
  type: 'drink';
  sizes: SizeOption[];
  defaultSize: string;
}

export interface CoffeeData extends BaseProductData {
  type: 'coffee';
  sizes: SizeOption[];
  additions: IngredientOption[]; // Sugar, Syrup
  defaultSize: string;
}

export interface CocktailData extends BaseProductData {
  type: 'cocktail';
  decorations: IngredientOption[];
}

export interface SauceData extends BaseProductData {
  type: 'sauce';
}

export interface BurgerData extends BaseProductData {
  type: 'burger';
  defaultIngredients: { id: string; name: string }[];
  extraIngredients: IngredientOption[];
}

export interface BucketData extends BaseProductData {
  type: 'bucket';
  sizes: SizeOption[];
  defaultSize: string;
}

export interface SnackData extends BaseProductData {
  type: 'snack';
  sizes: SizeOption[];
  defaultSize: string;
}

export interface TwisterData extends BaseProductData {
  type: 'twister';
  defaultIngredients: { id: string; name: string }[];
  extraIngredients: IngredientOption[];
}

export type ProductData =
  | PizzaData
  | DrinkData
  | CoffeeData
  | CocktailData
  | SauceData
  | BurgerData
  | BucketData
  | SnackData
  | TwisterData;

export type MenuData = ProductData[];
