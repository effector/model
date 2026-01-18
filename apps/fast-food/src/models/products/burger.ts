import { model, define } from '@effector-model/core-experimental';
import { combine, is } from 'effector';
import { productTrait, ingredientsFacet } from '../traits';
import { IngredientOption } from '../../types';

export const burgerModel = model({
  input: {
    type: define.store('burger'),
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    composition: define.store(''),
    image: define.store(''),
    nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
      null,
    ),
    extraIngredients: define.store<IngredientOption[]>([]),
    defaultIngredients: define.store<{ id: string; name: string }[]>([]),
  },
  variant: {
    source: (input: any) => input.type,
    cases: {
      burger: (t: any) => t === 'burger',
    },
  },
  facets: {
    product: productTrait,
    ingredients: ingredientsFacet,
  },
  init: () => ({}),
  impl: (input, facets) => {
    const $extrasCost = combine(
      facets.ingredients.$selectedExtras,
      input.extraIngredients,
      (selected, extras) => {
        const options = is.store(extras) ? (extras as any).getState() : extras;
        const list = Array.isArray(options)
          ? options
          : Object.values(options || {});
        return (list || []).reduce((sum: number, ing: any) => {
          if (selected[ing.id]) return sum + ing.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      input.basePrice,
      $extrasCost,
      (base, extras) => {
        const b = is.store(base) ? (base as any).getState() : base;
        const e = is.store(extras) ? (extras as any).getState() : extras;
        return (b || 0) + (e || 0);
      },
    );

    return {
      product: {
        $name: input.name,
        $description: input.description,
        $composition: input.composition,
        $image: input.image,
        $nutritionalInfo: input.nutritionalInfo,
        $price: $calculatedPrice,
      },
    };
  },
});
