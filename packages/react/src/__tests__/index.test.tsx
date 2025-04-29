import { expect, describe, test } from 'vitest';
import { renderToString } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import { createEvent, createStore, sample } from 'effector';
import { keyval, type KeyvalWithState } from '@effector/model';
import {
  useEntityList,
  useEntityItem,
  useItemApi,
  useEditItemField,
  EntityProvider,
  useEditKeyval,
} from '@effector/model-react';

describe('useEntityItem', () => {
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
});

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

describe('useItemApi', () => {
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
});

describe('useEditItemField', () => {
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
});

describe('useEditKeyval', () => {
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
});
