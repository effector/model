import { createEvent } from 'effector';
import { keyval, union } from '@effector-model/core-experimental';
import { pizzaModel } from './products/pizza';
import { drinkModel } from './products/drink';
import { coffeeModel } from './products/coffee';
import { cocktailModel } from './products/cocktail';
import { sauceModel } from './products/sauce';

export const productUnion = union({
  pizza: pizzaModel,
  drink: drinkModel,
  coffee: coffeeModel,
  cocktail: cocktailModel,
  sauce: sauceModel,
});

export const cartModel = keyval({
  model: productUnion,
});

export const cartApi = cartModel.getItem(createEvent<{ id: string }>());

export const $totalPrice = cartModel.$state.map((state) => {
  return Object.values(state).reduce((sum: number, item: any) => {
    const price = item?.facets?.product?.$price || 0;
    const quantity = item?.facets?.product?.$quantity || 0;
    const isDeleted = item?.facets?.product?.$isDeleted || false;

    if (isDeleted) return sum;
    return sum + price * quantity;
  }, 0);
});
