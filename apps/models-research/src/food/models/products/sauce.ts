import { model, define } from '@effector-model/core-experimental';
import { sample } from 'effector';
import { productTrait } from '../traits';

export const sauceModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
  },
  facets: {
    product: productTrait,
  },
  impl: (input, facets) => {
    return {
      product: {
        $name: input.name,
        $description: input.description,
        $price: input.basePrice,
      },
    };
  },
});
