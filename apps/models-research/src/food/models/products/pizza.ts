import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import {
  productTrait,
  sizeFacet,
  doughFacet,
  ingredientsFacet,
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
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
    dough: doughFacet,
    ingredients: ingredientsFacet,
  },
  init: (data: any) => ({
    size: { $size: data.defaultSize },
    dough: { $dough: data.defaultDough },
  }),
  impl: (input, facets) => {
    // 2. Initialize Product Metadata
    // No need to sample if we return them in the structure
    // But name/description are in extra, needs to be in product facet.

    // 3. Price Calculation Logic
    const $sizeCost = combine(facets.size.$size, input.sizes, (id, sizes) => {
      return sizes.find((s) => s.id === id)?.price || 0;
    });

    const $extrasCost = combine(
      facets.ingredients.$selectedExtras,
      input.extraIngredients,
      (selected, extras) => {
        return extras.reduce((sum, ing) => {
          if (selected[ing.id]) return sum + ing.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      input.basePrice,
      $sizeCost,
      $extrasCost,
      (base, size, extras) => base + size + extras,
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
