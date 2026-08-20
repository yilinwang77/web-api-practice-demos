"use client";

import type { FilterStatus, SortKey } from "@/types/todo";

interface FilterBarProps {
  filter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  sortKey: SortKey;
  onSortChange: (sortKey: SortKey) => void;
}

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "active", label: "未完了" },
  { value: "completed", label: "完了済み" },
];

const SORTS: { value: SortKey; label: string }[] = [
  { value: "createdAt", label: "作成日時" },
  { value: "dueDate", label: "期限" },
  { value: "priority", label: "優先度" },
];

export default function FilterBar({ filter, onFilterChange, sortKey, onSortChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => onFilterChange(f.value)}
            className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        並び替え
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:ring-zinc-100/10"
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
