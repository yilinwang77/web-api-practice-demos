"use client";

import { useState, type FormEvent } from "react";
import FormField from "@/components/FormField";
import type { NewTodoInput } from "@/lib/api";
import type { TodoCategory, TodoPriority } from "@/types/todo";

interface TodoFormProps {
  onAdd: (todo: NewTodoInput) => void;
}

const CATEGORIES: TodoCategory[] = ["仕事", "プライベート", "勉強", "その他"];
const PRIORITIES: { value: TodoPriority; label: string }[] = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

const FIELD_CLASS =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100/10";

export default function TodoForm({ onAdd }: TodoFormProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TodoCategory>("仕事");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    onAdd({
      title: trimmed,
      category,
      priority,
      dueDate: dueDate || null,
    });

    setTitle("");
    setDueDate("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <FormField label="タスク名">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タスクを入力..."
            className={FIELD_CLASS}
          />
        </FormField>
      </div>

      <FormField label="カテゴリ">
        <select value={category} onChange={(e) => setCategory(e.target.value as TodoCategory)} className={FIELD_CLASS}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="優先度">
        <select value={priority} onChange={(e) => setPriority(e.target.value as TodoPriority)} className={FIELD_CLASS}>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="期限">
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={FIELD_CLASS} />
      </FormField>

      <button
        type="submit"
        className="flex h-fit items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 active:scale-[0.97] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 4a1 1 0 011 1v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H5a1 1 0 110-2h4V5a1 1 0 011-1z" />
        </svg>
        追加
      </button>
    </form>
  );
}
