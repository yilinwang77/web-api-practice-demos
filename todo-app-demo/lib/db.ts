import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import type { Todo } from "@/types/todo";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "todos.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    dueDate TEXT,
    createdAt TEXT NOT NULL
  )
`);

interface TodoRow {
  id: string;
  title: string;
  completed: number;
  category: Todo["category"];
  priority: Todo["priority"];
  dueDate: string | null;
  createdAt: string;
}

function rowToTodo(row: TodoRow): Todo {
  return { ...row, completed: Boolean(row.completed) };
}

export function listTodos(): Todo[] {
  const rows = db.prepare("SELECT * FROM todos ORDER BY createdAt DESC").all() as unknown as TodoRow[];
  return rows.map(rowToTodo);
}

export function getTodo(id: string): Todo | null {
  const row = db.prepare("SELECT * FROM todos WHERE id = ?").get(id) as unknown as TodoRow | undefined;
  return row ? rowToTodo(row) : null;
}

export function insertTodo(todo: Todo): Todo {
  db.prepare(
    `INSERT INTO todos (id, title, completed, category, priority, dueDate, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(todo.id, todo.title, todo.completed ? 1 : 0, todo.category, todo.priority, todo.dueDate, todo.createdAt);
  return todo;
}

export type TodoPatch = Partial<Pick<Todo, "title" | "completed" | "category" | "priority" | "dueDate">>;

export function updateTodo(id: string, patch: TodoPatch): Todo | null {
  const existing = getTodo(id);
  if (!existing) return null;

  const merged: Todo = { ...existing, ...patch };
  db.prepare(
    `UPDATE todos SET title = ?, completed = ?, category = ?, priority = ?, dueDate = ? WHERE id = ?`,
  ).run(merged.title, merged.completed ? 1 : 0, merged.category, merged.priority, merged.dueDate, id);
  return merged;
}

export function deleteTodo(id: string): boolean {
  const result = db.prepare("DELETE FROM todos WHERE id = ?").run(id);
  return result.changes > 0;
}
