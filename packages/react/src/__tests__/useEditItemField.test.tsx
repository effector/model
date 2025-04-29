import { expect, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from 'effector';
import { keyval } from '@effector/model';
import {
  useEntityItem,
  useEditItemField,
  EntityProvider,
} from '@effector/model-react';

test('with key from provider', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $text = createStore('');
    return {
      key: 'id',
      state: {
        id: $id,
        text: $text,
      },
    };
  });
  entities.edit.add({ id: 'a', text: 'A' });
  const Entity = () => {
    const { id, text } = useEntityItem(entities);
    const editField = useEditItemField(entities);
    return (
      <button data-testid="entity" onClick={() => editField.text('B')}>
        {id}: {text}
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
  expect(result.innerText).toMatchInlineSnapshot(`"a: B"`);
});
test('with key from argument', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $text = createStore('');
    return {
      key: 'id',
      state: {
        id: $id,
        text: $text,
      },
    };
  });
  entities.edit.add({ id: 'a', text: 'A' });
  const Entity = ({ id }: { id: string }) => {
    const { text } = useEntityItem(entities, id);
    const editField = useEditItemField(entities, id);
    return (
      <button data-testid="entity" onClick={() => editField.text('B')}>
        {id}: {text}
      </button>
    );
  };
  render(<Entity id="a" />);
  const result = screen.getByTestId('entity');
  fireEvent.click(result);
  expect(result.innerText).toMatchInlineSnapshot(`"a: B"`);
});
