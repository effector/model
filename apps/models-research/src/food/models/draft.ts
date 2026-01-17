import { createStore, createEvent, sample } from 'effector';
import { keyval, serialize } from '@effector-model/core-experimental';
import { cartModel, productUnion } from './cart';

export const draftModel = keyval({
  model: productUnion,
});

export const $editingId = createStore<string | null>(null);

// Events
export const openConfigurator = createEvent<{
  mode: 'new' | 'edit';
  data?: any;
  id?: string;
}>();

export const closeConfigurator = createEvent();
export const submitConfigurator = createEvent();

// Logic: Open
sample({
  clock: openConfigurator,
  fn: ({ mode, id }) => (mode === 'edit' && id ? id : null),
  target: $editingId,
});

sample({
  clock: openConfigurator,
  source: cartModel.$state,
  fn: (cartState, { mode, data, id }) => {
    if (mode === 'new') {
      // Map menu data to initial state
      const model = (productUnion.models as any)[data.type];
      const state = model && model.init ? model.init(data) : {};

      return {
        id: 'draft',
        variant: data.type,
        input: data, // Metadata
        state: state, // Initial Values
      };
    } else {
      const item = cartState[id!];
      if (!item) throw new Error('Item not found');

      const snapshot = serialize(item);

      return {
        id: 'draft',
        variant: snapshot.activeVariant,
        input: snapshot.extra || snapshot.input, // Metadata
        state: snapshot.facets, // State
      };
    }
  },
  target: draftModel.add,
});

// Logic: Close
sample({
  clock: [closeConfigurator, submitConfigurator],
  fn: () => 'draft',
  target: draftModel.remove,
});

// Logic: Submit - Add New
sample({
  clock: submitConfigurator,
  source: {
    editId: $editingId,
    instances: draftModel.$state,
  },
  filter: ({ instances, editId }) => !!instances['draft'] && !editId,
  fn: ({ instances }) => {
    const instance = instances['draft'];
    const snapshot = serialize(instance);

    return {
      id: crypto.randomUUID(),
      variant: snapshot.activeVariant,
      input: snapshot.extra || snapshot.input,
      state: snapshot.facets,
    };
  },
  target: cartModel.add,
});

// Logic: Submit - Update Existing
sample({
  clock: submitConfigurator,
  source: {
    editId: $editingId,
    instances: draftModel.$state,
  },
  filter: ({ instances, editId }) => !!instances['draft'] && !!editId,
  fn: ({ editId, instances }) => {
    const instance = instances['draft'];
    const snapshot = serialize(instance);

    return {
      id: editId!,
      input: snapshot.extra || snapshot.input,
      state: snapshot.facets,
    };
  },
  target: cartModel.update,
});
