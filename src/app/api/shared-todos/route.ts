import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// GET: Fetch todos for a given date (defaults to today)
export async function GET(req: NextRequest) {
  const db = getDb();
  const date = req.nextUrl.searchParams.get("date") || getToday();

  const todos = db
    .prepare(
      `SELECT t.id, t.date, t.user_id, t.text, t.completed, t.completed_at, t.created_at, u.name as user_name
       FROM shared_todos t
       JOIN users u ON u.id = t.user_id
       WHERE t.date = ?
       ORDER BY t.created_at ASC`
    )
    .all(date);

  const users = db.prepare("SELECT id, name FROM users").all();

  return NextResponse.json({ todos, users, date });
}

// POST: Add a new todo
export async function POST(req: NextRequest) {
  const { user_id, text, date } = await req.json();
  const db = getDb();
  const todoDate = date || getToday();

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }

  const result = db
    .prepare("INSERT INTO shared_todos (date, user_id, text) VALUES (?, ?, ?)")
    .run(todoDate, user_id, text.trim());

  return NextResponse.json({ id: result.lastInsertRowid });
}

// PATCH: Toggle todo completion
export async function PATCH(req: NextRequest) {
  const { id, completed } = await req.json();
  const db = getDb();

  db.prepare(
    "UPDATE shared_todos SET completed = ?, completed_at = ? WHERE id = ?"
  ).run(completed ? 1 : 0, completed ? new Date().toISOString() : null, id);

  return NextResponse.json({ ok: true });
}

// DELETE: Remove a todo
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  const db = getDb();
  db.prepare("DELETE FROM shared_todos WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
