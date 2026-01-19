import { describe, it, expect } from 'vitest';
import {
  createStore,
  createEvent,
  allSettled,
  fork,
  sample,
  Event,
} from 'effector';
import { model } from '../../model';
import { define } from '../../define';
import { facet } from '../../facet';
import { keyval, union } from '../../keyval';
import { select } from '../../lens';
import { match } from '../../match';

// --- Definitions ---

const chatUserFacet = facet({
  $nickname: define.store<string>(),
  kick: define.event<void>(),
});

const memberFacet = facet({
  $role: define.store<'admin' | 'user'>(),
  promote: define.event<void>(),
});

const guestModel = model({
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

const memberModel = model({
  input: {
    nickname: define.store<string>(),
    role: define.store<'admin' | 'user'>(),
  },
  facets: {
    user: chatUserFacet,
    membership: memberFacet,
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

const userUnion = union({
  guest: guestModel,
  member: memberModel,
});

const usersList = keyval({
  model: userUnion,
});

// --- Logic Wiring ---

const kickUser = createEvent<string>();
const promoteUser = createEvent<string>();
const selectUser = createEvent<string>();
const $selectedUserId = createStore<string | null>(null).on(
  selectUser,
  (_, id) => id,
);

// Kick Logic
const userToKick = usersList.getItem(kickUser);
sample({
  clock: kickUser,
  target: userToKick.facets.user.kick,
});

// Promote Logic
const userToPromote = usersList.getItem(promoteUser);
const onGuestPromoteError = createEvent(); // For testing

match({
  source: userToPromote.activeVariant,
  cases: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    member: (memberScope: any, trigger: Event<unknown>) => {
      sample({
        clock: trigger,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        target: memberScope.facets.membership.promote as Event<any>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    guest: (_: any, trigger: any) => {
      sample({
        clock: trigger,
        target: onGuestPromoteError,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    },
  },
});

// Selection Logic
const $currentUser = usersList.getItem($selectedUserId);

const $currentUserRole = select($currentUser)
  .variant('member')
  .facet('membership')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .path((facet: any) => facet.$role)
  .fallback('guest');

const $currentUserName = select($currentUser)
  .facet('user')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .path((facet: any) => facet.$nickname)
  .fallback('');

// --- Tests ---

describe('UserUnion & Keyval', () => {
  it('should handle polymorphism', async () => {
    const scope = fork();

    // 1. Add Guest
    await allSettled(usersList.add, {
      scope,
      params: {
        id: 'guest1',
        variant: 'guest',
        input: { nickname: createStore('GuestUser') },
      },
    });

    // 2. Add Member
    await allSettled(usersList.add, {
      scope,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: {
        id: 'admin1',
        variant: 'member',
        input: {
          nickname: createStore('AdminUser'),
          role: createStore('admin'),
        },
      } as any,
    });

    expect(scope.getState(usersList.$items)).toEqual(['guest1', 'admin1']);

    // 3. Select Guest
    await allSettled(selectUser, { scope, params: 'guest1' });
    expect(scope.getState($currentUserName)).toBe('GuestUser');
    // Ensure fallback is working
    expect(scope.getState($currentUserRole)).toBe('guest');

    // 4. Select Member
    await allSettled(selectUser, { scope, params: 'admin1' });
    expect(scope.getState($currentUserName)).toBe('AdminUser');
    expect(scope.getState($currentUserRole)).toBe('admin');

    // 5. Try to promote Guest (should fail/trigger error handler)
    // Let's make a store for error
    const $errorCount = createStore(0).on(onGuestPromoteError, (x) => x + 1);

    await allSettled(promoteUser, { scope, params: 'guest1' });
    expect(scope.getState($errorCount)).toBe(1);

    // 6. Promote Member (should succeed - we need to verify effect)
    // We didn't attach any side effect to promote, but we can verify it doesn't error.
    await allSettled(promoteUser, { scope, params: 'admin1' });
    expect(scope.getState($errorCount)).toBe(1); // No new error
  });
});
