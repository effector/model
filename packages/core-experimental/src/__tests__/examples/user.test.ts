import { describe, it, expect, vi } from 'vitest';
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
    member: (memberScope: any, trigger: Event<string>) => {
      sample({
        clock: trigger,
        target: memberScope.facets.membership.promote as Event<any>,
      } as any);
    },
    guest: (_: any, trigger: any) => {
      sample({
        clock: trigger,
        target: onGuestPromoteError,
      } as any);
    },
  },
});

// Selection Logic
const $currentUser = usersList.getItem($selectedUserId);

const $currentUserRole = select($currentUser)
  .variant('member')
  .facet('membership')
  .path((facet: any) => facet.$role)
  .fallback('guest');

const $currentUserName = select($currentUser)
  .facet('user')
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
      params: {
        id: 'admin1',
        variant: 'member',
        input: {
          nickname: createStore('AdminUser'),
          role: createStore('admin'),
        },
      },
    });

    expect(scope.getState(usersList.$items)).toEqual(['guest1', 'admin1']);

    // 3. Select Guest
    await allSettled(selectUser, { scope, params: 'guest1' });
    expect(scope.getState($currentUserName)).toBe('GuestUser');
    expect(scope.getState($currentUserRole)).toBe('guest'); // Fallback

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
