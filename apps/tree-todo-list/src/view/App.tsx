import type { KeyboardEvent, ChangeEvent } from 'react';
import { useUnit } from 'effector-react';
import { useEntityList } from '@effector/model-react';

import {
  todoList,
  $todoDraft,
  editDraft,
  addTodo,
  removeCompleted,
  toggleAll,
} from '../model';
import { TodoCount } from './TodoCount';
import { TodoFilters } from './TodoFilters';
import { TodoItem } from './TodoItem';

import './main.css';

export const App = () => {
  const [todoDraft, onDraftChange, saveDraft, onRemoveCompleted, onToggleAll] =
    useUnit([$todoDraft, editDraft, addTodo, removeCompleted, toggleAll]);
  const onChangeDraft = (e: ChangeEvent<HTMLInputElement>) => {
    onDraftChange(e.target.value);
  };
  const onAddTodo = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    saveDraft();
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
            value={todoDraft}
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
            onClick={onRemoveCompleted}
          >
            Clear completed
          </button>
        </footer>
      </div>
    </section>
  );
};
