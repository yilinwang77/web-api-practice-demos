export type TodoCategory = "仕事" | "プライベート" | "勉強" | "その他";

export type TodoPriority = "high" | "medium" | "low";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate: string | null;
  createdAt: string;
}

export type FilterStatus = "all" | "active" | "completed";

export type SortKey = "createdAt" | "dueDate" | "priority";
