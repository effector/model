import type { KeyboardEvent, ChangeEvent } from 'react';
import {
  useEntityItem,
  useItemApi,
  useEntityList,
  useEditItemField,
  useEditKeyval,
} from '@effector/model-react';

import { todoList } from '../model';

export const TodoItem = ({ nesting }: { nesting: number }) => {
  const {
    id,
    title,
    completed,
    editing,
    titleDraft,
    subtasksTotal,
    subtasksVisible,
    visible,
  } = useEntityItem(todoList);
  const { remove } = useEditKeyval(todoList);
  const api = useItemApi(todoList);
  const fieldApi = useEditItemField(todoList);
  const onToggle = () => api.toggleCompleted();
  const onRemove = () => {
    remove(id);
  };
  const onAddChild = () => {
    // addTodoFromDraft({ childOf: id });
  };
  const onEdit = () => api.editMode('on');
  const onSave = () => api.saveDraft();
  const onConfirm = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') api.saveDraft();
    else if (e.key === 'Escape') api.editMode('off');
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldApi.titleDraft(e.target.value);
  };
  const subtasksList = useEntityList({
    keyval: todoList,
    field: 'subtasks',
    fn: () => <TodoItem nesting={nesting + 1} />,
  });
  if (!visible) return null;
  return (
    <ul className="todo-list" style={{ '--nesting': nesting } as any}>
      <li data-completed={completed || null} data-editing={editing || null}>
        <div className="view">
          <input
            className="toggle"
            type="checkbox"
            checked={completed}
            onChange={onToggle}
          />
          <label onDoubleClick={onEdit}>
            <span data-item-title>{title}</span>
            {subtasksTotal > 0 && (
              <span data-item-stats>
                {subtasksVisible} subtasks out of {subtasksTotal} are shown
              </span>
            )}
          </label>
          <button type="button" onClick={onAddChild} data-item-button="+" />
          <button type="button" onClick={onRemove} data-item-button="×" />
        </div>
        <input
          className="edit"
          onBlur={onSave}
          onKeyDown={onConfirm}
          onChange={onChange}
          value={titleDraft}
        />
      </li>
      {subtasksList}
    </ul>
  );
};
