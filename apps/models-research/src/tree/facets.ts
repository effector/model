import { facet, define, ref } from '@effector-model/core-experimental';

/**
 * Shared behavior for all file system nodes.
 */
export const nodeFacet = facet({
  $name: define.store<string>(),
  $isSelected: define.store<boolean>(false),
  select: define.event<void>(), // Now can carry payload if we implement it so? No, let's keep void and use sample.
  rename: define.event<string>(),
});

/**
 * Folder specific behavior.
 * Demonstrates internal dependencies: $icon depends on $isOpen from this same facet?
 * No, let's keep it simple.
 */
export const folderFacet = facet({
  $isOpen: define.store<boolean>(true),
  toggle: define.event<void>(),
  children: define.array(ref.self),
});

/**
 * Visual facet that depends on node state.
 * Demonstrates ref.tag resolution.
 */
export const visualFacet = facet({
  $backgroundColor: define.store<string>(),
  // We declare a dependency on a store named '$isSelected'
  // It will be resolved from the input/scope of the model implementing this facet
  _selectionSource: ref.tag('$isSelected'),
});
