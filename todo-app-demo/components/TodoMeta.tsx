import type { Todo } from "@/types/todo";
import { getPriorityLabel, type DueStatus } from "@/lib/todoStatus";

interface TodoMetaProps {
  todo: Todo;
  dueStatus: DueStatus;
}

const PRIORITY_PILL: Record<Todo["priority"], string> = {
  high: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

export default function TodoMeta({ todo, dueStatus }: TodoMetaProps) {
  const dueTextClass =
    dueStatus === "overdue"
      ? "text-red-600 dark:text-red-400"
      : dueStatus === "due-today"
        ? "text-amber-600 dark:text-amber-400"
        : "text-zinc-500 dark:text-zinc-400";

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
      <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
        {todo.category}
      </span>
      <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_PILL[todo.priority]}`}>
        {getPriorityLabel(todo.priority)}
      </span>
      {todo.dueDate && (
        <span className={`font-medium ${dueTextClass}`}>
          期限: {todo.dueDate}
          {dueStatus === "overdue" ? "（期限切れ）" : dueStatus === "due-today" ? "（本日締切）" : ""}
        </span>
      )}
    </div>
  );
}
