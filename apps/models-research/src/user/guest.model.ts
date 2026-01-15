import { model, define } from '@effector-model/core-experimental';
import { createEvent } from 'effector';
import { chatUserFacet } from './facets';

export const guestModel = model({
  input: {
    nickname: define.store<string>(),
  },
  facets: {
    user: chatUserFacet,
  },
  fn: ({ nickname }: any) => ({
    user: {
      $nickname: nickname,
      kick: createEvent(),
    },
  }),
});
