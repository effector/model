import { expect, test } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import { createStore } from 'effector';
import { keyval, type KeyvalWithState } from '@effector/model';
import {
  useEntityList,
  useEntityItem,
  useEditKeyval,
} from '@effector/model-react';

test('provide api for root keyval.edit in basic case', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $value = createStore('');
    return {
      key: 'id',
      state: {
        id: $id,
        value: $value,
      },
    };
  });
  entities.edit.add([
    { id: 'a', value: 'A' },
    { id: 'b', value: 'B' },
  ]);
  const Entity = () => {
    const { id, value } = useEntityItem(entities);
    const { remove } = useEditKeyval(entities);
    return (
      <button data-testid={`entity-${id}`} onClick={() => remove(id)}>
        {value}
      </button>
    );
  };
  const App = () => {
    return (
      <div data-testid="list">
        {useEntityList(entities, () => (
          <Entity />
        ))}
      </div>
    );
  };
  render(<App />);
  const result = screen.getByTestId('list');
  const firstButton = screen.getByTestId('entity-a');
  fireEvent.click(firstButton);
  expect(result.innerHTML).toBe(
    renderToString(
      <>
        <button data-testid="entity-b">B</button>
      </>,
    ),
  );
  expect(entities.$items.getState()).toEqual([{ id: 'b', value: 'B' }]);
});
test('allow to edit current (child) keyval in tree case', () => {
  type Entity = {
    id: string;
    childs: Entity[];
  };
  const entities = keyval(() => {
    const $id = createStore('');
    const childs = keyval(entities) as KeyvalWithState<Entity, Entity>;
    return {
      key: 'id',
      state: {
        id: $id,
        childs,
      },
    };
  });
  entities.edit.add([
    { id: 'a', childs: [{ id: 'b', childs: [{ id: 'c', childs: [] }] }] },
    { id: 'c', childs: [] },
  ]);
  const Entity = () => {
    const { id } = useEntityItem(entities);
    const { remove } = useEditKeyval(entities);
    return (
      <div id={id}>
        <button data-testid={`entity-${id}`} onClick={() => remove(id)}>
          {id}
        </button>
        {useEntityList({
          keyval: entities,
          field: 'childs',
          fn: () => <Entity />,
        })}
      </div>
    );
  };
  const App = () => {
    return (
      <div data-testid="list">
        {useEntityList(entities, () => (
          <Entity />
        ))}
      </div>
    );
  };
  render(<App />);
  const result = screen.getByTestId('list');
  /** select first (deep child) entity with that id */
  const targetButton = screen.getAllByTestId('entity-c')[0];
  fireEvent.click(targetButton);
  expect(result.innerHTML).toBe(
    renderToString(
      <>
        <div id="a">
          <button data-testid="entity-a">a</button>
          <div id="b">
            <button data-testid="entity-b">b</button>
          </div>
        </div>
        <div id="c">
          <button data-testid="entity-c">c</button>
        </div>
      </>,
    ),
  );
  expect(entities.$items.getState()).toEqual([
    { id: 'a', childs: [{ id: 'b', childs: [] }] },
    { id: 'c', childs: [] },
  ]);
});
