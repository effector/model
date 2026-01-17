import { facet, define } from '@effector-model/core-experimental';
import { sample, Event } from 'effector';

// --- Helper ---
const getValue = (payload: any) => {
  if (payload && typeof payload === 'object' && 'value' in payload)
    return payload.value;
  return payload;
};

// --- Facet Definitions ---

export const productTrait = facet({
  $name: define.store(''),
  $description: define.store(''),
  $composition: define.store(''),
  $image: define.store(''),
  $restaurantId: define.store(''),
  $nutritionalInfo: define.store<{ calories: number; weight: number } | null>(
    null,
  ),

  // The final price of a SINGLE item (including modifiers)
  $price: define.store(0),

  $quantity: define.store(1),
  $isDeleted: define.store(false),

  increment: define.event<void>(),
  decrement: define.event<void>(),
  restore: define.event<void>(),
  hardDelete: define.event<void>(),
}).use((t) => {
  // Increment: Only works if not deleted
  sample({
    clock: t.increment,
    source: { q: t.$quantity, d: t.$isDeleted },
    filter: ({ d }) => !d,
    fn: ({ q }) => q + 1,
    target: t.$quantity,
  });

  // Decrement:
  // Case A: Quantity > 1 -> Decrease
  sample({
    clock: t.decrement,
    source: { q: t.$quantity, d: t.$isDeleted },
    filter: ({ q, d }) => !d && q > 1,
    fn: ({ q }) => q - 1,
    target: t.$quantity,
  });

  // Case B: Quantity == 1 -> Soft Delete
  sample({
    clock: t.decrement,
    source: t.$quantity,
    filter: (q) => q === 1,
    fn: () => true,
    target: t.$isDeleted,
  });

  // Restore: Un-delete and reset quantity to 1
  sample({
    clock: t.restore,
    fn: () => false,
    target: t.$isDeleted,
  });
});

export const ingredientsFacet = facet({
  // Extras that are added
  $selectedExtras: define.store<Record<string, boolean>>({}),
  // Defaults that are removed
  $removedDefaults: define.store<Record<string, boolean>>({}),

  toggleExtra: define.event<string>(),
  toggleDefault: define.event<string>(),
}).use((t) => {
  sample({
    clock: t.toggleExtra,
    source: t.$selectedExtras,
    fn: (selected, payload) => {
      const id = getValue(payload);
      const next = { ...selected };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    },
    target: t.$selectedExtras,
  });

  sample({
    clock: t.toggleDefault,
    source: t.$removedDefaults,
    fn: (removed, payload) => {
      const id = getValue(payload);
      const next = { ...removed };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return next;
    },
    target: t.$removedDefaults,
  });
});

export const sizeFacet = facet({
  $size: define.store<string>(''),
  setSize: define.event<string>(),
  $options: define.store<any[]>([]),
}).use((t) => {
  sample({
    clock: t.setSize,
    fn: getValue,
    target: t.$size,
  });
});

export const doughFacet = facet({
  $dough: define.store<string>(''),
  setDough: define.event<string>(),
  $options: define.store<any[]>([]),
}).use((t) => {
  sample({
    clock: t.setDough,
    fn: getValue,
    target: t.$dough,
  });
});
