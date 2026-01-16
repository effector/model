import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import {
  productTrait,
  sizeFacet,
  ingredientsFacet,
  setupProductTrait,
  setupIngredientsFacet,
} from '../traits';
import { SizeOption, IngredientOption } from '../../types';

export const coffeeModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    sizes: define.store<SizeOption[]>([]),
    additions: define.store<IngredientOption[]>([]),
    defaultSize: define.store(''),
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
    ingredients: ingredientsFacet,
  },
  impl: (ctx: any) => {
    setupProductTrait(ctx.product);
    setupIngredientsFacet(ctx.ingredients);

    sample({ source: ctx.name, target: ctx.product.$name });
    sample({ source: ctx.description, target: ctx.product.$description });
    sample({ source: ctx.defaultSize, target: ctx.size.$size });

    const $sizeCost = combine(
      ctx.size.$size,
      ctx.sizes,
      (id: string, sizes: SizeOption[]) => {
        return sizes.find((s) => s.id === id)?.price || 0;
      },
    );

    const $additionsCost = combine(
      ctx.ingredients.$selectedExtras,
      ctx.additions,
      (selected: Record<string, boolean>, additions: IngredientOption[]) => {
        return additions.reduce((sum, item) => {
          if (selected[item.id]) return sum + item.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      ctx.basePrice,
      $sizeCost,
      $additionsCost,
      (base, size, add) => base + size + add,
    );

    sample({
      source: $calculatedPrice,
      target: ctx.product.$price,
    });
  },
});
