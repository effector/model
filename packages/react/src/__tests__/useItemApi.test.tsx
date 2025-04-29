import { expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEvent, createStore, sample } from 'effector';
import { keyval } from '@effector/model';
import {
  useEntityItem,
  useItemApi,
  EntityProvider,
} from '@effector/model-react';

test('with key from provider', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $value = createStore(0);
    const inc = createEvent();
    sample({ clock: inc, source: $value, target: $value, fn: (x) => x + 1 });
    return {
      key: 'id',
      state: {
        id: $id,
        value: $value,
      },
      api: { inc },
      optional: ['value'],
    };
  });
  entities.edit.add({ id: 'a' });
  const Entity = () => {
    const { id, value } = useEntityItem(entities);
    const { inc } = useItemApi(entities);
    return (
      <button data-testid="entity" onClick={() => inc()}>
        {id}: {value}
      </button>
    );
  };
  render(
    <EntityProvider model={entities} value="a">
      <Entity />
    </EntityProvider>,
  );
  const result = screen.getByTestId('entity');
  fireEvent.click(result);
  expect(result.innerText).toMatchInlineSnapshot(`"a: 1"`);
});
test('with key from argument', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $value = createStore(0);
    const inc = createEvent();
    sample({ clock: inc, source: $value, target: $value, fn: (x) => x + 1 });
    return {
      key: 'id',
      state: {
        id: $id,
        value: $value,
      },
      api: { inc },
      optional: ['value'],
    };
  });
  entities.edit.add({ id: 'a' });
  const Entity = ({ id }: { id: string }) => {
    const { value } = useEntityItem(entities, id);
    const { inc } = useItemApi(entities, id);
    return (
      <button data-testid="entity" onClick={() => inc()}>
        {id}: {value}
      </button>
    );
  };
  render(<Entity id="a" />);
  const result = screen.getByTestId('entity');
  fireEvent.click(result);
  expect(result.innerText).toMatchInlineSnapshot(`"a: 1"`);
});
