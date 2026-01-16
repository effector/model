import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import {
  productTrait,
  ingredientsFacet,
  setupProductTrait,
  setupIngredientsFacet,
} from '../traits';
import { IngredientOption } from '../../types';

export const cocktailModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    decorations: define.store<IngredientOption[]>([]),
  },
  facets: {
    product: productTrait,
    ingredients: ingredientsFacet,
  },
  impl: (ctx: any) => {
    setupProductTrait(ctx.product);
    setupIngredientsFacet(ctx.ingredients);

    sample({ source: ctx.name, target: ctx.product.$name });
    sample({ source: ctx.description, target: ctx.product.$description });

    const $decorationsCost = combine(
      ctx.ingredients.$selectedExtras,
      ctx.decorations,
      (selected: Record<string, boolean>, decorations: IngredientOption[]) => {
        return decorations.reduce((sum, item) => {
          if (selected[item.id]) return sum + item.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      ctx.basePrice,
      $decorationsCost,
      (base, decor) => base + decor,
    );

    sample({
      source: $calculatedPrice,
      target: ctx.product.$price,
    });
  },
});
