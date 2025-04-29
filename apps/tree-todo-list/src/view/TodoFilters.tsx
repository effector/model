import { useUnit } from 'effector-react';
import { $filterMode, changeFilterMode } from '../model';

export const TodoFilters = () => {
  const [mode, onChange] = useUnit([$filterMode, changeFilterMode]);
  return (
    <ul data-filter-mode={mode}>
      <li>
        <a onClick={() => onChange('all')} data-filter="all">
          All
        </a>
      </li>
      <span> </span>
      <li>
        <a onClick={() => onChange('active')} data-filter="active">
          Active
        </a>
      </li>
      <li>
        <a onClick={() => onChange('completed')} data-filter="completed">
          Completed
        </a>
      </li>
    </ul>
  );
};
