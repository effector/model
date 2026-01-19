import { facet, define } from '@effector-model/core-experimental';

export const chatUserFacet = facet({
  $nickname: define.store<string>(),
  kick: define.event<void>(),
});

export const memberFacet = facet({
  $role: define.store<'admin' | 'user'>(),
  promote: define.event<void>(),
});
