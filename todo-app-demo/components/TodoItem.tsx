"use client";

import { useState, type KeyboardEvent } from "react";
import type { Todo } from "@/types/todo";
import { getDueStatus, type DueStatus } from "@/lib/todoStatus";
import TodoMeta from "@/components/TodoMeta";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, newTitle: string) => void;
}

const ROW_STYLE: Record<DueStatus, string> = {
  overdue: "border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/30",
  "due-today": "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/30",
  normal: "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
};

export default function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(todo.title);

  const dueStatus = getDueStatus(todo);

  function handleSave() {
    const trimmed = draftTitle.trim();
    if (trimmed) onEdit(todo.id, trimmed);
    setIsEditing(false);
  }

  function handleCancel() {
    setDraftTitle(todo.title);
    setIsEditing(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  }

  return (
    <li className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm transition-colors ${ROW_STYLE[dueStatus]}`}>
      <label className="relative flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center">
        <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo.id)} className="peer sr-only" />
        <span className="h-5 w-5 rounded-full border-2 border-zinc-300 transition-colors peer-checked:border-zinc-900 peer-checked:bg-zinc-900 dark:border-zinc-600 dark:peer-checked:border-zinc-100 dark:peer-checked:bg-zinc-100" />
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.5} className="pointer-events-none absolute h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100 dark:text-zinc-900">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4 8-8" />
        </svg>
      </label>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            className="w-full rounded border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800"
          />
        ) : (
          <p className={`truncate ${todo.completed ? "text-zinc-400 line-through dark:text-zinc-600" : "text-zinc-800 dark:text-zinc-100"}`}>
            {todo.title}
          </p>
        )}
        <TodoMeta todo={todo} dueStatus={dueStatus} />
      </div>

      {isEditing ? (
        <button onClick={handleSave} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          保存
        </button>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button onClick={() => setIsEditing(true)} aria-label="編集" className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button onClick={() => onDelete(todo.id)} aria-label="削除" className="rounded-lg p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400">
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M8 2a1 1 0 00-1 1v1H4a1 1 0 000 2h.5l.6 10.2A2 2 0 007.1 18h5.8a2 2 0 002-1.8L15.5 6H16a1 1 0 100-2h-3V3a1 1 0 00-1-1H8zm1 2V3h2v1H9zm-1.5 3a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 017.5 7zm4 0a.75.75 0 01.75.75v7.5a.75.75 0 01-1.5 0v-7.5A.75.75 0 0111.5 7z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </li>
  );
}
