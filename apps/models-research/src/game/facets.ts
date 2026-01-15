import { facet, define } from '@effector-model/core-experimental';

export const visualFacet = facet({
  $color: define.store<string>(),
});
