"use client";

import { useEffect, useMemo, useState } from "react";
import TodoForm from "@/components/TodoForm";
import TodoList from "@/components/TodoList";
import FilterBar from "@/components/FilterBar";
import { createTodo, deleteTodoRequest, fetchTodos, patchTodo, type NewTodoInput } from "@/lib/api";
import { filterTodos, sortTodos } from "@/lib/todoQuery";
import type { FilterStatus, SortKey, Todo } from "@/types/todo";

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");

  // 初回マウント時に API からタスク一覧を取得する
  useEffect(() => {
    fetchTodos()
      .then((data) => setTodos(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoaded(true));
  }, []);

  async function handleAdd(input: NewTodoInput) {
    try {
      const todo = await createTodo(input);
      setTodos((prev) => [todo, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    }
  }

  async function handleToggle(id: string) {
    const target = todos.find((todo) => todo.id === id);
    if (!target) return;
    try {
      const updated = await patchTodo(id, { completed: !target.completed });
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTodoRequest(id);
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
    }
  }

  async function handleEdit(id: string, newTitle: string) {
    try {
      const updated = await patchTodo(id, { title: newTitle });
      setTodos((prev) => prev.map((todo) => (todo.id === id ? updated : todo)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    }
  }

  const visibleTodos = useMemo(
    () => sortTodos(filterTodos(todos, filter), sortKey),
    [todos, filter, sortKey],
  );

  const completedCount = todos.filter((todo) => todo.completed).length;
  const progress = todos.length === 0 ? 0 : Math.round((completedCount / todos.length) * 100);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-8 w-8 text-zinc-900 dark:text-zinc-50">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">やることリスト</h1>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {!loaded
            ? "読み込み中..."
            : todos.length === 0
              ? "なにもないよ。追加してみる？👀"
              : `${completedCount} / ${todos.length} 件完了`}
        </p>
        {todos.length > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all duration-300 dark:bg-zinc-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
      </header>

      <TodoForm onAdd={handleAdd} />

      <FilterBar filter={filter} onFilterChange={setFilter} sortKey={sortKey} onSortChange={setSortKey} />

      <TodoList todos={visibleTodos} onToggle={handleToggle} onDelete={handleDelete} onEdit={handleEdit} />
    </div>
  );
}
