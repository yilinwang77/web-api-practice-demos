import type { Todo, TodoCategory, TodoPriority } from "@/types/todo";

export interface NewTodoInput {
  title: string;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate: string | null;
}

export interface TodoPatchInput {
  title?: string;
  completed?: boolean;
}

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `リクエストに失敗しました (${res.status})`);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export function fetchTodos(): Promise<Todo[]> {
  return fetch("/api/todos").then((res) => unwrap<Todo[]>(res));
}

export function createTodo(input: NewTodoInput): Promise<Todo> {
  return fetch("/api/todos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then((res) => unwrap<Todo>(res));
}

export function patchTodo(id: string, patch: TodoPatchInput): Promise<Todo> {
  return fetch(`/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  }).then((res) => unwrap<Todo>(res));
}

export function deleteTodoRequest(id: string): Promise<void> {
  return fetch(`/api/todos/${id}`, { method: "DELETE" }).then((res) => unwrap<void>(res));
}
