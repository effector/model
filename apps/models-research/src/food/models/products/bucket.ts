import { model, define } from '@effector-model/core-experimental';
import { combine, is } from 'effector';
import { productTrait, sizeFacet } from '../traits';
import { SizeOption } from '../../types';

export const bucketModel = model({
  input: {
    type: define.store('bucket'),
    basePrice: define.store(0),
    name: define.store(''),
    description: define.store(''),
    image: define.store(''),
    nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
      null,
    ),
    sizes: define.store<SizeOption[]>([]),
    defaultSize: define.store<string | undefined>(undefined),
  },
  variant: {
    source: (input: any) => input.type,
    cases: {
      bucket: (t: any) => t === 'bucket',
    },
  },
  facets: {
    product: productTrait,
    size: sizeFacet,
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

    const $calculatedPrice = combine(
      input.basePrice,
      $sizeCost,
      (base, size) => {
        const b = is.store(base) ? (base as any).getState() : base;
        const s = is.store(size) ? (size as any).getState() : size;
        return (b || 0) + (s || 0);
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
