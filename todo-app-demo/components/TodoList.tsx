import type { Todo } from "@/types/todo";
import TodoItem from "@/components/TodoItem";

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
}

export default function TodoList({ todos, onToggle, onDelete, onEdit }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-zinc-300 dark:text-zinc-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">タスクはまだありません。追加してみましょう</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </ul>
  );
}
