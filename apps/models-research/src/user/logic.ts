import {
  createEvent,
  createStore,
  sample,
  Event,
  createEffect,
} from 'effector';
import { usersList } from './index';
import { select, match } from '@effector-model/core-experimental';

// --- Внешние события ---
export const kickUser = createEvent<string>(); // payload: userId
export const promoteUser = createEvent<string>(); // payload: userId
export const selectUser = createEvent<string>();
export const $selectedUserId = createStore<string | null>(null).on(
  selectUser,
  (_, id) => id,
);

// --- Потребление: Поток Управления ---

// 1. ОБЩЕЕ ДЕЙСТВИЕ (Кик)
const userToKick = usersList.getItem(kickUser);

// Note: We cannot use select() on proxies returned for events (kickUser)
// because they don't have a stable $id store.
// We must manually implement the guard for the kick action.

const kickAllowedFx = createEffect(
  ({
    state,
    variants,
    id,
  }: {
    state: Record<string, any>;
    variants: Record<string, string | null>;
    id: string;
  }) => {
    const variant = variants[id];
    if (!variant) return true; // Maybe guest or just created?

    if (variant === 'member') {
      // Check role in state
      // Path: membership -> $role
      const role = state[id]?.membership?.$role;
      return role !== 'admin';
    }

    return true; // Guests can be kicked
  },
);

sample({
  clock: kickUser,
  source: { state: usersList.$state, variants: usersList.$activeVariants },
  fn: ({ state, variants }, id) => ({ state, variants, id }),
  target: kickAllowedFx,
});

sample({
  clock: kickAllowedFx.done,
  filter: ({ result }: { result: boolean }) => result === true,
  fn: ({ params }: { params: { id: string } }) => params.id,
  target: [userToKick.facets.user.kick, usersList.remove],
});

// 2. СПЕЦИФИЧНОЕ ДЕЙСТВИЕ (Повышение)
const userToPromote = usersList.getItem(promoteUser);
match({
  source: userToPromote.activeVariant,
  cases: {
    member: (memberScope: any, trigger: Event<string>) => {
      // Explicitly wire the trigger to the method
      sample({
        clock: trigger,
        target: memberScope.facets.membership.promote as any,
      });
    },
    guest: (_: any, trigger: any) => {
      trigger.watch(() => console.error('Нельзя повысить гостя!'));
    },
  },
});

// --- Потребление: Доступ к Данным ---
const $currentUser = usersList.getItem($selectedUserId);

export const $currentUserRole = select($currentUser)
  .variant('member')
  .facet('membership')
  .path((facet: any) => facet.$role)
  .fallback('guest');

export const $currentUserName = select($currentUser)
  .facet('user')
  .path((facet: any) => facet.$nickname)
  .fallback('');

// Helper to add users
export const addGuest = createEvent<string>();
export const addMember = createEvent<{ name: string; role: string }>();

sample({
  clock: addGuest,
  fn: (name: string) => ({
    id: Math.random().toString(36).substr(2, 9),
    variant: 'guest',
    input: { nickname: createStore(name) },
  }),
  target: usersList.add as any,
});

sample({
  clock: addMember,
  fn: ({ name, role }: { name: string; role: string }) => ({
    id: Math.random().toString(36).substr(2, 9),
    variant: 'member',
    input: {
      nickname: createStore(name),
      role: createStore(role),
    },
  }),
  target: usersList.add as any,
});
