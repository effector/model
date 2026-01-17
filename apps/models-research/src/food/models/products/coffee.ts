import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import { productTrait, sizeFacet, ingredientsFacet } from '../traits';
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
  init: (data: any) => ({
    size: { $size: data.defaultSize },
  }),
  impl: (input, facets) => {
    const $sizeCost = combine(facets.size.$size, input.sizes, (id, sizes) => {
      return sizes.find((s) => s.id === id)?.price || 0;
    });

    const $additionsCost = combine(
      facets.ingredients.$selectedExtras,
      input.additions,
      (selected, additions) => {
        return additions.reduce((sum, item) => {
          if (selected[item.id]) return sum + item.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      input.basePrice,
      $sizeCost,
      $additionsCost,
      (base, size, add) => base + size + add,
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
