import { model, define } from '@effector-model/core-experimental';
import { sample } from 'effector';
import { productTrait, setupProductTrait } from '../traits';

export const sauceModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
  },
  facets: {
    product: productTrait,
  },
  impl: (ctx: any) => {
    setupProductTrait(ctx.product);
    sample({ source: ctx.name, target: ctx.product.$name });
    sample({ source: ctx.description, target: ctx.product.$description });
    sample({ source: ctx.basePrice, target: ctx.product.$price });
  },
});
