import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { name, password } = await req.json();
  const db = getDb();

  const user = db
    .prepare("SELECT id, name FROM users WHERE name = ? AND password = ?")
    .get(name, password) as { id: number; name: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  return NextResponse.json({ id: user.id, name: user.name });
}
