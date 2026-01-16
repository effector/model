import { model, define } from '@effector-model/core-experimental';
import { sample, combine } from 'effector';
import { productTrait, sizeFacet, setupProductTrait } from '../traits';

export const drinkModel = model({
  input: {
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    sizePrices: define.store<Record<string, number>>({}),
    defaultSize: define.store('0.3'),
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
  },
  impl: (ctx: any) => {
    setupProductTrait(ctx.product);

    sample({ source: ctx.name, target: ctx.product.$name });
    sample({ source: ctx.description, target: ctx.product.$description });
    sample({ source: ctx.defaultSize, target: ctx.size.$size });

    const $sizeCost = combine(
      ctx.size.$size,
      ctx.sizePrices,
      (size: string, prices: Record<string, number>) => prices[size] || 0,
    );

    const $calculatedPrice = combine(
      ctx.basePrice,
      $sizeCost,
      (base, size) => base + size,
    );

    sample({
      source: $calculatedPrice,
      target: ctx.product.$price,
    });
  },
});
