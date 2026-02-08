import { getDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch aggregated stats for charts
// ?range=week|month|6months
export async function GET(req: NextRequest) {
  const db = getDb();
  const range = req.nextUrl.searchParams.get("range") || "week";

  let days: number;
  switch (range) {
    case "month":
      days = 30;
      break;
    case "6months":
      days = 180;
      break;
    default:
      days = 7;
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days + 1);
  const startStr = startDate.toISOString().slice(0, 10);

  // Get daily completed counts per user
  const rows = db
    .prepare(
      `SELECT t.date, t.user_id, u.name as user_name,
              COUNT(*) as total,
              SUM(t.completed) as completed
       FROM shared_todos t
       JOIN users u ON u.id = t.user_id
       WHERE t.date >= ?
       GROUP BY t.date, t.user_id
       ORDER BY t.date ASC`
    )
    .all(startStr) as {
    date: string;
    user_id: number;
    user_name: string;
    total: number;
    completed: number;
  }[];

  // Build full date range with zero-fills
  const users = db.prepare("SELECT id, name FROM users").all() as {
    id: number;
    name: string;
  }[];

  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const chartData = dates.map((date) => {
    const entry: Record<string, string | number> = { date };
    for (const u of users) {
      const row = rows.find((r) => r.date === date && r.user_id === u.id);
      entry[`${u.name}_completed`] = row ? Number(row.completed) : 0;
      entry[`${u.name}_total`] = row ? Number(row.total) : 0;
    }
    return entry;
  });

  // Totals for the range
  const totals = users.map((u) => {
    const userRows = rows.filter((r) => r.user_id === u.id);
    const completed = userRows.reduce((s, r) => s + Number(r.completed), 0);
    const total = userRows.reduce((s, r) => s + Number(r.total), 0);
    return { ...u, completed, total, xp: completed * 10 };
  });

  return NextResponse.json({ chartData, totals, dates, range });
}
