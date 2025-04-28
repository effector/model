export type Todo = {
  title: string;
  completed: boolean;
  editing: boolean;
  titleEdited: string;
  childOf: string | null;
};

export type ActiveTodo = Todo & { completed: false };

export type InputTodo =
  | string
  | { title: string; parentTask?: string | null; subtasks?: InputTodo[] };
