import { NextRequest, NextResponse } from "next/server";
import { insertTodo, listTodos } from "@/lib/db";
import { filterTodos, sortTodos } from "@/lib/todoQuery";
import type { FilterStatus, SortKey, Todo, TodoCategory, TodoPriority } from "@/types/todo";

const CATEGORIES: TodoCategory[] = ["仕事", "プライベート", "勉強", "その他"];
const PRIORITIES: TodoPriority[] = ["high", "medium", "low"];

export function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") ?? "all") as FilterStatus;
  const sort = (searchParams.get("sort") ?? "createdAt") as SortKey;

  const todos = sortTodos(filterTodos(listTodos(), status), sort);
  return NextResponse.json(todos);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "title は必須です" }, { status: 400 });
  }
  if (body.category !== undefined && !CATEGORIES.includes(body.category)) {
    return NextResponse.json({ error: "category が不正です" }, { status: 400 });
  }
  if (body.priority !== undefined && !PRIORITIES.includes(body.priority)) {
    return NextResponse.json({ error: "priority が不正です" }, { status: 400 });
  }

  const todo: Todo = {
    id: crypto.randomUUID(),
    title: body.title.trim(),
    completed: false,
    category: body.category ?? "その他",
    priority: body.priority ?? "medium",
    dueDate: body.dueDate ?? null,
    createdAt: new Date().toISOString(),
  };

  insertTodo(todo);
  return NextResponse.json(todo, { status: 201 });
}
