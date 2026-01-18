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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: ({ nickname }: any) => ({
    user: {
      $nickname: nickname,
      kick: createEvent(),
    },
  }),
});
