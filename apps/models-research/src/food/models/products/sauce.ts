import { model, define } from '@effector-model/core-experimental';
import { sample, is } from 'effector';
import { productTrait } from '../traits';

export const sauceModel = model({
  input: {
    type: define.store('sauce'),
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    composition: define.store(''),
    image: define.store(''),
    nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
      null,
    ),
  },
  variant: {
    source: (input: any) => input.type,
    cases: {
      sauce: (t: any) => t === 'sauce',
    },
  },
  facets: {
    product: productTrait,
  },
  impl: (input, facets) => {
    return {
      product: {
        $name: input.name,
        $description: input.description,
        $composition: input.composition,
        $image: input.image,
        $nutritionalInfo: input.nutritionalInfo,
        $price: is.store(input.basePrice)
          ? (input.basePrice as any).getState()
          : input.basePrice,
      },
    };
  },
});
