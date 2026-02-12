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

interface Streak {
  id: number;
  name: string;
  streak: number;
}

interface Confetto {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const XP_PER_TASK = 10;

const QUOTES = [
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Dreams don't work unless you do.", author: "John C. Maxwell" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Little things make big days.", author: "Unknown" },
  { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
  { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Self-discipline is the magic power that makes you virtually unstoppable.", author: "Dan Kennedy" },
  { text: "We carry all the power we need inside ourselves.", author: "J.K. Rowling" },
  { text: "Success isn't always about greatness. It's about consistency.", author: "Dwayne Johnson" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "The pain you feel today will be the strength you feel tomorrow.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupery" },
  { text: "Willpower is a muscle. The more you use it, the stronger it gets.", author: "Unknown" },
  { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Work hard in silence, let your success be your noise.", author: "Frank Ocean" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
  { text: "What seems impossible today will one day become your warm-up.", author: "Unknown" },
  { text: "Be stronger than your excuses.", author: "Unknown" },
  { text: "Your life does not get better by chance. It gets better by change.", author: "Jim Rohn" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Tough times never last, but tough people do.", author: "Robert Schuller" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Don't limit your challenges. Challenge your limits.", author: "Unknown" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
  { text: "What you do today can improve all your tomorrows.", author: "Ralph Marston" },
  { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
  { text: "Every champion was once a contender that refused to give up.", author: "Rocky Balboa" },
  { text: "Stop being afraid of what could go wrong, and start being excited about what could go right.", author: "Tony Robbins" },
  { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
];

function getTodayQuote(): (typeof QUOTES)[0] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [chartRange, setChartRange] = useState<"week" | "month" | "6months">("week");
  const [chartData, setChartData] = useState<ChartRow[]>([]);
  const [rangeTotals, setRangeTotals] = useState<RangeTotal[]>([]);
  const [activeTab, setActiveTab] = useState<"tasks" | "stats">("tasks");

  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [confetti, setConfetti] = useState<Confetto[]>([]);
  const confettiIdRef = useRef(0);

  const isToday = selectedDate === formatDate(new Date());
  const quote = getTodayQuote();

  useEffect(() => {
    const saved = localStorage.getItem("duo_user");
    if (saved) {
      try { setCurrentUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setAuthLoaded(true);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  function loginUser(user: User) {
    setCurrentUser(user);
    localStorage.setItem("duo_user", JSON.stringify(user));
  }

  function logoutUser() {
    setCurrentUser(null);
    localStorage.removeItem("duo_user");
  }

  function fireConfetti() {
    const colors = ["#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];
    const pieces: Confetto[] = Array.from({ length: 50 }, () => ({
      id: confettiIdRef.current++,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.3,
      duration: 1.5 + Math.random() * 1.5,
      size: 6 + Math.random() * 6,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 3500);
  }

  const fetchTodos = useCallback(async () => {
    const res = await fetch(`/api/shared-todos?date=${selectedDate}`);
    const data = await res.json();
    setTodos(data.todos);
    setUsers(data.users);
  }, [selectedDate]);

  const fetchStreaks = useCallback(async () => {
    const res = await fetch("/api/streaks");
    const data = await res.json();
    setStreaks(data.streaks);
  }, []);

  const fetchStats = useCallback(async () => {
    const res = await fetch(`/api/stats?range=${chartRange}`);
    const data = await res.json();
    setChartData(data.chartData);
    setRangeTotals(data.totals);
  }, [chartRange]);

  useEffect(() => {
    if (!currentUser) return;
    fetchTodos();
    fetchStreaks();
    intervalRef.current = setInterval(() => { fetchTodos(); fetchStreaks(); }, 1500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [currentUser, fetchTodos, fetchStreaks]);

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
    if (!res.ok) { setLoginError("Wrong name or password"); return; }
    loginUser(await res.json());
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
    const updated = todos.map((t) =>
      t.id === id
        ? { ...t, completed: completed ? 1 : 0, completed_at: completed ? new Date().toISOString() : null }
        : t
    );
    setTodos(updated);
    await fetch("/api/shared-todos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed }),
    });
    if (completed && currentUser) {
      const myTodos = updated.filter((t) => t.user_id === currentUser.id);
      if (myTodos.length > 0 && myTodos.every((t) => t.completed)) fireConfetti();
    }
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

  if (!authLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50 dark:from-zinc-900 dark:to-zinc-800">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl dark:bg-zinc-800">
          <h1 className="mb-1 text-center text-2xl font-bold">Duo Tasks</h1>
          <p className="mb-6 text-center text-sm text-zinc-500">Sign in to your shared todo list</p>
          {loginError && (
            <p className="mb-4 rounded-lg bg-red-50 p-2 text-center text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{loginError}</p>
          )}
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
              <input type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-700"
                placeholder="Ali or Marwa" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-700"
                placeholder="Enter password" required />
            </div>
            <button type="submit" className="w-full rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700">
              Sign In
            </button>
          </div>
        </form>
      </div>
    );
  }

  const statsByUser = users.map((u) => {
    const userTodos = todos.filter((t) => t.user_id === u.id);
    const completed = userTodos.filter((t) => t.completed).length;
    const total = userTodos.length;
    const xp = completed * XP_PER_TASK;
    const streak = streaks.find((s) => s.id === u.id)?.streak || 0;
    return { ...u, userTodos, completed, total, xp, streak };
  });

  const leaderboard = [...statsByUser].sort((a, b) => b.xp - a.xp);
  const myStats = statsByUser.find((s) => s.id === currentUser.id);
  const partnerStats = statsByUser.find((s) => s.id !== currentUser.id);

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
        if (key.endsWith("_completed") && typeof row[key] === "number") m = Math.max(m, row[key] as number);
      }
      return m;
    }),
    1
  );

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-6">
      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {confetti.map((c) => (
            <div
              key={c.id}
              className="absolute animate-confetti"
              style={{
                left: `${c.x}%`,
                top: "-10px",
                width: c.size,
                height: c.size * 0.6,
                backgroundColor: c.color,
                borderRadius: 2,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Duo Tasks</h1>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">
            {currentUser.name}
          </span>
          <button onClick={logoutUser} className="text-sm text-zinc-400 hover:text-zinc-600">Sign out</button>
        </div>
      </div>

      {/* Daily quote */}
      <div className="mb-6 rounded-xl border border-zinc-200 bg-gradient-to-r from-violet-50 to-pink-50 px-5 py-4 dark:border-zinc-700 dark:from-zinc-800 dark:to-zinc-800">
        <p className="text-sm italic text-zinc-700 dark:text-zinc-300">&ldquo;{quote.text}&rdquo;</p>
        <p className="mt-1 text-xs text-zinc-500">&mdash; {quote.author}</p>
      </div>

      {/* Streak badges */}
      {streaks.some((s) => s.streak > 0) && (
        <div className="mb-6 flex justify-center gap-4">
          {statsByUser.map((s) => (
            <div key={s.id} className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1.5 dark:bg-orange-900/30">
              <span className="text-lg">{s.streak > 0 ? "\uD83D\uDD25" : "\u2744\uFE0F"}</span>
              <span className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                {s.name}: {s.streak} day{s.streak !== 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button onClick={() => setActiveTab("tasks")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === "tasks" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500 hover:text-zinc-700"}`}>
          Tasks
        </button>
        <button onClick={() => setActiveTab("stats")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${activeTab === "stats" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-500 hover:text-zinc-700"}`}>
          Progress
        </button>
      </div>

      {activeTab === "tasks" && (
        <>
          {/* Date navigator */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <button onClick={() => shiftDate(-1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">&larr;</button>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800" />
            <button onClick={() => shiftDate(1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800">&rarr;</button>
            {!isToday && (
              <button onClick={() => setSelectedDate(formatDate(new Date()))}
                className="rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">Today</button>
            )}
          </div>

          {/* Add task */}
          <form onSubmit={addTodo} className="mb-6 flex gap-2">
            <input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Add a new task..."
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-600 dark:bg-zinc-800" />
            <button type="submit" disabled={loading || !newTask.trim()}
              className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50">Add</button>
          </form>

          {/* Two columns */}
          <div className="grid gap-6 md:grid-cols-2">
            {[myStats, partnerStats].map((stats) => {
              if (!stats) return null;
              const isMe = stats.id === currentUser.id;
              const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
              const allDone = stats.total > 0 && stats.completed === stats.total;

              return (
                <div key={stats.id}
                  className={`rounded-2xl border p-5 ${isMe
                    ? "border-violet-200 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-900/20"
                    : "border-pink-200 bg-pink-50/50 dark:border-pink-800 dark:bg-pink-900/20"}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold">
                      {stats.name}
                      {isMe && <span className="ml-2 text-xs font-normal text-zinc-400">(you)</span>}
                      {stats.streak > 0 && <span className="ml-2 text-sm" title={`${stats.streak} day streak`}>{"\uD83D\uDD25"}{stats.streak}</span>}
                    </h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isMe
                      ? "bg-violet-200 text-violet-700 dark:bg-violet-800 dark:text-violet-200"
                      : "bg-pink-200 text-pink-700 dark:bg-pink-800 dark:text-pink-200"}`}>
                      {stats.xp} XP
                    </span>
                  </div>

                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
                    <span>{stats.completed}/{stats.total} done{allDone && " \u2705"}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-green-500" : isMe ? "bg-violet-500" : "bg-pink-500"}`}
                      style={{ width: `${pct}%` }} />
                  </div>

                  <ul className="space-y-2">
                    {stats.userTodos.length === 0 && (
                      <li className="py-4 text-center text-sm text-zinc-400">No tasks yet</li>
                    )}
                    {stats.userTodos.map((todo) => (
                      <li key={todo.id} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2 dark:bg-zinc-800/70">
                        <button
                          onClick={() => { if (isMe) toggleTodo(todo.id, !todo.completed); }}
                          disabled={!isMe}
                          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition ${
                            todo.completed
                              ? isMe ? "border-violet-500 bg-violet-500 text-white" : "border-pink-500 bg-pink-500 text-white"
                              : "border-zinc-300 dark:border-zinc-600"
                          } ${!isMe ? "cursor-default" : "cursor-pointer hover:border-zinc-400"}`}>
                          {todo.completed ? (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </button>
                        <span className={`flex-1 text-sm ${todo.completed ? "text-zinc-400 line-through" : "text-zinc-800 dark:text-zinc-200"}`}>
                          {todo.text}
                        </span>
                        {isMe && (
                          <button onClick={() => deleteTodo(todo.id)} className="text-xs text-zinc-300 hover:text-red-500">
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
            <h2 className="mb-4 text-center text-lg font-bold">{isToday ? "Today's" : selectedDate} Leaderboard</h2>
            <div className="space-y-3">
              {leaderboard.map((entry, i) => {
                const medal = i === 0 ? "1st" : "2nd";
                const isWinning = i === 0 && entry.xp > 0;
                return (
                  <div key={entry.id}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 ${isWinning ? "bg-amber-100 dark:bg-amber-900/40" : "bg-white/70 dark:bg-zinc-800/70"}`}>
                    <span className="text-2xl">{i === 0 ? (entry.xp > 0 ? "\u{1F451}" : "\u{1F3C1}") : "\u2B50"}</span>
                    <div className="flex-1">
                      <p className="font-semibold">
                        {entry.name}
                        {entry.id === currentUser.id && <span className="ml-1 text-xs font-normal text-zinc-400">(you)</span>}
                        {entry.streak > 0 && <span className="ml-2 text-sm">{"\uD83D\uDD25"}{entry.streak}</span>}
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
              <p className="mt-3 text-center text-sm text-zinc-500">It&apos;s a tie! Keep going!</p>
            )}
            {leaderboard.length >= 2 && leaderboard[0].xp > leaderboard[1].xp && (
              <p className="mt-3 text-center text-sm font-medium text-amber-600 dark:text-amber-400">{leaderboard[0].name} is in the lead!</p>
            )}
          </div>
        </>
      )}

      {activeTab === "stats" && (
        <>
          <div className="mb-6 flex justify-center gap-2">
            {(["week", "month", "6months"] as const).map((r) => (
              <button key={r} onClick={() => setChartRange(r)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${chartRange === r
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                {r === "week" ? "7 Days" : r === "month" ? "30 Days" : "6 Months"}
              </button>
            ))}
          </div>

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
                        return (
                          <div key={u.id} title={`${u.name}: ${val} tasks — ${row.date}`}
                            className={`min-w-0 rounded-t transition-all duration-300 ${u.name === "Ali" ? "bg-violet-500" : "bg-pink-500"}`}
                            style={{ height: Math.max(h, val > 0 ? 4 : 0), width: "45%" }} />
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
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-violet-500" /><span className="text-xs text-zinc-500">Ali</span></div>
              <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded-sm bg-pink-500" /><span className="text-xs text-zinc-500">Marwa</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
            <h3 className="mb-4 text-center text-lg font-bold">
              {chartRange === "week" ? "Weekly" : chartRange === "month" ? "Monthly" : "6-Month"} Summary
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {[...rangeTotals].sort((a, b) => b.xp - a.xp).map((entry, i) => {
                const pct = entry.total > 0 ? Math.round((entry.completed / entry.total) * 100) : 0;
                return (
                  <div key={entry.id}
                    className={`rounded-xl p-4 ${i === 0 && entry.xp > 0 ? "bg-amber-100 dark:bg-amber-900/40" : "bg-white/70 dark:bg-zinc-800/70"}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{i === 0 && entry.xp > 0 ? "\u{1F451}" : "\u2B50"}</span>
                        <span className="font-bold">{entry.name}</span>
                      </div>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{entry.xp} XP</span>
                    </div>
                    <div className="mb-1 flex justify-between text-xs text-zinc-500">
                      <span>{entry.completed}/{entry.total} tasks</span><span>{pct}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div className={`h-full rounded-full transition-all duration-500 ${entry.name === "Ali" ? "bg-violet-500" : "bg-pink-500"}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <p className="mt-4 text-center text-xs text-zinc-400">Live sync enabled</p>
    </div>
  );
}
