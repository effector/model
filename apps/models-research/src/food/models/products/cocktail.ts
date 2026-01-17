import { model, define } from '@effector-model/core-experimental';
import { sample, combine, is } from 'effector';
import { productTrait, ingredientsFacet } from '../traits';
import { IngredientOption } from '../../types';

export const cocktailModel = model({
  input: {
    type: define.store('cocktail'),
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    composition: define.store(''),
    image: define.store(''),
    nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
      null,
    ),
    decorations: define.store<IngredientOption[]>([]),
  },
  variant: {
    source: (input: any) => input.type,
    cases: {
      cocktail: (t: any) => t === 'cocktail',
    },
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
        const options = is.store(decorations)
          ? (decorations as any).getState()
          : decorations;
        const list = Array.isArray(options)
          ? options
          : Object.values(options || {});
        return (list || []).reduce((sum: number, item: any) => {
          if (selected[item.id]) return sum + item.price;
          return sum;
        }, 0);
      },
    );

    const $calculatedPrice = combine(
      input.basePrice,
      $decorationsCost,
      (base, decor) => {
        const b = is.store(base) ? (base as any).getState() : base;
        const d = is.store(decor) ? (decor as any).getState() : decor;
        return (b || 0) + (d || 0);
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
