import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';
import { useUnit } from 'effector-react';
import { createStore, allSettled, fork, createEvent, sample } from 'effector';
import { Provider } from 'effector-react';
import {
  model,
  define,
  facet,
  keyval,
  union,
  select,
  match,
} from '@effector-model/core-experimental';

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

// --- Logic ---
const selectUser = createEvent<string>();
const $selectedUserId = createStore<string | null>(null).on(
  selectUser,
  (_, id) => id,
);

const $currentUser = usersList.getItem($selectedUserId);
const $currentUserName = select($currentUser)
  .facet('user')
  .path((facet: any) => facet.$nickname)
  .fallback('');

// --- Component ---

function UserDemo() {
  const [items] = useUnit([usersList.$items]);
  const [selectedId, select] = useUnit([$selectedUserId, selectUser]);
  const [currentName] = useUnit([$currentUserName]);
  const [add] = useUnit([usersList.add]);

  return (
    <div>
      <div data-testid="selected-name">{currentName as React.ReactNode}</div>
      <ul>
        {items.map((id) => (
          <li key={id} onClick={() => select(id)} data-testid={`item-${id}`}>
            {id}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          add({
            id: 'guest1',
            variant: 'guest',
            input: { nickname: createStore('GuestUser') },
          })
        }
      >
        Add Guest
      </button>
    </div>
  );
}

// --- Test ---

describe('UserDemo Integration', () => {
  it('should render list and select user', async () => {
    const scope = fork();

    render(
      <Provider value={scope}>
        <UserDemo />
      </Provider>,
    );

    // Initial
    expect(screen.queryByTestId('item-guest1')).toBeNull();
    expect(screen.getByTestId('selected-name').textContent).toBe('');

    // Add Guest
    fireEvent.click(screen.getByText('Add Guest'));
    await allSettled(scope);

    expect(screen.getByTestId('item-guest1')).toBeDefined();

    // Select Guest
    fireEvent.click(screen.getByTestId('item-guest1'));
    await allSettled(scope);

    expect(screen.getByTestId('selected-name').textContent).toBe('GuestUser');
  });
});
