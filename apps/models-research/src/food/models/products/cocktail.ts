import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import { productTrait, ingredientsFacet } from '../traits';
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
  impl: (input, facets) => {
    const $decorationsCost = combine(
      facets.ingredients.$selectedExtras,
      input.decorations,
      (selected, decorations) => {
        return decorations.reduce((sum, item) => {
          if (selected[item.id]) return sum + item.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      input.basePrice,
      $decorationsCost,
      (base, decor) => base + decor,
    );

    return {
      product: {
        $name: input.name,
        $description: input.description,
        $price: $calculatedPrice,
      },
    };
  },
});
