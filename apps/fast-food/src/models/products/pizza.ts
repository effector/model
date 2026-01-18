import { model, define } from '@effector-model/core-experimental';
import { sample, combine, is } from 'effector';
import {
  productTrait,
  sizeFacet,
  doughFacet,
  ingredientsFacet,
} from '../traits';
import { SizeOption, IngredientOption } from '../../types';

export const pizzaModel = model({
  input: {
    type: define.store('pizza'),
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    composition: define.store(''),
    image: define.store(''),
    nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
      null,
    ),
    sizes: define.store<SizeOption[]>([]),
    doughs: define.store<{ id: string; label: string }[]>([]),
    extraIngredients: define.store<IngredientOption[]>([]),
    defaultIngredients: define.store<{ id: string; name: string }[]>([]),
    defaultSize: define.store<string | undefined>(undefined),
    defaultDough: define.store<string | undefined>(undefined),
  },
  variant: {
    source: (input: any) => input.type,
    cases: {
      pizza: (t: any) => t === 'pizza',
    },
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
    dough: doughFacet,
    ingredients: ingredientsFacet,
  },
  init: (data: any) => ({
    size: { $size: data.defaultSize, $options: data.sizes || [] },
    dough: { $dough: data.defaultDough, $options: data.doughs || [] },
  }),
  impl: (input, facets) => {
    // 2. Initialize Product Metadata
    // No need to sample if we return them in the structure
    // But name/description are in extra, needs to be in product facet.

    // 3. Price Calculation Logic
    const $sizeCost = combine(facets.size.$size, input.sizes, (id, sizes) => {
      const options = is.store(sizes) ? (sizes as any).getState() : sizes;
      const list = Array.isArray(options)
        ? options
        : Object.values(options || {});
      return (list || []).find((s: any) => s.id === id)?.price || 0;
    });

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
      $sizeCost,
      $extrasCost,
      (base, size, extras) => {
        const b = is.store(base) ? (base as any).getState() : base;
        const s = is.store(size) ? (size as any).getState() : size;
        const e = is.store(extras) ? (extras as any).getState() : extras;
        return (b || 0) + (s || 0) + (e || 0);
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
      size: {
        $options: input.sizes,
      },
      dough: {
        $options: input.doughs,
      },
    };
  },
});
