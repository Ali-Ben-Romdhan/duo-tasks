import { getDb } from "@/lib/db";
import { NextResponse } from "next/server";

// GET: Calculate current streak for each user
// A streak = consecutive days (ending today or yesterday) where user had tasks AND completed ALL of them
export async function GET() {
  const db = getDb();
  const users = db.prepare("SELECT id, name FROM users").all() as {
    id: number;
    name: string;
  }[];

  const streaks = users.map((u) => {
    // Get all dates where this user had tasks, ordered descending
    const rows = db
      .prepare(
        `SELECT date,
                COUNT(*) as total,
                SUM(completed) as completed
         FROM shared_todos
         WHERE user_id = ?
         GROUP BY date
         ORDER BY date DESC`
      )
      .all(u.id) as { date: string; total: number; completed: number }[];

    let streak = 0;
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    // Start checking from today, then go backwards
    const checkDate = new Date(today);

    // If no tasks today, allow starting from yesterday
    if (rows.length > 0 && rows[0].date !== checkDate.toISOString().slice(0, 10)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const dayData = rows.find((r) => r.date === dateStr);

      if (dayData && dayData.total > 0 && dayData.completed === dayData.total) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return { id: u.id, name: u.name, streak };
  });

  return NextResponse.json({ streaks });
}
