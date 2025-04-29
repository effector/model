import { expect, test } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render, screen } from '@testing-library/react';
import { createStore } from 'effector';
import { keyval, type KeyvalWithState } from '@effector/model';
import { useEntityList, useEntityItem } from '@effector/model-react';

test('useEntityList', () => {
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
    const { value } = useEntityItem(entities);
    return <div>{value}</div>;
  };
  const App = () => (
    <div data-testid="list">
      {useEntityList(entities, () => (
        <Entity />
      ))}
    </div>
  );
  render(<App />);
  const result = screen.getByTestId('list');
  expect(result.innerHTML).toMatchInlineSnapshot(`"<div>A</div><div>B</div>"`);
});

test('tree support', () => {
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
    { id: 'a', childs: [{ id: 'e', childs: [] }] },
    { id: 'b', childs: [{ id: 'c', childs: [{ id: 'd', childs: [] }] }] },
  ]);
  const Entity = () => {
    const { id } = useEntityItem(entities);
    return (
      <div id={id}>
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
  expect(result.innerHTML).toBe(
    renderToString(
      <>
        <div id="a">
          <div id="e" />
        </div>
        <div id="b">
          <div id="c">
            <div id="d" />
          </div>
        </div>
      </>,
    ),
  );
});
