import { model, define, ref } from '@effector-model/core-experimental';
import { createEvent, createStore, sample, combine, Store } from 'effector';
import { nodeFacet, folderFacet, visualFacet } from './facets';

/**
 * File Model
 */
export const fileModel = model({
  input: {
    name: define.store<string>(),
    id: define.store<string>(),
    $selectedId: define.store<string | null>(null),
  },
  facets: {
    node: nodeFacet,
    visual: visualFacet,
  },
  fn: ({
    name,
    id,
    $selectedId,
  }: {
    name: Store<string>;
    id: Store<string>;
    $selectedId: Store<string | null>;
  }) => {
    const select = createEvent();
    const rename = createEvent<string>();

    sample({
      clock: rename,
      target: name,
    });

    sample({
      clock: select,
      source: id,
      target: $selectedId,
    });

    const $isSelected = combine(
      $selectedId,
      id,
      (selected, myId) => selected === myId,
    );

    return {
      node: {
        $name: name,
        $isSelected,
        select,
        rename,
      },
      visual: {
        $backgroundColor: $isSelected.map((s) =>
          s ? '#e0e7ff' : 'transparent',
        ),
        _selectionSource: $isSelected,
      },
    };
  },
});

/**
 * Folder Model (Recursive)
 */
export const folderModel = model({
  input: {
    name: define.store<string>(),
    id: define.store<string>(),
    $selectedId: define.store<string | null>(null),
    children: define.array(ref.self), // Recursive definition
  },
  facets: {
    node: nodeFacet,
    folder: folderFacet,
    visual: visualFacet,
  },
  fn: ({
    name,
    id,
    $selectedId,
    children,
  }: {
    name: any;
    id: any;
    $selectedId: any;
    children: any;
  }) => {
    const toggle = createEvent();
    const $isOpen = createStore(true).on(toggle, (open) => !open);
    const select = createEvent();
    const rename = createEvent<string>();

    sample({
      clock: rename,
      target: name,
    });

    sample({
      clock: select,
      source: id,
      target: $selectedId, // Updates global selection
    });

    // Toggle logic: if already selected, deselect?
    // User requirement: "It should also unselect node by one-clicking (select/unselect toggling). There should be only one selection."
    // If we click an already selected node, we should set $selectedId to null.

    const $isSelected = combine(
      $selectedId,
      id,
      (selected, myId) => selected === myId,
    );

    return {
      node: {
        $name: name,
        $isSelected,
        select,
        rename,
      },
      folder: {
        $isOpen,
        toggle,
        children, // Pass the children instances
      },
      visual: {
        $backgroundColor: $isSelected.map((s) =>
          s ? '#e0e7ff' : 'transparent',
        ),
        _selectionSource: $isSelected,
      },
    };
  },
});
