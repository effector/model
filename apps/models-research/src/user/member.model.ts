import { model, define } from '@effector-model/core-experimental';
import { createEvent, sample } from 'effector';
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
  fn: ({ nickname, role }: { nickname: any; role: any }) => {
    const promote = createEvent();

    sample({
      clock: promote,
      source: role,
      fn: (currentRole: any) =>
        (currentRole === 'admin' ? 'user' : 'admin') as any,
      target: role,
    });

    return {
      user: {
        $nickname: nickname,
        kick: createEvent(),
      },
      membership: {
        $role: role,
        promote,
      },
    };
  },
});
