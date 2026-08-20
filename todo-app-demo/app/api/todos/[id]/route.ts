import { NextRequest, NextResponse } from "next/server";
import { deleteTodo, getTodo, updateTodo, type TodoPatch } from "@/lib/db";
import type { TodoCategory, TodoPriority } from "@/types/todo";

const CATEGORIES: TodoCategory[] = ["仕事", "プライベート", "勉強", "その他"];
const PRIORITIES: TodoPriority[] = ["high", "medium", "low"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const todo = getTodo(id);
  if (!todo) return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  return NextResponse.json(todo);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }

  const patch: TodoPatch = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "title が不正です" }, { status: 400 });
    }
    patch.title = body.title.trim();
  }
  if (body.completed !== undefined) {
    if (typeof body.completed !== "boolean") {
      return NextResponse.json({ error: "completed が不正です" }, { status: 400 });
    }
    patch.completed = body.completed;
  }
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "category が不正です" }, { status: 400 });
    }
    patch.category = body.category;
  }
  if (body.priority !== undefined) {
    if (!PRIORITIES.includes(body.priority)) {
      return NextResponse.json({ error: "priority が不正です" }, { status: 400 });
    }
    patch.priority = body.priority;
  }
  if (body.dueDate !== undefined) {
    patch.dueDate = body.dueDate;
  }

  const updated = updateTodo(id, patch);
  if (!updated) return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const deleted = deleteTodo(id);
  if (!deleted) return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
