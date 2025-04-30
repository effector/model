import {
  combine,
  createEvent,
  createStore,
  type EventCallable,
  sample,
} from 'effector';
import { KeyOrKeys, keyval, lazy, type Keyval } from '@effector/model';
import { createAction } from 'effector-action';

type InputTodo = {
  title: string;
  subtasks?: InputTodo[];
};

type TodoShape = {
  id: string;
  title: string;
  completed: boolean;
  editing: boolean;
  titleDraft: string;
  subtasks: TodoShape[];
  subtasksTotal: number;
  subtasksVisible: number;
  visible: boolean;
};

type TodoInputShape = {
  id: string;
  title: string;
  completed?: boolean;
  editing?: boolean;
  titleDraft?: string;
  subtasks: TodoInputShape[];
};

export const $filterMode = createStore<'all' | 'completed' | 'active'>('all');
export const changeFilterMode = createEvent<'all' | 'completed' | 'active'>();
sample({ clock: changeFilterMode, target: $filterMode });

export const todoList = keyval(() => {
  const $id = createStore('');
  const $title = createStore('');
  const $completed = createStore(false);
  const $editing = createStore(false);
  const $titleDraft = createStore('');
  const $visible = combine($completed, $filterMode, (completed, mode) => {
    switch (mode) {
      case 'all':
        return true;
      case 'active':
        return !completed;
      case 'completed':
        return completed;
    }
  });

  const childsList = keyval(todoList) as Keyval<
    TodoInputShape,
    TodoShape,
    { removeCompleted: EventCallable<void>; toggleAll: EventCallable<void> },
    any
  >;

  const $subtasksTotal = lazy(() => {
    return combine(childsList.$items, (items) => {
      return items.reduce(
        (acc, { subtasksTotal }) => acc + subtasksTotal + 1,
        0,
      );
    });
  });
  const $subtasksVisible = lazy(() => {
    return combine(childsList.$items, $visible, (items, itemVisible) => {
      if (!itemVisible) return 0;
      return items.reduce(
        (acc, { subtasksVisible, visible }) =>
          acc + subtasksVisible + (visible ? 1 : 0),
        0,
      );
    });
  });

  const saveDraft = createAction({
    source: $titleDraft,
    target: {
      editing: $editing,
      title: $title,
    },
    fn(targets, titleDraft) {
      targets.editing(false);
      targets.title(titleDraft.trim());
    },
  });

  const editMode = createAction({
    source: $title,
    target: {
      editing: $editing,
      titleDraft: $titleDraft,
    },
    fn(targets, title, mode: 'on' | 'off') {
      targets.editing(mode === 'on');
      targets.titleDraft(title);
    },
  });

  const toggleCompleted = createEvent();

  sample({
    clock: toggleCompleted,
    source: $completed,
    fn: (completed) => !completed,
    target: $completed,
  });

  const [addSubtask, removeCompleted, toggleAll] = lazy(
    ['event', 'event', 'event'],
    () => [
      createAddTodo(childsList),
      createRemoveCompleted(childsList),
      createToggleAll(childsList),
    ],
  );

  return {
    key: 'id',
    state: {
      id: $id,
      title: $title,
      completed: $completed,
      editing: $editing,
      titleDraft: $titleDraft,
      subtasks: childsList,
      subtasksTotal: $subtasksTotal,
      subtasksVisible: $subtasksVisible,
      visible: $visible,
    },
    api: {
      saveDraft,
      editMode,
      toggleCompleted,
      addSubtask,
      removeCompleted,
      toggleAll,
    },
    optional: ['completed', 'editing', 'titleDraft'],
  };
});

function createRemoveCompleted(
  todoList: Keyval<
    any,
    TodoShape,
    { removeCompleted: EventCallable<void> },
    any
  >,
) {
  return createAction({
    source: todoList.$keys,
    target: {
      removeCompletedNestedChilds: todoList.api.removeCompleted,
      removeItems: todoList.edit.remove,
    },
    fn(target, childKeys) {
      target.removeCompletedNestedChilds({
        key: childKeys,
        data: Array.from(childKeys, () => undefined),
      });
      target.removeItems(({ completed }) => completed);
    },
  });
}

function createToggleAll(
  todoList: Keyval<any, TodoShape, { toggleAll: EventCallable<void> }, any>,
) {
  return createAction({
    source: todoList.$keys,
    target: {
      toggleAllNestedChilds: todoList.api.toggleAll,
      mapItems: todoList.edit.map,
    },
    fn(target, childKeys) {
      target.toggleAllNestedChilds({
        key: childKeys,
        data: Array.from(childKeys, () => undefined),
      });
      target.mapItems({
        keys: childKeys,
        map: ({ completed }) => ({ completed: !completed }),
      });
    },
  });
}

function createAddTodo(todoList: Keyval<any, TodoShape, any, any>) {
  return createAction({
    source: $todoDraft,
    target: {
      add: todoList.edit.add,
      todoDraft: $todoDraft,
    },
    fn(target, todoDraft) {
      if (!todoDraft.trim()) return;
      target.add({
        id: createID(),
        title: todoDraft.trim(),
        subtasks: [],
      });
      target.todoDraft.reinit();
    },
  });
}

export const removeCompleted = createRemoveCompleted(todoList);
export const toggleAll = createToggleAll(todoList);

export const $totalSize = combine(todoList.$items, (items) => {
  return items.reduce((acc, { subtasksTotal }) => acc + 1 + subtasksTotal, 0);
});

export const $todoDraft = createStore('');
export const editDraft = createEvent<string>();
sample({ clock: editDraft, target: $todoDraft });

function createID() {
  return `id-${Math.random().toString(36).slice(2, 10)}`;
}

export const addTodo = createAddTodo(todoList);

function addIds(inputs: InputTodo[]): TodoInputShape[] {
  return inputs.map(({ title, subtasks = [] }) => ({
    id: createID(),
    title,
    subtasks: addIds(subtasks),
  }));
}

todoList.edit.add(
  addIds([
    { title: '🖱 Double-click to edit' },
    { title: 'Effector models' },
    {
      title: 'Example task',
      subtasks: [
        {
          title: 'subtask #1',
          subtasks: [{ title: 'Foo' }, { title: 'Bar' }],
        },
        { title: 'subtask #2' },
      ],
    },
  ]),
);
