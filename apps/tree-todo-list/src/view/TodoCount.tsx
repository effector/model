import { useUnit } from 'effector-react';
import { $totalSize } from '../model';

export const TodoCount = () => {
  const count = useUnit($totalSize);
  return (
    <span className="todo-count">
      <strong>{count}</strong>
      <span>&nbsp;{count === 1 ? 'item' : 'items'}</span>
    </span>
  );
};
