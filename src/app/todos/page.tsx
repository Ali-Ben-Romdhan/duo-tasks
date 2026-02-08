"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface User {
  id: number;
  name: string;
}

interface Todo {
  id: number;
  date: string;
  user_id: number;
  text: string;
  completed: number;
  completed_at: string | null;
  created_at: string;
  user_name: string;
}

interface ChartRow {
  date: string;
  [key: string]: string | number;
}

interface RangeTotal {
  id: number;
  name: string;
  completed: number;
  total: number;
  xp: number;
}

const XP_PER_TASK = 10;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatLabel(dateStr: string, range: string): string {
  const d = new Date(dateStr + "T12:00:00");
  if (range === "week") return d.toLocaleDateString("en-US", { weekday: "short" });
  if (range === "month") return d.getDate().toString();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function SharedTodos() {
  // Auth state - restore from localStorage
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Todos state
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Chart state
  const [chartRange, setChartRange] = useState<"week" | "month" | "6months">("week");
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [rangeTotals, setRangeTotals] = useState<RangeTotal[]>([]);
  const [activeTab, setActiveTab] = useState<"tasks" | "stats">("tasks");

  const isToday = selectedDate === formatDate(new Date());

  // Restore auth on mount + register service worker
  useEffect(() => {
    const saved = localStorage.getItem("duo_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
    setAuthLoaded(true);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Save auth to localStorage
  function loginUser(user: User) {
    setCurrentUser(user);
    localStorage.setItem("duo_user", JSON.stringify(user));
  }

  function logoutUser() {
    setCurrentUser(null);
    localStorage.removeItem("duo_user");
  }

  const fetchTodos = useCallback(async () => {
    const res = await fetch(`/api/shared-todos?date=${selectedDate}`);
    const data = await res.json();
    setTodos(data.todos);
    setUsers(data.users);
  }, [selectedDate]);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/stats?range=${chartRange}`);
    const data = await res.json();
    setChartData(data.chartData);
    setRangeTotals(data.totals);
  }, [chartRange]);

  // Poll todos
  useEffect(() => {
    if (!currentUser) return;
    fetchTodos();
    intervalRef.current = setInterval(fetchTodos, 1500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentUser, fetchTodos]);

  // Fetch stats when tab or range changes
  useEffect(() => {
    if (!currentUser || activeTab !== "stats") return;
    fetchStats();
  }, [currentUser, activeTab, fetchStats]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: loginName, password: loginPassword }),
    });
    if (!res.ok) {
      setLoginError("Wrong name or password");
      return;
    }
    const user = await res.json();
    loginUser(user);
  }

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTask.trim() || !currentUser) return;
    setLoading(true);
    await fetch("/api/shared-todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: currentUser.id, text: newTask, date: selectedDate }),
    });
    setNewTask("");
    await fetchTodos();
    setLoading(false);
  }

  async function toggleTodo(id: number, completed: boolean) {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, completed: completed ? 1 : 0, completed_at: completed ? new Date().toISOString() : null }
          : t
      )
    );
    await fetch("/api/shared-todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed }),
    });
  }

  async function deleteTodo(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await fetch("/api/shared-todos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  function shiftDate(days: number) {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  }

  // Loading state while checking localStorage
  if (!authLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  // Login screen
  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-800">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800"
        >
          <h1 className="mb-1 text-center text-2xl font-bold">Duo Tasks</h1>
          <p className="mb-6 text-center text-sm text-zinc-500">
            Sign in to your shared todo list
          </p>
          {loginError && (
            <p className="mb-4 rounded-lg bg-red-50 p-2 text-center text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
              {loginError}
            </p>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Name
              </label>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-700"
                placeholder="Ali or Marwa"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-700"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Compute stats per user for selected date
  const statsByUser = users.map((u) => {
    const userTodos = todos.filter((t) => t.user_id === u.id);
    const completed = userTodos.filter((t) => t.completed).length;
    const total = userTodos.length;
    const xp = completed * XP_PER_TASK;
    return { ...u, userTodos, completed, total, xp };
  });

  const leaderboard = [...statsByUser].sort((a, b) => b.xp - a.xp);
  const myStats = statsByUser.find((s) => s.id === currentUser.id);
  const partnerStats = statsByUser.find((s) => s.id !== currentUser.id);

  // For 6-month view, aggregate into weekly buckets
  const displayData: ChartRow[] = (() => {
    if (chartRange !== "6months" || chartData.length === 0) return chartData;
    const weeks: ChartRow[] = [];
    for (let i = 0; i < chartData.length; i += 7) {
      const slice = chartData.slice(i, i + 7);
      const bucket: ChartRow = { date: slice[0].date };
      for (const key of Object.keys(slice[0])) {
        if (key === "date") continue;
        bucket[key] = slice.reduce((s, r) => s + ((r[key] as number) || 0), 0);
      }
      weeks.push(bucket);
    }
    return weeks;
  })();

  const maxVal = Math.max(
    ...displayData.map((row) => {
      let m = 0;
      for (const key of Object.keys(row)) {
        if (key.endsWith("_completed") && typeof row[key] === "number") {
          m = Math.max(m, row[key] as number);
        }
      }
      return m;
    }),
    1
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Duo Tasks</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            {currentUser.name}
          </span>
          <button
            onClick={logoutUser}
            className="text-sm text-zinc-400 hover:text-zinc-600"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            activeTab === "tasks"
              ? "bg-white shadow dark:bg-zinc-700"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
            activeTab === "stats"
              ? "bg-white shadow dark:bg-zinc-700"
              : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          Progress
        </button>
      </div>

      {activeTab === "tasks" && (
        <>
          {/* Date navigator */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <button
              onClick={() => shiftDate(-1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              &larr;
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
            />
            <button
              onClick={() => shiftDate(1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              &rarr;
            </button>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(formatDate(new Date()))}
                className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              >
                Today
              </button>
            )}
          </div>

          {/* Add task */}
          <form onSubmit={addTodo} className="mb-6 flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800"
            />
            <button
              type="submit"
              disabled={loading || !newTask.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
            >
              Add
            </button>
          </form>

          {/* Two columns */}
          <div className="grid gap-6 md:grid-cols-2">
            {[myStats, partnerStats].map((stats) => {
              if (!stats) return null;
              const isMe = stats.id === currentUser.id;
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

              return (
                <div
                  key={stats.id}
                  className={`rounded-2xl border p-5 ${
                    isMe
                      ? "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/20"
                      : "border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-900/20"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                      {stats.name}
                      {isMe && (
                        <span className="ml-2 text-xs font-normal text-zinc-400">(you)</span>
                      )}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isMe
                          ? "bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-200"
                          : "bg-pink-200 text-pink-700 dark:bg-pink-800 dark:text-pink-200"
                      }`}
                    >
                      {stats.xp} XP
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>{stats.completed}/{stats.total} done</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMe ? "bg-violet-500" : "bg-pink-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Task list */}
                  <ul className="space-y-2">
                    {stats.userTodos.length === 0 && (
                      <li className="py-4 text-center text-sm text-zinc-400">No tasks yet</li>
                    )}
                    {stats.userTodos.map((todo) => (
                      <li
                        key={todo.id}
                        className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 dark:bg-zinc-800/70"
                      >
                        <button
                          onClick={() => {
                            if (isMe) toggleTodo(todo.id, !todo.completed);
                          }}
                          disabled={!isMe}
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                            todo.completed
                              ? isMe
                                ? "border-violet-500 bg-violet-500 text-white"
                                : "border-pink-500 bg-pink-500 text-white"
                              : "border-zinc-300 dark:border-zinc-600"
                          } ${!isMe ? "cursor-default" : "cursor-pointer hover:border-zinc-400"}`}
                        >
                          {todo.completed ? (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </button>
                        <span
                          className={`flex-1 text-sm ${
                            todo.completed ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {todo.text}
                        </span>
                        {isMe && (
                          <button
                            onClick={() => deleteTodo(todo.id)}
                            className="text-xs text-zinc-300 hover:text-red-500"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Leaderboard */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <h2 className="mb-4 text-center text-lg font-bold">
              {isToday ? "Today's" : selectedDate} Leaderboard
            </h2>
            <div className="space-y-3">
              {leaderboard.map((entry, i) => {
                const medal = i === 0 ? "1st" : "2nd";
                const isWinning = i === 0 && entry.xp > 0;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                      isWinning ? "bg-amber-100 dark:bg-amber-900/40" : "bg-white/70 dark:bg-zinc-800/70"
                    }`}
                  >
                    <span className="text-2xl">
                      {i === 0 ? (entry.xp > 0 ? "\u{1F451}" : "\u{1F3C1}") : "\u2B50"}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.name}
                        {entry.id === currentUser.id && (
                          <span className="ml-1 text-xs font-normal text-zinc-400">(you)</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">{entry.completed} tasks completed</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{entry.xp} XP</p>
                      <p className="text-xs text-zinc-400">{medal}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {leaderboard.length >= 2 && leaderboard[0].xp === leaderboard[1].xp && (
              <p className="mt-3 text-center text-sm text-zinc-500">
                It&apos;s a tie! Keep going!
              </p>
            )}
            {leaderboard.length >= 2 && leaderboard[0].xp > leaderboard[1].xp && (
              <p className="mt-3 text-center text-sm font-medium text-amber-600 dark:text-amber-400">
                {leaderboard[0].name} is in the lead!
              </p>
            )}
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <>
          {/* Range selector */}
          <div className="mb-6 flex justify-center gap-2">
            {(["week", "month", "6months"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setChartRange(r)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  chartRange === r
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {r === "week" ? "7 Days" : r === "month" ? "30 Days" : "6 Months"}
              </button>
            ))}
          </div>

          {/* Bar chart */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-800">
            <h3 className="mb-4 text-center text-sm font-semibold text-zinc-600 dark:text-zinc-400">
              {chartRange === "6months" ? "Tasks Completed Per Week" : "Tasks Completed Per Day"}
            </h3>
            <div className="flex min-w-0 items-end gap-px" style={{ height: 200 }}>
              {displayData.map((row, i) => {
                const showLabel = chartRange === "month" ? i % 3 === 0 : true;
                return (
                  <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
                    <div className="flex w-full items-end justify-center gap-px" style={{ height: 170 }}>
                      {users.map((u) => {
                        const val = (row[`${u.name}_completed`] as number) || 0;
                        const h = maxVal > 0 ? (val / maxVal) * 160 : 0;
                        const isAli = u.name === "Ali";
                        return (
                          <div
                            key={u.id}
                            title={`${u.name}: ${val} tasks — ${row.date}`}
                            className={`min-w-0 rounded-t transition-all duration-300 ${
                              isAli ? "bg-violet-500" : "bg-pink-500"
                            }`}
                            style={{
                              height: Math.max(h, val > 0 ? 4 : 0),
                              width: "45%",
                            }}
                          />
                        );
                      })}
                    </div>
                    {showLabel && (
                      <span className="mt-1 truncate text-[10px] text-zinc-400">
                        {chartRange === "6months"
                          ? new Date(row.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : formatLabel(row.date, chartRange)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-violet-500" />
                <span className="text-xs text-zinc-500">Ali</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-sm bg-pink-500" />
                <span className="text-xs text-zinc-500">Marwa</span>
              </div>
            </div>
          </div>

          {/* Range totals */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <h3 className="mb-4 text-center text-lg font-bold">
              {chartRange === "week" ? "Weekly" : chartRange === "month" ? "Monthly" : "6-Month"} Summary
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {[...rangeTotals].sort((a, b) => b.xp - a.xp).map((entry, i) => {
                const pct = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
                const isAli = entry.name === "Ali";
                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl p-4 ${
                      i === 0 && entry.xp > 0
                        ? "bg-amber-100 dark:bg-amber-900/40"
                        : "bg-white/70 dark:bg-zinc-800/70"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{i === 0 && entry.xp > 0 ? "\u{1F451}" : "\u2B50"}</span>
                        <span className="font-bold">{entry.name}</span>
                      </div>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {entry.xp} XP
                      </span>
                    </div>
                    <div className="mb-1 flex justify-between text-xs text-zinc-500">
                      <span>{entry.completed}/{entry.total} tasks</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAli ? "bg-violet-500" : "bg-pink-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <p className="mt-4 text-center text-xs text-zinc-400">
        Live sync enabled
      </p>
    </div>
  );
}
