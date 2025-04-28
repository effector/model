import { combine, createEvent, createStore, sample } from 'effector';
import { keyval, lazy, KeyvalWithState } from '@effector/model';
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

  const childsList = keyval(todoList) as KeyvalWithState<
    TodoInputShape,
    TodoShape
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
    },
    optional: ['completed', 'editing', 'titleDraft'],
  };
});

export const $totalSize = combine(todoList.$items, (items) => {
  return items.reduce((acc, { subtasksTotal }) => acc + 1 + subtasksTotal, 0);
});

export const addTodo = todoList.edit.add.prepend((inputs: InputTodo[]) => {
  function addIds(inputs: InputTodo[]): TodoInputShape[] {
    return inputs.map(({ title, subtasks = [] }) => ({
      id: `id-${Math.random().toString(36).slice(2, 10)}`,
      title,
      subtasks: addIds(subtasks),
    }));
  }
  return addIds(inputs);
});

addTodo([
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
]);
