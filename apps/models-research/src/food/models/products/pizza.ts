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
import { SizeOption, IngredientOption } from '../../types';

export const pizzaModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    sizes: define.store<SizeOption[]>([]),
    doughs: define.store<{ id: string; label: string }[]>([]),
    extraIngredients: define.store<IngredientOption[]>([]),
    defaultIngredients: define.store<{ id: string; name: string }[]>([]),
    defaultSize: define.store(''),
    defaultDough: define.store(''),
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
    // Cost = Base + Size + Extras (Removed defaults do not reduce price)

    const $sizeCost = combine(
      ctx.size.$size,
      ctx.sizes,
      (id: string, sizes: SizeOption[]) => {
        return sizes.find((s) => s.id === id)?.price || 0;
      },
    );

    const $extrasCost = combine(
      ctx.ingredients.$selectedExtras,
      ctx.extraIngredients,
      (selected: Record<string, boolean>, extras: IngredientOption[]) => {
        return extras.reduce((sum, ing) => {
          if (selected[ing.id]) return sum + ing.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      ctx.basePrice,
      $sizeCost,
      $extrasCost,
      (base, size, extras) => base + size + extras,
    );

    // Update the ProductTrait's price store
    sample({
      source: $calculatedPrice,
      target: ctx.product.$price,
    });
  },
});
