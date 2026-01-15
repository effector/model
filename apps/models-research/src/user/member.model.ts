import { model, define } from '@effector-model/core-experimental';
import { createEvent } from 'effector';
import { chatUserFacet, memberFacet } from './facets';

export const memberModel = model({
  input: {
    nickname: define.store<string>(),
    role: define.store<'admin' | 'user'>(),
  },
  facets: {
    user: chatUserFacet,
    membership: memberFacet,
  },
  fn: ({ nickname, role }: any) => ({
    user: {
      $nickname: nickname,
      kick: createEvent(),
    },
    membership: {
      $role: role,
      promote: createEvent(),
    },
  }),
});
