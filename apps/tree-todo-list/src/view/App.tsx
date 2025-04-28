import { KeyboardEvent, ChangeEvent } from 'react';
import { useUnit } from 'effector-react';
import { useEntityList } from '@effector/model-react';

import { todoList, addTodo } from '../model';
// import {
//   addTodo,
//   clearCompleted,
//   toggleAll,
//   changeDraft,
//   $descriptionDraft,
// } from '../model.old';
import { TodoCount } from './TodoCount';
import { TodoFilters } from './TodoFilters';
import { TodoItem } from './TodoItem';

import './main.css';

export const App = () => {
  const [addTodoClicked] = useUnit([addTodo]);
  // const draft = useUnit($descriptionDraft);
  const onChangeDraft = (e: ChangeEvent<HTMLInputElement>) => {
    // changeDraft(e.target.value);
  };
  const onAddTodo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const input = e.currentTarget;
    if (input.value && input.value.trim()) {
      addTodoClicked([
        {
          title: input.value.trim(),
        },
      ]);
    }
  };
  const onToggleAll = (e: ChangeEvent<HTMLInputElement>) => {
    // toggleAll(e.currentTarget.checked);
  };
  const onClearCompleted = () => {
    // clearCompleted();
  };
  return (
    <section className="todoapp">
      <div>
        <header className="header">
          <h1>TodoApp</h1>
          <input
            className="new-todo"
            placeholder="What needs to be done?"
            onKeyDown={onAddTodo}
            onChange={onChangeDraft}
            value={'---'}
          />
        </header>
        <section className="main">
          <input
            type="checkbox"
            className="toggle-all"
            id="toggle-all"
            onChange={onToggleAll}
          />
          <label htmlFor="toggle-all" />
          {useEntityList(todoList, () => (
            <TodoItem nesting={0} />
          ))}
        </section>
        <footer className="footer">
          <TodoCount />
          <TodoFilters />
          <button
            type="button"
            className="clear-completed"
            onClick={onClearCompleted}
          >
            Clear completed
          </button>
        </footer>
      </div>
    </section>
  );
};
