import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createStore } from 'effector';
import { keyval } from '@effector/model';
import { useEntityItem, EntityProvider } from '@effector/model-react';

test('with key from provider', () => {
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
  entities.edit.add({ id: 'a', value: 'A' });
  const Entity = () => {
    const { value } = useEntityItem(entities);
    return <div data-testid="entity">{value}</div>;
  };
  render(
    <EntityProvider model={entities} value="a">
      <Entity />
    </EntityProvider>,
  );
  const result = screen.getByTestId('entity');
  expect(result.innerText).toBe('A');
});
test('with key from argument', () => {
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
  entities.edit.add({ id: 'a', value: 'A' });
  const Entity = ({ id }: { id: string }) => {
    const { value } = useEntityItem(entities, id);
    return <div data-testid="entity">{value}</div>;
  };
  render(<Entity id="a" />);
  const result = screen.getByTestId('entity');
  expect(result.innerText).toBe('A');
});
test('render default item when key is not found', () => {
  const entities = keyval(() => {
    const $id = createStore('');
    const $value = createStore('default');
    return {
      key: 'id',
      state: {
        id: $id,
        value: $value,
      },
    };
  });
  const Entity = ({ id }: { id: string }) => {
    const { value } = useEntityItem(entities, id);
    return <div data-testid="entity">{value}</div>;
  };
  render(<Entity id="a" />);
  const result = screen.getByTestId('entity');
  expect(result.innerText).toBe('default');
});
test('nested components use nearest provider', () => {
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
  const EntityA = () => {
    const { value } = useEntityItem(entities);
    return (
      <div data-testid="entity">
        {value}
        <EntityProvider model={entities} value="b">
          <EntityB />
        </EntityProvider>
      </div>
    );
  };
  const EntityB = () => {
    const { value } = useEntityItem(entities);
    return <div>{value}</div>;
  };
  render(
    <EntityProvider model={entities} value="a">
      <EntityA />
    </EntityProvider>,
  );
  const result = screen.getByTestId('entity');
  expect(result.innerHTML).toMatchInlineSnapshot(`"A<div>B</div>"`);
});
