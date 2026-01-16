import { facet, define } from '@effector-model/core-experimental';
import { sample, Store, Event } from 'effector';

// --- Facet Definitions ---

export const productTrait = facet({
  $name: define.store(''),
  $description: define.store(''),
  $image: define.store(''),

  // The final price of a SINGLE item (including modifiers)
  $price: define.store(0),

  $quantity: define.store(1),
  $isDeleted: define.store(false),

  increment: define.event<void>(),
  decrement: define.event<void>(),
  restore: define.event<void>(),
  hardDelete: define.event<void>(),
});

export const ingredientsFacet = facet({
  // Extras that are added
  $selectedExtras: define.store<Record<string, boolean>>({}),
  // Defaults that are removed
  $removedDefaults: define.store<Record<string, boolean>>({}),

  toggleExtra: define.event<string>(),
  toggleDefault: define.event<string>(),
});

export const sizeFacet = facet({
  $size: define.store<string>(''),
  setSize: define.event<string>(),
});

export const doughFacet = facet({
  $dough: define.store<string>(''),
  setDough: define.event<string>(),
});

// --- Logic Implementation Helpers ---

// We define a helper to attach the standard "Thermodynamic" logic to any model implementing ProductTrait.
// This ensures the State Machine (Soft Delete) is consistent across all products.
export function setupProductTrait(t: {
  $quantity: any;
  $isDeleted: any;
  increment: Event<void>;
  decrement: Event<void>;
  restore: Event<void>;
}) {
  // Increment: Only works if not deleted
  sample({
    clock: t.increment,
    source: { q: t.$quantity, d: t.$isDeleted },
    filter: ({ d }: any) => !d,
    fn: ({ q }: any) => q + 1,
    target: t.$quantity,
  });

  // Decrement:
  // Case A: Quantity > 1 -> Decrease
  sample({
    clock: t.decrement,
    source: { q: t.$quantity, d: t.$isDeleted },
    filter: ({ q, d }: any) => !d && q > 1,
    fn: ({ q }: any) => q - 1,
    target: t.$quantity,
  });

  // Case B: Quantity == 1 -> Soft Delete
  sample({
    clock: t.decrement,
    source: t.$quantity,
    filter: (q: any) => q === 1,
    fn: () => true,
    target: t.$isDeleted,
  });

  // Restore: Un-delete and reset quantity to 1 (optional, or keep generic)
  sample({
    clock: t.restore,
    fn: () => false,
    target: t.$isDeleted,
  });
}

export function setupIngredientsFacet(t: {
  $selectedExtras: any;
  $removedDefaults: any;
  toggleExtra: Event<string>;
  toggleDefault: Event<string>;
}) {
  sample({
    clock: t.toggleExtra,
    source: t.$selectedExtras,
    fn: (selected: any, id: string) => {
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
    fn: (removed: any, id: string) => {
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
}
