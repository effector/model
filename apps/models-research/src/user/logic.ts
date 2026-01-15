import { createEvent, createStore, sample } from 'effector';
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
// Note: userToKick.facets.user.kick is a targetable unit (Event) created by createItemProxy
sample({
  clock: kickUser,
  target: userToKick.facets.user.kick,
});

// 2. СПЕЦИФИЧНОЕ ДЕЙСТВИЕ (Повышение)
const userToPromote = usersList.getItem(promoteUser);
match({
  source: userToPromote.activeVariant,
  cases: {
    member: (memberScope: any) => {
      // Just accessing the property wires it up to the variantTrigger
      // thanks to createItemProxy's internal logic.
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      memberScope.facets.membership.promote;
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
