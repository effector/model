export interface ProductInputBase {
  name: string;
  description: string;
  basePrice: number;
  sizePrices: Record<string, number>;
  defaultSize: string;
}

export interface PizzaInput extends ProductInputBase {
  ingredientPrices: Record<string, number>;
  defaultDough: string;
}

export interface DrinkInput extends ProductInputBase {}

export type ShopData = {
  pizzas: PizzaInput[];
  drinks: DrinkInput[];
};
