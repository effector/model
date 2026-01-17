import { model, define } from '@effector-model/core-experimental';
import { sample, combine, is } from 'effector';
import { productTrait, sizeFacet, ingredientsFacet } from '../traits';
import { SizeOption, IngredientOption } from '../../types';

export const coffeeModel = model({
  input: {
    type: define.store('coffee'),
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    image: define.store(''),
    nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
      null,
    ),
    sizes: define.store<SizeOption[]>([]),
    additions: define.store<IngredientOption[]>([]),
    defaultSize: define.store<string | undefined>(undefined),
  },
  variant: {
    source: (input: any) => input.type,
    cases: {
      coffee: (t: any) => t === 'coffee',
    },
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
    ingredients: ingredientsFacet,
  },
  init: (data: any) => ({
    size: { $size: data.defaultSize, $options: data.sizes || [] },
  }),
  impl: (input, facets) => {
    const $sizeCost = combine(facets.size.$size, input.sizes, (id, sizes) => {
      const options = is.store(sizes) ? (sizes as any).getState() : sizes;
      const list = Array.isArray(options)
        ? options
        : Object.values(options || {});
      return (list || []).find((s: any) => s.id === id)?.price || 0;
    });

    const $additionsCost = combine(
      facets.ingredients.$selectedExtras,
      input.additions,
      (selected, additions) => {
        const options = is.store(additions)
          ? (additions as any).getState()
          : additions;
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
      $sizeCost,
      $additionsCost,
      (base, size, add) => {
        const b = is.store(base) ? (base as any).getState() : base;
        const s = is.store(size) ? (size as any).getState() : size;
        const a = is.store(add) ? (add as any).getState() : add;
        return (b || 0) + (s || 0) + (a || 0);
      },
    );

    return {
      product: {
        $name: input.name,
        $description: input.description,
        $image: input.image,
        $nutritionalInfo: input.nutritionalInfo,
        $price: $calculatedPrice,
      },
      size: {
        $options: input.sizes,
      },
    };
  },
});
