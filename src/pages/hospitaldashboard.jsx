import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar as CalendarIcon, Bell, Activity, Loader2, Search as SearchIcon,
  ArrowUpRight, ArrowDownRight, Truck, PlusCircle, CheckCircle2, XCircle,
  Sun, Moon, Sparkles, Download, SlidersHorizontal, Eye, EyeOff,
  Filter, RefreshCcw, Bookmark, X, ChevronDown, ChevronUp
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, PieChart, Pie, Cell
} from "recharts";

/* ============================ Seed / Constants ============================ */
const INITIAL_PATIENTS = [
  { id: 1, name: "Abi", age: 29, admitted: "2025-09-20", dept: "General" },
  { id: 2, name: "Jane Smith", age: 34, admitted: "2025-09-21", dept: "Cardiology" },
  { id: 3, name: "Mark Wilson", age: 41, admitted: "2025-09-22", dept: "Neurology" },
  { id: 4, name: "Alice Johnson", age: 37, admitted: "2025-09-23", dept: "Orthopedics" },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, doctor: "Dr. Sharma", patient: "Abi", time: "10:00 AM", dept: "General" },
  { id: 2, doctor: "Dr. Verma", patient: "Jane Smith", time: "11:30 AM", dept: "Cardiology" },
  { id: 3, doctor: "Dr. Rao", patient: "Mark Wilson", time: "01:00 PM", dept: "Neurology" },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: "New patient admitted: Alice Johnson", type: "success" },
  { id: 2, text: "Critical case in Cardiology!", type: "alert" },
  { id: 3, text: "Appointment rescheduled: Abi", type: "info" },
];

const INITIAL_AMBULANCES = [
  { id: 1, driver: "Ramesh", status: "idle", assignedTo: null },
  { id: 2, driver: "Sita", status: "on trip", assignedTo: "Jane Smith" },
  { id: 3, driver: "Kumar", status: "idle", assignedTo: null },
];

const PIE_DATA = [
  { name: "General", value: 45 },
  { name: "Cardiology", value: 25 },
  { name: "Neurology", value: 15 },
  { name: "Orthopedics", value: 15 },
];

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7"];

const LS = {
  UI: "hospdash_ui_prefs_v3",
  RANGE: "hospdash_time_range_v1",
  SEARCH: "hospdash_search_v1",
  VIEW: "hospdash_saved_views_v1",
  DEPTS: "hospdash_dept_filters_v1",
};

/* ================================ Helpers ================================ */
const useDebounced = (value, ms = 300) => {
  const [deb, setDeb] = useState(value);
  useEffect(() => { const t = setTimeout(() => setDeb(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return deb;
};

const exportCSV = (rows, filename = "export.csv") => {
  if (!rows?.length) return;
  const header = Object.keys(rows[0]);
  const csv = [header.join(","), ...rows.map(r => header.map(h => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200/70 dark:bg-zinc-800 rounded ${className}`} />
);

const useTheme = (initial = "auto") => {
  const [mode, setMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.UI))?.theme ?? initial; } catch { return initial; }
  });
  useEffect(() => {
    const prefers = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = mode === "dark" || (mode === "auto" && prefers);
    document.documentElement.classList.toggle("dark", isDark);
    const cached = JSON.parse(localStorage.getItem(LS.UI) || "{}");
    localStorage.setItem(LS.UI, JSON.stringify({ ...cached, theme: mode }));
  }, [mode]);
  return [mode, setMode];
};

const useDensity = (initial = "comfortable") => {
  const [density, setDensity] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.UI))?.density ?? initial; } catch { return initial; }
  });
  useEffect(() => {
    const cached = JSON.parse(localStorage.getItem(LS.UI) || "{}");
    localStorage.setItem(LS.UI, JSON.stringify({ ...cached, density }));
  }, [density]);
  return [density, setDensity];
};

const chipCls = (active) =>
  `inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs sm:text-sm transition 
   ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`;

/* ============================== Main Page =============================== */
export default function HospitalDashboard() {
  const { lang } = useContext(LanguageContext) || { lang: "en" };

  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);

  const [search, setSearch] = useState(() => localStorage.getItem(LS.SEARCH) || "");
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem(LS.RANGE) || "week");
  const [theme, setTheme] = useTheme("auto");
  const [density, setDensity] = useDensity("comfortable");
  const [showPieLegend, setShowPieLegend] = useState(true);

  const [deptFilters, setDeptFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.DEPTS)) || []; } catch { return []; }
  });
  const [savedViews, setSavedViews] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.VIEW)) || []; } catch { return []; }
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);

  const debouncedSearch = useDebounced(search, 250);

  /* ---------- Data series ---------- */
  const dailyData = useMemo(() => ([
    { date: "08:00", patients: 5 },
    { date: "12:00", patients: 10 },
    { date: "16:00", patients: 7 },
    { date: "20:00", patients: 12 },
  ]), []);

  const weeklyData = useMemo(() => ([
    { date: "Mon", patients: 10 },
    { date: "Tue", patients: 15 },
    { date: "Wed", patients: 12 },
    { date: "Thu", patients: 20 },
    { date: "Fri", patients: 18 },
    { date: "Sat", patients: 22 },
    { date: "Sun", patients: 17 },
  ]), []);

  const monthlyData = useMemo(() => {
    const seedRand = (i) => (Math.sin(i * 999) + 1) * 0.5;
    return Array.from({ length: 30 }, (_, i) => ({
      date: `Day ${i + 1}`,
      patients: Math.floor(seedRand(i + 1) * 25) + 5,
    }));
  }, []);

  const chartData = useMemo(() => {
    if (timeRange === "day") return dailyData;
    if (timeRange === "week") return weeklyData;
    if (timeRange === "month") return monthlyData;
    return weeklyData;
  }, [timeRange, dailyData, weeklyData, monthlyData]);

  /* ---------- Lifecycle ---------- */
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  // Simulated live notifications feed
  useEffect(() => {
    const interval = setInterval(() => {
      const next = INITIAL_NOTIFICATIONS[Math.floor(Math.random() * INITIAL_NOTIFICATIONS.length)];
      setNotifications((prev) => [{ ...next, id: Date.now() }, ...prev].slice(0, 8));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Persist prefs
  useEffect(() => localStorage.setItem(LS.RANGE, timeRange), [timeRange]);
  useEffect(() => localStorage.setItem(LS.SEARCH, search), [search]);
  useEffect(() => localStorage.setItem(LS.DEPTS, JSON.stringify(deptFilters)), [deptFilters]);
  useEffect(() => localStorage.setItem(LS.VIEW, JSON.stringify(savedViews)), [savedViews]);

  /* ---------- Filters ---------- */
  const allDepts = useMemo(() => {
    const s = new Set([...patients.map(p => p.dept), ...appointments.map(a => a.dept)]);
    return Array.from(s);
  }, [patients, appointments]);

  const filteredPatients = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let rows = patients;
    if (deptFilters.length) rows = rows.filter(p => deptFilters.includes(p.dept));
    if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q));
    return rows;
  }, [debouncedSearch, patients, deptFilters]);

  const filteredAppointments = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let rows = appointments;
    if (deptFilters.length) rows = rows.filter(a => deptFilters.includes(a.dept));
    if (q) rows = rows.filter((a) =>
      a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) || a.dept.toLowerCase().includes(q)
    );
    return rows;
  }, [debouncedSearch, appointments, deptFilters]);

  /* ---------- Ambulance KPIs ---------- */
  const totalAmbulances = ambulances.length;
  const activeTrips = ambulances.filter((a) => a.status === "on trip").length;
  const idleAmbulances = ambulances.filter((a) => a.status === "idle").length;

  /* ---------- Actions ---------- */
  const assignAmbulance = (patientName) => {
    setAmbulances((prev) => {
      const available = prev.find((a) => a.status === "idle");
      if (!available) {
        setNotifications((n) => [{ id: Date.now(), text: `No ambulances available for ${patientName}`, type: "alert" }, ...n].slice(0, 8));
        return prev;
      }
      const updated = prev.map((a) => (a.id === available.id ? { ...a, status: "on trip", assignedTo: patientName } : a));
      setNotifications((n) => [{ id: Date.now(), text: `Ambulance #${available.id} assigned to ${patientName}`, type: "success" }, ...n].slice(0, 8));
      return updated;
    });
  };

  const saveView = () => {
    const name = prompt("Save current filters as view name?");
    if (!name) return;
    const view = { id: Date.now(), name, search, timeRange, showPieLegend, deptFilters };
    setSavedViews(v => [view, ...v].slice(0, 10));
  };
  const applyView = (v) => {
    setSearch(v.search || "");
    setTimeRange(v.timeRange || "week");
    setShowPieLegend(!!v.showPieLegend);
    setDeptFilters(v.deptFilters || []);
  };
  const clearFilters = () => {
    setSearch("");
    setDeptFilters([]);
  };
  const refreshDemo = () => {
    setPatients([...INITIAL_PATIENTS]);
    setAppointments([...INITIAL_APPOINTMENTS]);
    setAmbulances([...INITIAL_AMBULANCES]);
    setNotifications([...INITIAL_NOTIFICATIONS]);
  };

  /* ---------- Keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === "/") { e.preventDefault(); document.getElementById("globalSearch")?.focus(); }
      if (k === "d") setDensity((d) => (d === "compact" ? "comfortable" : "compact"));
      if (k === "t") setTheme((m) => (m === "dark" ? "light" : m === "light" ? "auto" : "dark"));
      if (k === "e") exportCSV(filteredPatients, "patients.csv");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filteredPatients, setDensity, setTheme]);

  /* ---------- Derived UI ---------- */
  const containerPad = density === "compact" ? "p-3" : "p-6";
  const cardPad = density === "compact" ? "p-4" : "p-6";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 dark:text-sky-300 font-semibold">
        <Loader2 className="animate-spin mr-3" size={22} />
        Loading dashboard…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-zinc-900 dark:to-zinc-950 transition-colors duration-500 relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-zinc-900/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className={`max-w-7xl mx-auto flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${containerPad}`}>
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-sky-600" size={28} aria-hidden />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-sm">Hospital Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400">Real-time insights · Care operations · Logistics</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full md:w-auto">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 w-full sm:w-[360px]">
              <SearchIcon size={16} className="text-gray-500 dark:text-zinc-400" />
              <input
                id="globalSearch"
                type="search"
                aria-label="Search patients, doctors or departments"
                placeholder="Search patients, doctors or departments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
              {search && (
                <button className="text-xs text-gray-500 dark:text-zinc-400" onClick={() => setSearch("")} aria-label="Clear search">
                  Clear
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFiltersOpen(true)}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex items-center gap-2"
                title="Filters"
                aria-label="Open filters"
              >
                <Filter size={16} /> Filters
              </button>
              <button
                onClick={() => setTheme((m) => (m === "dark" ? "light" : m === "light" ? "auto" : "dark"))}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex items-center gap-2"
                title="Toggle theme (t)"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Moon size={16} /> : theme === "light" ? <Sun size={16} /> : <Sparkles size={16} />}
                {theme.toUpperCase()}
              </button>
              <button
                onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex items-center gap-2"
                title="Toggle density (d)"
                aria-label="Toggle density"
              >
                <SlidersHorizontal size={16} />
                {density === "compact" ? "Compact" : "Comfortable"}
              </button>
              <button
                onClick={() => exportCSV(filteredPatients, "patients.csv")}
                className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm flex items-center gap-2"
                title="Export patients (e)"
                aria-label="Export patients CSV"
              >
                <Download size={16} /> CSV
              </button>
            </div>
          </div>
        </div>

        {/* Sticky Sub-Toolbar: quick filters & saved views */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60">
          <div className={`max-w-7xl mx-auto ${containerPad} flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between`}>
            {/* Dept chips */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-zinc-400 self-center">Departments:</span>
              {allDepts.map(d => {
                const on = deptFilters.includes(d);
                const count = patients.filter(p=>p.dept===d).length;
                return (
                  <button
                    key={d}
                    onClick={() => setDeptFilters(s => on ? s.filter(x=>x!==d) : [...s, d])}
                    className={chipCls(on)}
                  >
                    {d} <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${on ? "bg-white/20" : "bg-zinc-100 dark:bg-zinc-800"}`}>{count}</span>
                  </button>
                );
              })}
              {deptFilters.length > 0 && (
                <button onClick={clearFilters} className="text-xs underline text-gray-500 dark:text-zinc-400">Clear</button>
              )}
            </div>

            {/* Views */}
            <div className="flex flex-wrap gap-2">
              <button onClick={saveView} className={chipCls(true)} title="Save current filters">
                <Bookmark size={14}/> Save View
              </button>
              {savedViews.map(v => (
                <button key={v.id} onClick={() => applyView(v)} className={chipCls(false)} title="Apply saved view">
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className={`max-w-7xl mx-auto ${containerPad} space-y-8`}>
        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6">
          <KpiCard icon={<Users className="text-sky-600" size={28} />} value={patients.length} label="Total Patients" trend="+5%" trendType="up" />
          <KpiCard icon={<CalendarIcon className="text-green-600" size={28} />} value={appointments.length} label="Appointments" trend="+2%" trendType="up" />
          <KpiCard icon={<Bell className="text-amber-500" size={28} />} value={notifications.length} label="Notifications" />
          <KpiCard icon={<Activity className="text-purple-600" size={28} />} value={12} label="Active Doctors" />
          <KpiCard icon={<Truck className="text-red-500" size={28} />} value={totalAmbulances} label="Ambulances" subText={`Idle: ${idleAmbulances} · On Trip: ${activeTrips}`} />
        </section>

        {/* Analytics */}
        <section className="bg-transparent">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base sm:text-lg font-semibold">Analytics</h2>
            <button
              onClick={() => setAnalyticsCollapsed((c) => !c)}
              className="text-xs flex items-center gap-1 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
              aria-expanded={!analyticsCollapsed}
            >
              {analyticsCollapsed ? <ChevronDown size={14}/> : <ChevronUp size={14}/>} {analyticsCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {!analyticsCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Patients Trend */}
                <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${cardPad} col-span-2`}>
                  <div className="flex items-start justify-between mb-4 gap-2">
                    <div>
                      <h3 className="text-lg md:text-xl font-semibold">Patients Trend</h3>
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{timeRange === "day" ? "Hourly" : timeRange === "week" ? "Weekly" : "Monthly"} admissions</p>
                    </div>

                    <div className="flex gap-2">
                      {["day", "week", "month"].map((range) => (
                        <button
                          key={range}
                          onClick={() => setTimeRange(range)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${timeRange === range ? "bg-sky-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}
                          aria-pressed={timeRange === range}
                        >
                          {range === "day" ? "1 Day" : range === "week" ? "1 Week" : "1 Month"}
                        </button>
                      ))}
                      <button
                        onClick={refreshDemo}
                        className="px-3 py-1 rounded-lg text-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
                        title="Refresh demo data"
                      >
                        <RefreshCcw size={14}/> Refresh
                      </button>
                    </div>
                  </div>

                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="currentColor" tick={{ fill: "currentColor" }} />
                        <YAxis stroke="currentColor" tick={{ fill: "currentColor" }} />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="patients" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.section>

                {/* Departments Pie */}
                <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${cardPad}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg md:text-xl font-semibold">Department Distribution</h3>
                    <button
                      className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
                      onClick={() => setShowPieLegend((p) => !p)}
                      aria-pressed={showPieLegend}
                    >
                      {showPieLegend ? <Eye size={14} /> : <EyeOff size={14} />} Legend
                    </button>
                  </div>
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie data={PIE_DATA} dataKey="value" cx="50%" cy="50%" outerRadius={110} label>
                          {PIE_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {showPieLegend && (
                    <ul className="mt-3 grid grid-cols-2 gap-x-4 text-sm">
                      {PIE_DATA.map((d, i) => (
                        <li key={d.name} className="flex items-center gap-2">
                          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                          {d.name} — <span className="font-medium">{d.value}%</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Data tables */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable
            title="Recent Patients"
            data={filteredPatients}
            columns={[
              { key: "name", label: "Name" },
              { key: "age", label: "Age" },
              { key: "dept", label: "Department" },
              { key: "admitted", label: "Admitted" },
            ]}
            density={density}
            onExport={() => exportCSV(filteredPatients, "patients.csv")}
          />

          <AppointmentList
            title="Upcoming Appointments"
            data={filteredAppointments}
            ambulances={ambulances}
            setAmbulances={setAmbulances}
            assignAmbulance={assignAmbulance}
            density={density}
          />
        </section>

        {/* Notifications */}
        <section className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${cardPad}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Notifications</h2>
            <span className="text-sm text-gray-400 dark:text-zinc-500">{notifications.length} total</span>
          </div>

          {notifications.length === 0 ? (
            <p className="text-gray-500 dark:text-zinc-400">No notifications available.</p>
          ) : (
            <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {notifications.map((n) => (
                  <motion.li
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-zinc-800/60 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
                  >
                    <div className="mt-1 shrink-0" aria-hidden>
                      {n.type === "success" && <CheckCircle2 className="text-green-500" />}
                      {n.type === "alert" && <XCircle className="text-red-500" />}
                      {n.type === "info" && <Bell className="text-amber-500" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.text}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                        {new Date(n.id).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </section>
      </main>

      {/* Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-2xl flex items-center justify-between px-3 py-2">
          <button onClick={()=>setFiltersOpen(true)} className="px-3 py-2 rounded-xl flex items-center gap-2 border">
            <Filter size={18}/> Filters
          </button>
          <button onClick={()=>exportCSV(filteredPatients, "patients.csv")} className="px-3 py-2 bg-sky-600 text-white rounded-xl flex items-center gap-2">
            <Download size={18}/> CSV
          </button>
          <button onClick={()=>setTheme(m=> m==="dark"?"light": m==="light"?"auto":"dark")} className="px-3 py-2 rounded-xl flex items-center gap-2 border">
            {theme==="dark"? <Moon size={18}/> : theme==="light" ? <Sun size={18}/> : <Sparkles size={18}/> } {theme.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Filters Drawer (mobile/desktop modal) */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center md:justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            aria-modal="true" role="dialog" aria-label="Filters"
            onClick={()=>setFiltersOpen(false)}
          >
            <motion.div
              onClick={(e)=>e.stopPropagation()}
              initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
              className="w-full md:max-w-xl bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Filters</div>
                <button onClick={()=>setFiltersOpen(false)} className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close">
                  <X size={18}/>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Search</div>
                  <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2">
                    <SearchIcon size={16} className="text-gray-500 dark:text-zinc-400"/>
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…" className="bg-transparent outline-none text-sm w-full"/>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Departments</div>
                  <div className="flex flex-wrap gap-2">
                    {allDepts.map(d => {
                      const on = deptFilters.includes(d);
                      return (
                        <button key={d} onClick={()=>setDeptFilters(s=> on? s.filter(x=>x!==d): [...s,d])} className={chipCls(on)}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Analytics Range</div>
                  <div className="flex gap-2">
                    {["day","week","month"].map(r=>(
                      <button key={r} onClick={()=>setTimeRange(r)} className={chipCls(timeRange===r)} aria-pressed={timeRange===r}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <button onClick={saveView} className="px-3 py-2 rounded-lg text-sm border">
                    <Bookmark size={14} className="inline mr-1"/> Save View
                  </button>
                  <div className="flex gap-2">
                    <button onClick={clearFilters} className="px-3 py-2 rounded-lg text-sm border">Clear</button>
                    <button onClick={()=>setFiltersOpen(false)} className="px-3 py-2 rounded-lg text-sm bg-sky-600 text-white">Done</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print tweaks */}
      <style>{`@media print { header, .sticky, .shadow, .fixed { display:none !important; } body { background:white !important; } }`}</style>
      {/* Reduce motion respect */}
      <style>{`@media (prefers-reduced-motion: reduce){ * { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; scroll-behavior:auto !important; } }`}</style>
    </div>
  );
}

/* ============================= Subcomponents ============================= */
function KpiCard({ icon, value, label, trend, trendType = "up", subText }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow p-5 sm:p-6 flex flex-col gap-3">
      <div className="flex items-center gap-4 w-full justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl">{icon}</div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">{value}</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{label}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-semibold flex items-center gap-1 ${trendType === "up" ? "text-green-600" : "text-red-600"}`}>
            {trendType === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      {subText && <p className="text-xs text-gray-400 dark:text-zinc-500">{subText}</p>}
    </motion.div>
  );
}

function DataTable({ title, data = [], columns = [], density = "comfortable", onExport }) {
  const compact = density === "compact";
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${compact ? "p-4" : "p-6"} overflow-x-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 dark:text-zinc-500">{data.length} records</div>
          {onExport && (
            <button onClick={onExport} className="px-2 py-1 rounded bg-sky-600 text-white text-xs flex items-center gap-1">
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <div className="text-sm font-medium">No data found</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Try adjusting search or filters.</div>
          </div>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
          <thead className="bg-sky-50 dark:bg-zinc-800/60">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-600 dark:text-zinc-300 whitespace-nowrap">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-gray-800 dark:text-zinc-100 whitespace-nowrap">
                    {String(row[col.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );
}

function AppointmentList({ title, data = [], ambulances = [], setAmbulances = () => {}, assignAmbulance = () => {}, density = "comfortable" }) {
  const compact = density === "compact";
  const [localAssigned, setLocalAssigned] = useState(() => {
    const map = {};
    ambulances.forEach((a) => { if (a.assignedTo) map[a.assignedTo] = a.id; });
    return map;
  });

  useEffect(() => {
    const map = {};
    ambulances.forEach((a) => { if (a.assignedTo) map[a.assignedTo] = a.id; });
    setLocalAssigned(map);
  }, [ambulances]);

  const handleAssign = (patientName) => {
    const available = ambulances.find((a) => a.status === "idle");
    if (!available) {
      alert(`No ambulances available for ${patientName}`);
      return;
    }
    setLocalAssigned((prev) => ({ ...prev, [patientName]: available.id }));
    assignAmbulance(patientName);
    setAmbulances((prev) => prev.map((a) => (a.id === available.id ? { ...a, status: "on trip", assignedTo: patientName } : a)));
  };

  const isAnyIdle = ambulances.some((a) => a.status === "idle");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${compact ? "p-4" : "p-6"} overflow-y-auto max-h-[560px]`}>
      <h2 className="text-lg md:text-xl font-semibold mb-4">{title}</h2>

      {data.length === 0 ? (
        <div className="text-gray-500 dark:text-zinc-400">No appointments found.</div>
      ) : (
        <ul className="space-y-3">
          {data.map((a) => {
            const assignedAmbulance = localAssigned[a.patient] || ambulances.find((x) => x.assignedTo === a.patient)?.id;
            const assigned = Boolean(assignedAmbulance);
            return (
              <motion.li
                key={a.id}
                layout
                className={`flex justify-between items-center p-3 rounded-lg shadow-sm border border-transparent transition-colors ${assigned ? "bg-green-50 dark:bg-emerald-900/20" : "bg-sky-50 dark:bg-sky-900/20"} hover:border-zinc-200 dark:hover:border-zinc-700`}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{a.patient}</p>
                  <p className="text-gray-500 dark:text-zinc-400 text-sm">{a.doctor} · {a.time} · {a.dept}</p>
                  {assigned && (
                    <p className="text-green-700 dark:text-emerald-300 text-sm mt-1">🚑 Assigned Ambulance #{assignedAmbulance}</p>
                  )}
                </div>

                <button
                  onClick={() => handleAssign(a.patient)}
                  disabled={!isAnyIdle || assigned}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400
                  ${assigned ? "bg-gray-300 text-gray-700 cursor-not-allowed dark:bg-zinc-700 dark:text-zinc-300" : "bg-red-500 text-white hover:bg-red-600"}`}
                  aria-disabled={!isAnyIdle || assigned}
                >
                  <PlusCircle size={16} /> {assigned ? "Assigned" : "Assign Ambulance"}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

/* ============================== Chart UIs =============================== */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3 py-2 shadow">
      <div className="font-medium">{label}</div>
      <div className="text-sky-600 dark:text-sky-300">{p.value} patients</div>
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3 py-2 shadow">
      <div className="font-medium">{p?.name}</div>
      <div className="text-sky-600 dark:text-sky-300">{p?.value}%</div>
    </div>
  );
}
