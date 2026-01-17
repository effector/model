import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import { productTrait, sizeFacet } from '../traits';
import { SizeOption } from '../../types';

export const drinkModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    sizes: define.store<SizeOption[]>([]),
    defaultSize: define.store(''),
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
  },
  init: (data: any) => ({
    size: { $size: data.defaultSize },
  }),
  impl: (input, facets) => {
    const $sizeCost = combine(facets.size.$size, input.sizes, (id, sizes) => {
      return sizes.find((s) => s.id === id)?.price || 0;
    });

    const $calculatedPrice = combine(
      input.basePrice,
      $sizeCost,
      (base, size) => base + size,
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
