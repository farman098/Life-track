"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, CalendarDays, Check, CheckCircle2, ChevronDown, CircleHelp,
  ClipboardList, CreditCard, DollarSign, FileText, Heart, LayoutDashboard,
  ListChecks, LogOut, Menu, Plus, Search, Settings, ShoppingCart, Sparkles,
  Target, TrendingUp, Wallet, X, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { ApiError, apiRequest } from "@/lib/api";

type Task = { id: string; title: string; done: boolean; priority: "Low" | "Medium" | "High"; dueDate?: string };
type Expense = { id: string; title: string; category: string; date: string; amount: number };
type Bill = { id: string; title: string; amount: number; dueDate: string; paid: boolean; repeat: string };
type Appointment = { id: string; title: string; person: string; date: string; time: string; location: string; note: string };
type ShoppingItem = { id: string; name: string; quantity: string; purchased: boolean };
type Habit = { id: string; name: string; completedDates: string[] };
type User = { id: string; name: string; email: string };
type RecordData = Record<string, unknown> & { _id: string };
type Resource = "tasks" | "expenses" | "bills" | "appointments" | "shopping" | "habits";
type ModalName = Resource | null;
type NavItem = { label: string; icon: React.ElementType; group: string };

const navItems: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, group: "WORKSPACE" },
  { label: "My Tasks", icon: ListChecks, group: "WORKSPACE" },
  { label: "Budget & Expenses", icon: Wallet, group: "WORKSPACE" },
  { label: "Bill Reminders", icon: Bell, group: "LIFE PLANNER" },
  { label: "Appointments", icon: CalendarDays, group: "LIFE PLANNER" },
  { label: "Shopping List", icon: ShoppingCart, group: "LIFE PLANNER" },
  { label: "Habit Tracker", icon: Target, group: "LIFE PLANNER" },
  { label: "Monthly Reports", icon: FileText, group: "INSIGHTS" },
];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const money = (amount: number) => `Rs. ${amount.toLocaleString("en-PK")}`;
const text = (value: unknown, fallback = "") => typeof value === "string" ? value : fallback;
const number = (value: unknown) => typeof value === "number" ? value : Number(value) || 0;
const idOf = (record: RecordData) => record._id;
const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "No due date";

function toTask(record: RecordData): Task {
  return { id: idOf(record), title: text(record.title), done: record.completed === true, priority: record.priority === "Low" || record.priority === "High" ? record.priority : "Medium", dueDate: text(record.dueDate) };
}
function toExpense(record: RecordData): Expense {
  return { id: idOf(record), title: text(record.title), category: text(record.category, "Other"), date: text(record.date) ? dateLabel(text(record.date)) : "Today", amount: number(record.amount) };
}
function toBill(record: RecordData): Bill {
  return { id: idOf(record), title: text(record.title), amount: number(record.amount), dueDate: text(record.dueDate), paid: record.paid === true, repeat: text(record.repeat, "None") };
}
function toAppointment(record: RecordData): Appointment {
  return { id: idOf(record), title: text(record.title), person: text(record.person), date: text(record.date), time: text(record.time), location: text(record.location), note: text(record.note) };
}
function toShoppingItem(record: RecordData): ShoppingItem {
  return { id: idOf(record), name: text(record.name), quantity: text(record.quantity, "1"), purchased: record.purchased === true };
}
function toHabit(record: RecordData): Habit {
  return { id: idOf(record), name: text(record.name), completedDates: Array.isArray(record.completedDates) ? record.completedDates.filter((date): date is string => typeof date === "string") : [] };
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[#EAECF2] bg-white shadow-soft ${className}`}>{children}</section>;
}
function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>{action}</div>;
}
function Badge({ children, tone = "purple" }: { children: React.ReactNode; tone?: "purple" | "green" | "orange" | "blue" | "gray" }) {
  const styles = { purple: "bg-brand-soft text-brand", green: "bg-emerald-50 text-emerald-700", orange: "bg-orange-50 text-orange-700", blue: "bg-blue-50 text-blue-700", gray: "bg-gray-100 text-gray-600" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}>{children}</span>;
}
function EmptyState({ title, message }: { title: string; message: string }) {
  return <div className="py-12 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand"><ClipboardList size={22}/></div><p className="mt-3 text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted">{message}</p></div>;
}
function StatCard({ title, value, detail, icon: Icon, color }: { title: string; value: string; detail: string; icon: React.ElementType; color: string }) {
  const colors: Record<string, string> = { purple: "bg-brand-soft text-brand", orange: "bg-orange-50 text-orange-600", blue: "bg-blue-50 text-blue-600", green: "bg-emerald-50 text-emerald-600" };
  return <Card className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-medium text-muted">{title}</p><p className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{value}</p><p className="mt-1 text-[10px] text-muted">{detail}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors[color]}`}><Icon size={19}/></div></div><p className="mt-4 flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><TrendingUp size={12}/>Synced with your account</p></Card>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#101323]/45 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h3 className="font-bold">{title}</h3><button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 text-muted hover:bg-gray-100"><X size={18}/></button></div>{children}</div></div>;
}

export default function HomePage() {
  const [active, setActive] = useState("Overview");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [shopping, setShopping] = useState<ShoppingItem[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});

  const signOut = useCallback(() => {
    window.localStorage.removeItem("lifetrack-token");
    window.localStorage.removeItem("lifetrack-user");
    setToken("");
    setUser(null);
    setTasks([]);
    setExpenses([]);
    setBills([]);
    setAppointments([]);
    setShopping([]);
    setHabits([]);
  }, []);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("lifetrack-token");
    const storedUser = window.localStorage.getItem("lifetrack-user");
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      try {
        const parsed: unknown = JSON.parse(storedUser);
        if (typeof parsed === "object" && parsed !== null && "name" in parsed && typeof parsed.name === "string" && "email" in parsed && typeof parsed.email === "string" && "id" in parsed && typeof parsed.id === "string") {
          setUser({ id: parsed.id, name: parsed.name, email: parsed.email });
        }
      } catch {
        window.localStorage.removeItem("lifetrack-user");
      }
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!token || !authReady) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([
      apiRequest<RecordData[]>("tasks", token),
      apiRequest<RecordData[]>("expenses", token),
      apiRequest<RecordData[]>("bills", token),
      apiRequest<RecordData[]>("appointments", token),
      apiRequest<RecordData[]>("shopping", token),
      apiRequest<RecordData[]>("habits", token),
    ]).then(([taskRecords, expenseRecords, billRecords, appointmentRecords, shoppingRecords, habitRecords]) => {
      if (cancelled) return;
      setTasks(taskRecords.map(toTask));
      setExpenses(expenseRecords.map(toExpense));
      setBills(billRecords.map(toBill));
      setAppointments(appointmentRecords.map(toAppointment));
      setShopping(shoppingRecords.map(toShoppingItem));
      setHabits(habitRecords.map(toHabit));
    }).catch((cause: unknown) => {
      if (cancelled) return;
      const message = cause instanceof Error ? cause.message : "Could not load your data.";
      setError(message);
      if (cause instanceof ApiError && cause.status === 401) signOut();
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [token, authReady, signOut]);

  const completed = tasks.filter(task => task.done).length;
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const filteredTasks = useMemo(() => tasks.filter(task => task.title.toLowerCase().includes(search.toLowerCase())), [tasks, search]);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const path = authMode === "register" ? "auth/register" : "auth/login";
      const body = authMode === "register"
        ? { name: authName.trim(), email: authEmail.trim(), password: authPassword }
        : { email: authEmail.trim(), password: authPassword };
      const result = await apiRequest<{ token: string; user: User }>(path, undefined, { method: "POST", body: JSON.stringify(body) });
      window.localStorage.setItem("lifetrack-token", result.token);
      window.localStorage.setItem("lifetrack-user", JSON.stringify(result.user));
      setUser(result.user);
      setToken(result.token);
      setAuthPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setSaving(false);
    }
  }

  async function mutate<T>(path: string, method: "POST" | "PATCH" | "DELETE", body: unknown, update: (result: T) => void) {
    if (!token) return;
    setSaving(true);
    setError("");
    try {
      const result = await apiRequest<T>(path, token, { method, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      update(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The change could not be saved.");
      if (cause instanceof ApiError && cause.status === 401) signOut();
    } finally {
      setSaving(false);
    }
  }

  async function createRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal) return;
    const values: Record<string, unknown> = { ...form };
    if (modal === "tasks") {
      values.title = text(form.title).trim();
      values.priority = form.priority || "Medium";
      delete values.dueDateIfEmpty;
      if (!values.dueDate) delete values.dueDate;
    } else if (modal === "expenses") {
      values.title = text(form.title).trim();
      values.amount = Number(form.amount);
      values.category = form.category || "Other";
    } else if (modal === "bills") {
      values.title = text(form.title).trim();
      values.amount = Number(form.amount || "0");
      values.dueDate = form.dueDate;
      values.repeat = form.repeat || "None";
    } else if (modal === "appointments") {
      values.title = text(form.title).trim();
      values.person = form.person || "";
      values.date = form.date;
      values.time = form.time || "";
      values.location = form.location || "";
    } else if (modal === "shopping") {
      values.name = text(form.name).trim();
      values.quantity = form.quantity || "1";
    } else {
      values.name = text(form.name).trim();
    }
    const resource = modal;
    await mutate<RecordData>(resource, "POST", values, record => {
      if (resource === "tasks") setTasks(current => [toTask(record), ...current]);
      if (resource === "expenses") setExpenses(current => [toExpense(record), ...current]);
      if (resource === "bills") setBills(current => [toBill(record), ...current]);
      if (resource === "appointments") setAppointments(current => [toAppointment(record), ...current]);
      if (resource === "shopping") setShopping(current => [toShoppingItem(record), ...current]);
      if (resource === "habits") setHabits(current => [toHabit(record), ...current]);
      setModal(null);
      setForm({});
    });
  }

  function updateTask(task: Task) {
    void mutate<RecordData>(`tasks/${task.id}`, "PATCH", { completed: !task.done }, record => {
      const updated = toTask(record);
      setTasks(current => current.map(item => item.id === task.id ? updated : item));
    });
  }
  function updateBill(bill: Bill) {
    void mutate<RecordData>(`bills/${bill.id}`, "PATCH", { paid: !bill.paid }, record => {
      const updated = toBill(record);
      setBills(current => current.map(item => item.id === bill.id ? updated : item));
    });
  }
  function updateShopping(item: ShoppingItem) {
    void mutate<RecordData>(`shopping/${item.id}`, "PATCH", { purchased: !item.purchased }, record => {
      const updated = toShoppingItem(record);
      setShopping(current => current.map(currentItem => currentItem.id === item.id ? updated : currentItem));
    });
  }
  function updateHabit(habit: Habit) {
    const completedDates = habit.completedDates.includes(today())
      ? habit.completedDates.filter(date => date !== today())
      : [...habit.completedDates, today()];
    void mutate<RecordData>(`habits/${habit.id}`, "PATCH", { completedDates }, record => {
      const updated = toHabit(record);
      setHabits(current => current.map(item => item.id === habit.id ? updated : item));
    });
  }
  function removeRecord(resource: Resource, id: string) {
    void mutate<{ message: string }>(`${resource}/${id}`, "DELETE", undefined, () => {
      if (resource === "tasks") setTasks(current => current.filter(item => item.id !== id));
      if (resource === "expenses") setExpenses(current => current.filter(item => item.id !== id));
      if (resource === "bills") setBills(current => current.filter(item => item.id !== id));
      if (resource === "appointments") setAppointments(current => current.filter(item => item.id !== id));
      if (resource === "shopping") setShopping(current => current.filter(item => item.id !== id));
      if (resource === "habits") setHabits(current => current.filter(item => item.id !== id));
    });
  }
  function openForm(resource: Resource) {
    setForm({});
    setModal(resource);
    setError("");
  }

  if (!authReady) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading LifeTrack…</div>;
  if (!token) return <AuthPage mode={authMode} setMode={setAuthMode} name={authName} setName={setAuthName} email={authEmail} setEmail={setAuthEmail} password={authPassword} setPassword={setAuthPassword} onSubmit={authenticate} saving={saving} error={error}/>;

  const sidebar = <div className="flex h-full flex-col">
    <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand"><Activity size={22} strokeWidth={2.7}/></div>
      <div><div className="text-lg font-extrabold tracking-tight text-white">LifeTrack</div><div className="text-[10px] font-semibold uppercase tracking-[.2em] text-indigo-200/70">Personal planner</div></div>
      <button className="ml-auto text-white/70 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={20}/></button>
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-6">{["WORKSPACE", "LIFE PLANNER", "INSIGHTS"].map(group => <div key={group} className="mb-6">
      <p className="mb-2 px-3 text-[10px] font-bold tracking-[.18em] text-indigo-200/45">{group}</p>
      {navItems.filter(item => item.group === group).map(item => { const Icon = item.icon; const selected = active === item.label; return <button key={item.label} onClick={() => { setActive(item.label); setMobileOpen(false); }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[13px] font-medium transition ${selected ? "bg-white text-[#4F46B9] shadow-lg shadow-black/10" : "text-indigo-100/75 hover:bg-white/10 hover:text-white"}`}><Icon size={17}/><span>{item.label}</span>{item.label === "My Tasks" && <span className="ml-auto rounded-md bg-white/10 px-2 py-0.5 text-[10px]">{tasks.filter(task => !task.done).length}</span>}</button>; })}
    </div>)}</div>
    <div className="p-4"><div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-2 flex items-center gap-2 text-white"><Sparkles size={16} className="text-amber-300"/><span className="text-xs font-semibold">Small steps matter</span></div><p className="text-[11px] leading-5 text-indigo-100/60">Your records are saved to your LifeTrack account.</p></div>
      <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-indigo-100/65 hover:bg-white/10"><Settings size={16}/> Settings <span className="ml-auto"><ChevronDown size={14}/></span></button>
      <div className="mt-3 flex items-center gap-3 border-t border-white/10 pt-4"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8DFFF] text-xs font-bold text-[#5548B8]">{(user?.name || "U").slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-white">{user?.name || user?.email || "LifeTrack user"}</p><p className="text-[10px] text-indigo-100/50">{user?.email}</p></div><button title="Log out" onClick={signOut} className="text-indigo-100/50 hover:text-white"><LogOut size={16}/></button></div>
    </div>
  </div>;

  return <div className="min-h-screen bg-canvas">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[258px] bg-[#17172F] lg:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)}/><aside className="relative h-full w-[285px] bg-[#17172F]">{sidebar}</aside></div>}
    <main className="min-h-screen lg:pl-[258px]">
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#EAECF2] bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-9">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-ink hover:bg-gray-100 lg:hidden" aria-label="Open menu"><Menu size={20}/></button><div><p className="text-[11px] font-medium text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p><h1 className="text-base font-bold text-ink sm:text-lg">{active === "Overview" ? `Welcome, ${user?.name || "there"}` : active}</h1></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 rounded-xl border border-[#EAECF2] bg-[#FAFAFC] px-3 py-2 md:flex"><Search size={15} className="text-muted"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tasks..." className="w-32 bg-transparent text-xs outline-none placeholder:text-[#A3A8B5]"/></div><span className="hidden text-xs text-muted sm:inline">{user?.email}</span><button onClick={signOut} className="rounded-xl border border-[#EAECF2] p-2.5 text-muted hover:bg-gray-50" title="Log out"><LogOut size={17}/></button></div>
      </header>
      <div className="mx-auto max-w-[1500px] px-4 py-7 sm:px-7 lg:px-9 lg:py-9">
        {error && <div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
        {loading ? <Card className="p-8 text-center text-sm text-muted">Loading your account data…</Card> : <>
          {active === "Overview" && <Overview tasks={tasks} completed={completed} totalSpent={totalSpent} bills={bills} habits={habits} expenses={expenses} onToggle={updateTask} onAddTask={() => openForm("tasks")} onNavigate={setActive}/>}
          {active === "My Tasks" && <TasksPage tasks={filteredTasks} onToggle={updateTask} onAdd={() => openForm("tasks")} onDelete={id => removeRecord("tasks", id)} search={search} setSearch={setSearch}/>}
          {active === "Budget & Expenses" && <BudgetPage expenses={expenses} totalSpent={totalSpent} onAdd={() => openForm("expenses")} onDelete={id => removeRecord("expenses", id)}/>}
          {active === "Bill Reminders" && <RemindersPage bills={bills} onAdd={() => openForm("bills")} onToggle={updateBill} onDelete={id => removeRecord("bills", id)}/>}
          {active === "Appointments" && <AppointmentsPage appointments={appointments} onAdd={() => openForm("appointments")} onDelete={id => removeRecord("appointments", id)}/>}
          {active === "Shopping List" && <ShoppingPage items={shopping} onAdd={() => openForm("shopping")} onToggle={updateShopping} onDelete={id => removeRecord("shopping", id)}/>}
          {active === "Habit Tracker" && <HabitsPage habits={habits} onAdd={() => openForm("habits")} onToggle={updateHabit} onDelete={id => removeRecord("habits", id)}/>}
          {active === "Monthly Reports" && <ReportsPage expenses={expenses} totalSpent={totalSpent} completed={completed} taskCount={tasks.length}/>}
        </>}
        {modal && <RecordModal modal={modal} form={form} setForm={setForm} onClose={() => setModal(null)} onSubmit={createRecord} saving={saving} error={error}/>}
      </div>
    </main>
  </div>;
}

function AuthPage({ mode, setMode, name, setName, email, setEmail, password, setPassword, onSubmit, saving, error }: {
  mode: "login" | "register"; setMode: (mode: "login" | "register") => void;
  name: string; setName: (value: string) => void; email: string; setEmail: (value: string) => void;
  password: string; setPassword: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean; error: string;
}) {
  return <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10"><Card className="w-full max-w-md p-7 sm:p-9">
    <div className="mb-7 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white"><Activity size={23}/></div><div><h1 className="text-xl font-extrabold">LifeTrack</h1><p className="text-xs text-muted">Your life, in balance</p></div></div>
    <h2 className="text-2xl font-bold">{mode === "login" ? "Welcome back" : "Create your account"}</h2><p className="mt-1 text-sm text-muted">{mode === "login" ? "Sign in to load your saved planner data." : "Your planner data will be saved to your account."}</p>
    {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    <form onSubmit={onSubmit} className="mt-6 space-y-4">{mode === "register" && <label className="block text-xs font-semibold">Name<input required autoComplete="name" value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand"/></label>}<label className="block text-xs font-semibold">Email<input required type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand"/></label><label className="block text-xs font-semibold">Password<input required minLength={mode === "register" ? 8 : undefined} type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand"/></label><button disabled={saving} className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-[#5548C2] disabled:opacity-60">{saving ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button></form>
    <p className="mt-5 text-center text-sm text-muted">{mode === "login" ? "New to LifeTrack?" : "Already have an account?"} <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="font-semibold text-brand">{mode === "login" ? "Create an account" : "Sign in"}</button></p>
  </Card></main>;
}

function RecordModal({ modal, form, setForm, onClose, onSubmit, saving, error }: { modal: Resource; form: Record<string, string>; setForm: (form: Record<string, string>) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; saving: boolean; error: string }) {
  const set = (key: string, value: string) => setForm({ ...form, [key]: value });
  const field = (label: string, key: string, options: { type?: string; required?: boolean; min?: string; placeholder?: string } = {}) => <label key={key} className="block text-xs font-semibold text-ink">{label}<input type={options.type || "text"} required={options.required} min={options.min} placeholder={options.placeholder} value={form[key] || ""} onChange={event => set(key, event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-brand"/></label>;
  let title = "Add record";
  let fields: React.ReactNode[] = [];
  if (modal === "tasks") { title = "Add a task"; fields = [field("Task name", "title", { required: true }), field("Due date", "dueDate", { type: "date" }), <label key="priority" className="block text-xs font-semibold text-ink">Priority<select value={form.priority || "Medium"} onChange={event => set("priority", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"><option>Low</option><option>Medium</option><option>High</option></select></label>]; }
  if (modal === "expenses") { title = "Add an expense"; fields = [field("Expense name", "title", { required: true }), field("Amount (PKR)", "amount", { type: "number", min: "0.01", required: true }), field("Category", "category", { placeholder: "Other" })]; }
  if (modal === "bills") { title = "Add a bill"; fields = [field("Bill name", "title", { required: true }), field("Amount (PKR)", "amount", { type: "number", min: "0", required: true }), field("Due date", "dueDate", { type: "date", required: true }), <label key="repeat" className="block text-xs font-semibold text-ink">Repeat<select value={form.repeat || "None"} onChange={event => set("repeat", event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm"><option>None</option><option>Weekly</option><option>Monthly</option><option>Yearly</option></select></label>]; }
  if (modal === "appointments") { title = "Add an appointment"; fields = [field("Appointment name", "title", { required: true }), field("Person", "person"), field("Date", "date", { type: "date", required: true }), field("Time", "time", { type: "time" }), field("Location", "location")]; }
  if (modal === "shopping") { title = "Add a shopping item"; fields = [field("Item name", "name", { required: true }), field("Quantity", "quantity", { placeholder: "1" })]; }
  if (modal === "habits") { title = "Add a habit"; fields = [field("Habit name", "name", { required: true })]; }
  return <Modal title={title} onClose={onClose}><form onSubmit={onSubmit} className="space-y-4">{error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</div>}{fields}<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted hover:bg-gray-100">Cancel</button><button disabled={saving} className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white disabled:opacity-60">{saving ? "Saving…" : "Save"}</button></div></form></Modal>;
}

function Overview({ tasks, completed, totalSpent, bills, habits, expenses, onToggle, onAddTask, onNavigate }: { tasks: Task[]; completed: number; totalSpent: number; bills: Bill[]; habits: Habit[]; expenses: Expense[]; onToggle: (task: Task) => void; onAddTask: () => void; onNavigate: (section: string) => void }) {
  const upcomingBills = bills.filter(bill => !bill.paid).slice(0, 3);
  const chartData = expenses.slice(0, 7).reverse().map((expense, index) => ({ day: dateLabel(expense.date).split(",")[0] || `#${index + 1}`, amount: expense.amount }));
  const todayCount = habits.filter(habit => habit.completedDates.includes(today())).length;
  return <div className="space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted">Here&apos;s what&apos;s happening with your day.</p><p className="mt-1 text-xs text-muted">Your planner is connected to your account.</p></div><button onClick={onAddTask} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-brand/20"><Plus size={16}/> Add new task</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard title="Tasks completed" value={`${completed}/${tasks.length}`} detail="Your task progress" icon={CheckCircle2} color="purple"/><StatCard title="Total spending" value={money(totalSpent)} detail="Recorded expenses" icon={Wallet} color="orange"/><StatCard title="Unpaid bills" value={`${bills.filter(bill => !bill.paid).length}`} detail="Upcoming payments" icon={CreditCard} color="blue"/><StatCard title="Habits today" value={`${todayCount}/${habits.length}`} detail="Daily check-ins" icon={Heart} color="green"/></div>
    <div className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
      <Card className="p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-ink">Recent expenses</h3><p className="mt-1 text-xs text-muted">Your saved transactions</p></div><button onClick={() => onNavigate("Budget & Expenses")} className="text-xs font-semibold text-brand hover:underline">View details</button></div>
        {chartData.length ? <div className="h-[230px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8175E8" stopOpacity={0.25}/><stop offset="100%" stopColor="#8175E8" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid stroke="#F0F1F5" vertical={false}/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#9AA1B1", fontSize: 11 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#9AA1B1", fontSize: 10 }}/><Tooltip formatter={(value) => money(Number(value))}/><Area type="monotone" dataKey="amount" stroke="#6558D3" fill="url(#spendFill)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div> : <EmptyState title="No expenses yet" message="Add an expense to see your spending chart."/>}
      </Card>
      <Card className="p-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-bold">Today&apos;s tasks</h3><Badge>{tasks.filter(task => !task.done).length} left</Badge></div>{tasks.slice(0, 5).map(task => <TaskRow key={task.id} task={task} onToggle={onToggle}/>)}{!tasks.length && <EmptyState title="No tasks yet" message="Add a task to plan your day."/>}</Card>
    </div>
    <Card className="p-5"><div className="mb-4 flex items-center justify-between"><div><h3 className="font-bold">Upcoming bills</h3><p className="mt-1 text-xs text-muted">Your unpaid reminders</p></div><button onClick={() => onNavigate("Bill Reminders")} className="text-xs font-semibold text-brand hover:underline">View bills</button></div>{upcomingBills.length ? <div className="grid gap-3 sm:grid-cols-3">{upcomingBills.map(bill => <div key={bill.id} className="rounded-xl border border-gray-100 p-4"><p className="text-xs font-semibold">{bill.title}</p><p className="mt-1 text-[11px] text-muted">{dateLabel(bill.dueDate)}</p><p className="mt-3 font-bold">{money(bill.amount)}</p></div>)}</div> : <p className="text-xs text-muted">No unpaid bills.</p>}</Card>
  </div>;
}

function TaskRow({ task, onToggle, onDelete }: { task: Task; onToggle: (task: Task) => void; onDelete?: () => void }) {
  return <div className="flex items-center gap-3 rounded-xl px-2 py-3 hover:bg-gray-50"><button onClick={() => onToggle(task)} aria-label={task.done ? "Mark incomplete" : "Mark complete"} className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition ${task.done ? "border-brand bg-brand text-white" : "border-gray-300 bg-white hover:border-brand"}`}>{task.done && <Check size={12}/>}</button><div className="min-w-0 flex-1"><p className={`truncate text-xs font-semibold ${task.done ? "text-muted line-through" : "text-ink"}`}>{task.title}</p><p className="mt-1 text-[10px] text-muted">{task.dueDate ? dateLabel(task.dueDate) : "No due date"}</p></div><Badge tone={task.priority === "High" ? "orange" : task.priority === "Low" ? "gray" : "blue"}>{task.priority}</Badge>{onDelete && <button onClick={onDelete} aria-label="Delete task" className="text-muted hover:text-rose-500"><X size={15}/></button>}</div>;
}
function TasksPage({ tasks, onToggle, onAdd, onDelete, search, setSearch }: { tasks: Task[]; onToggle: (task: Task) => void; onAdd: () => void; onDelete: (id: string) => void; search: string; setSearch: (value: string) => void }) {
  return <><SectionTitle title="My Tasks" subtitle="Plan your day and keep moving forward." action={<button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15}/> Add task</button>}/><Card className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2"><Search size={15} className="text-muted"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search tasks..." className="w-48 text-xs outline-none"/></div><Badge>{tasks.filter(task => !task.done).length} remaining</Badge></div>{tasks.length ? tasks.map(task => <TaskRow key={task.id} task={task} onToggle={onToggle} onDelete={() => onDelete(task.id)}/>) : <EmptyState title="No tasks found" message="Add a task or try another search."/>}</Card></>;
}
function BudgetPage({ expenses, totalSpent, onAdd, onDelete }: { expenses: Expense[]; totalSpent: number; onAdd: () => void; onDelete: (id: string) => void }) {
  return <><SectionTitle title="Budget & Expenses" subtitle="Understand your spending and stay in control." action={<button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15}/> Add expense</button>}/><div className="mb-5 grid gap-4 sm:grid-cols-3"><StatCard title="Total expenses" value={money(totalSpent)} detail="Recorded in your account" icon={Wallet} color="purple"/><StatCard title="Monthly budget" value="Rs. 50,000" detail="Planning reference" icon={Target} color="blue"/><StatCard title="Remaining budget" value={money(Math.max(0, 50000 - totalSpent))} detail="Based on planned limit" icon={DollarSign} color="green"/></div><Card className="overflow-hidden"><div className="border-b border-gray-100 p-5"><h3 className="font-bold">Recent transactions</h3><p className="mt-1 text-xs text-muted">Your saved expenses</p></div><div className="divide-y divide-gray-100">{expenses.map(expense => <div key={expense.id} className="flex items-center gap-3 px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><CreditCard size={17}/></div><div className="flex-1"><p className="text-xs font-semibold">{expense.title}</p><p className="mt-1 text-[10px] text-muted">{expense.category} · {expense.date}</p></div><span className="text-sm font-bold text-ink">-{money(expense.amount)}</span><button onClick={() => onDelete(expense.id)} aria-label="Delete expense" className="text-muted hover:text-rose-500"><X size={15}/></button></div>)}</div>{!expenses.length && <EmptyState title="No expenses yet" message="Add your first expense to get started."/>}</Card></>;
}
function RemindersPage({ bills, onAdd, onToggle, onDelete }: { bills: Bill[]; onAdd: () => void; onToggle: (bill: Bill) => void; onDelete: (id: string) => void }) {
  return <><SectionTitle title="Bill Reminders" subtitle="Keep track of recurring payments and due dates." action={<button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15}/> Add bill</button>}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{bills.map(bill => <Card key={bill.id} className="p-5"><div className="flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand"><Zap size={19}/></div><Badge tone={bill.paid ? "green" : "orange"}>{bill.paid ? "Paid" : bill.repeat === "None" ? "Unpaid" : bill.repeat}</Badge></div><h3 className="mt-4 font-bold">{bill.title}</h3><p className="mt-1 text-xs text-muted">Due {dateLabel(bill.dueDate)}</p><p className="mt-5 text-xl font-extrabold">{money(bill.amount)}</p><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"><button onClick={() => onToggle(bill)} className="text-xs font-semibold text-brand">{bill.paid ? "Mark unpaid" : "Mark paid"}</button><button onClick={() => onDelete(bill.id)} aria-label="Delete bill" className="text-muted hover:text-rose-500"><X size={15}/></button></div></Card>)}</div>{!bills.length && <Card><EmptyState title="No bills yet" message="Add a bill to create your first reminder."/></Card>}</>;
}
function AppointmentsPage({ appointments, onAdd, onDelete }: { appointments: Appointment[]; onAdd: () => void; onDelete: (id: string) => void }) {
  return <><SectionTitle title="Appointments" subtitle="All your upcoming appointments in one place." action={<button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15}/> Add appointment</button>}/><Card className="divide-y divide-gray-100">{appointments.map(appointment => <div key={appointment.id} className="flex flex-wrap items-center gap-4 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand"><CalendarDays size={20}/></div><div className="min-w-0 flex-1"><p className="text-sm font-bold">{appointment.title}</p><p className="mt-1 text-xs text-muted">{appointment.person}{appointment.location ? ` · ${appointment.location}` : ""}</p></div><div className="text-right"><p className="text-xs font-semibold">{dateLabel(appointment.date)}</p><p className="mt-1 text-[11px] text-muted">{appointment.time || "Time not set"}</p></div><button onClick={() => onDelete(appointment.id)} aria-label="Delete appointment" className="text-muted hover:text-rose-500"><X size={15}/></button></div>)}</Card>{!appointments.length && <Card className="mt-4"><EmptyState title="No appointments yet" message="Add an appointment to keep it on your planner."/></Card>}</>;
}
function ShoppingPage({ items, onAdd, onToggle, onDelete }: { items: ShoppingItem[]; onAdd: () => void; onToggle: (item: ShoppingItem) => void; onDelete: (id: string) => void }) {
  return <><SectionTitle title="Shopping List" subtitle="Keep your essentials organized before heading out." action={<button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15}/> Add item</button>}/><Card className="max-w-3xl p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><p className="text-xs font-semibold text-ink">Your shopping items</p><Badge tone="green">{items.filter(item => item.purchased).length} / {items.length} done</Badge></div><div className="space-y-2">{items.map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50"><input type="checkbox" checked={item.purchased} onChange={() => onToggle(item)} aria-label={`Mark ${item.name} purchased`} className="h-4 w-4 accent-[#6558D3]"/><span className={`flex-1 text-xs font-medium ${item.purchased ? "text-muted line-through" : "text-ink"}`}>{item.name} <span className="text-muted">× {item.quantity}</span></span>{item.purchased && <CheckCircle2 size={16} className="text-emerald-500"/>}<button onClick={() => onDelete(item.id)} aria-label="Delete shopping item" className="text-muted hover:text-rose-500"><X size={15}/></button></div>)}</div>{!items.length && <EmptyState title="Your list is empty" message="Add the things you need to buy."/>}</Card></>;
}
function HabitsPage({ habits, onAdd, onToggle, onDelete }: { habits: Habit[]; onAdd: () => void; onToggle: (habit: Habit) => void; onDelete: (id: string) => void }) {
  const doneCount = habits.filter(habit => habit.completedDates.includes(today())).length;
  return <><SectionTitle title="Habit Tracker" subtitle="Build small routines that make a big difference." action={<button onClick={onAdd} className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white"><Plus size={15}/> Add habit</button>}/><div className="mb-5 grid gap-4 sm:grid-cols-3"><StatCard title="Current habits" value={`${habits.length}`} detail="Routines you're building" icon={Target} color="purple"/><StatCard title="Completed today" value={`${doneCount}`} detail="Daily check-ins" icon={CheckCircle2} color="green"/><StatCard title="Completion rate" value={habits.length ? `${Math.round(doneCount / habits.length * 100)}%` : "0%"} detail="For today" icon={Activity} color="orange"/></div><Card className="max-w-3xl p-5"><h3 className="mb-4 font-bold">Your daily habits</h3>{habits.map(habit => { const done = habit.completedDates.includes(today()); return <div key={habit.id} className="flex items-center gap-3 border-b border-gray-100 py-4 last:border-0"><button onClick={() => onToggle(habit)} aria-label={done ? "Mark habit incomplete" : "Mark habit complete"} className={`flex h-8 w-8 items-center justify-center rounded-xl ${done ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-400"}`}>{done ? <Check size={17}/> : <CircleHelp size={17}/>}</button><div className="flex-1"><p className="text-xs font-semibold">{habit.name}</p><p className="mt-1 text-[10px] text-muted">{habit.completedDates.length} completed check-ins</p></div><Badge tone={done ? "green" : "gray"}>{done ? "Done today" : "Not completed"}</Badge><button onClick={() => onDelete(habit.id)} aria-label="Delete habit" className="text-muted hover:text-rose-500"><X size={15}/></button></div>; })}{!habits.length && <EmptyState title="No habits yet" message="Add a habit to start tracking your routine."/ >}</Card></>;
}
function ReportsPage({ expenses, totalSpent, completed, taskCount }: { expenses: Expense[]; totalSpent: number; completed: number; taskCount: number }) {
  const categories = expenses.reduce<Record<string, number>>((totals, expense) => ({ ...totals, [expense.category]: (totals[expense.category] || 0) + expense.amount }), {});
  return <><SectionTitle title="Monthly Reports" subtitle="A snapshot of your personal progress."/><div className="grid gap-4 sm:grid-cols-3"><StatCard title="Total spending" value={money(totalSpent)} detail="Recorded expenses" icon={Wallet} color="purple"/><StatCard title="Tasks completed" value={`${completed}/${taskCount}`} detail="Your productivity" icon={ClipboardList} color="green"/><StatCard title="Categories" value={`${Object.keys(categories).length}`} detail="Expense categories" icon={Target} color="blue"/></div><Card className="mt-5 p-5"><h3 className="font-bold">Expense breakdown</h3><p className="mt-1 text-xs text-muted">Your recorded transactions by category</p><div className="mt-4 space-y-4">{Object.entries(categories).map(([category, amount]) => <div key={category} className="flex items-center justify-between"><p className="text-xs font-semibold">{category}</p><p className="text-xs font-bold">{money(amount)}</p></div>)}</div>{!expenses.length && <EmptyState title="No report data yet" message="Add expenses to see your breakdown."/>}</Card></>;
}
