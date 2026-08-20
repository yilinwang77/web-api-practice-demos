import type { FilterStatus, SortKey, Todo } from "@/types/todo";

const PRIORITY_ORDER: Record<Todo["priority"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function filterTodos(todos: Todo[], filter: FilterStatus): Todo[] {
  if (filter === "active") return todos.filter((todo) => !todo.completed);
  if (filter === "completed") return todos.filter((todo) => todo.completed);
  return todos;
}

// 无截止日期的任务在按日期排序时排到最后
export function sortTodos(todos: Todo[], sortKey: SortKey): Todo[] {
  const sorted = [...todos];

  if (sortKey === "createdAt") {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sortKey === "dueDate") {
    sorted.sort((a, b) => (a.dueDate ?? "9999-99-99").localeCompare(b.dueDate ?? "9999-99-99"));
  } else {
    sorted.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  return sorted;
}
