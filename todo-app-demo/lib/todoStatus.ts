import type { Todo } from "@/types/todo";

export type DueStatus = "overdue" | "due-today" | "normal";

const PRIORITY_LABEL: Record<Todo["priority"], string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function getPriorityLabel(priority: Todo["priority"]): string {
  return PRIORITY_LABEL[priority];
}

// 判断任务的截止状态：已过期 / 今天到期 / 正常
export function getDueStatus(todo: Todo): DueStatus {
  if (todo.completed || !todo.dueDate) {
    return "normal";
  }

  const today = new Date().toISOString().slice(0, 10);
  if (todo.dueDate < today) return "overdue";
  if (todo.dueDate === today) return "due-today";
  return "normal";
}
