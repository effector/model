import { ChangeEvent } from 'react';
import { useUnit } from 'effector-react';
import { useEntityList } from '@effector/model-react';

import { todoList, $todoDraft, editDraft } from '../model';
import { TodoCount } from './TodoCount';
import { TodoFilters } from './TodoFilters';
import { TodoItem } from './TodoItem';

import './main.css';

export const App = () => {
  const [todoDraft, onDraftChange] = useUnit([$todoDraft, editDraft]);
  const onChangeDraft = (e: ChangeEvent<HTMLInputElement>) => {
    onDraftChange(e.target.value);
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
            onClick={onClearCompleted}
          >
            Clear completed
          </button>
        </footer>
      </div>
    </section>
  );
};
