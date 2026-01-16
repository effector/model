import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import {
  productTrait,
  sizeFacet,
  doughFacet,
  ingredientsFacet,
  setupProductTrait,
  setupIngredientsFacet,
} from '../traits';

export const pizzaModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    ingredientPrices: define.store<Record<string, number>>({}),
    sizePrices: define.store<Record<string, number>>({}),
    defaultSize: define.store('30'),
    defaultDough: define.store('Traditional'),
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
    dough: doughFacet,
    ingredients: ingredientsFacet,
  },
  impl: (ctx: any) => {
    // 1. Setup Reusable Logic
    setupProductTrait(ctx.product);
    setupIngredientsFacet(ctx.ingredients);

    // 2. Initialize Product Metadata
    sample({ source: ctx.name, target: ctx.product.$name });
    sample({ source: ctx.description, target: ctx.product.$description });
    sample({ source: ctx.defaultSize, target: ctx.size.$size });
    sample({ source: ctx.defaultDough, target: ctx.dough.$dough });

    // 3. Price Calculation Logic
    // Cost = Base + Size + Ingredients

    const $sizeCost = combine(
      ctx.size.$size,
      ctx.sizePrices,
      (size, prices) => prices[size] || 0,
    );

    const $ingredientsCost = combine(
      ctx.ingredients.$selected,
      ctx.ingredientPrices,
      (selected, prices) => {
        return Object.keys(selected).reduce((sum, id) => {
          return sum + (prices[id] || 0);
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      ctx.basePrice,
      $sizeCost,
      $ingredientsCost,
      (base, size, ing) => base + size + ing,
    );

    // Update the ProductTrait's price store
    sample({
      source: $calculatedPrice,
      target: ctx.product.$price,
    });
  },
});
