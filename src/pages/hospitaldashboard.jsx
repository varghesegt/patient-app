import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Calendar as CalendarIcon, Bell, Activity, Loader2, Search as SearchIcon,
  ArrowUpRight, ArrowDownRight, Truck, PlusCircle, CheckCircle2, XCircle,
  Download, SlidersHorizontal, Eye, EyeOff,
  Filter, RefreshCcw, X, ChevronDown, ChevronUp, Sun, Moon, Settings
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, RadialBarChart, RadialBar, Legend
} from "recharts";

/* ============================ Seed / Constants ============================ */
const INITIAL_PATIENTS = [
  { id: 1, name: "Abi", age: 29, admitted: "2025-09-20", dept: "General", status: "Inpatient", severity: "Moderate" },
  { id: 2, name: "Jane Smith", age: 34, admitted: "2025-09-21", dept: "Cardiology", status: "Inpatient", severity: "High" },
  { id: 3, name: "Mark Wilson", age: 41, admitted: "2025-09-22", dept: "Neurology", status: "Outpatient", severity: "Low" },
  { id: 4, name: "Alice Johnson", age: 37, admitted: "2025-09-23", dept: "Orthopedics", status: "Inpatient", severity: "Moderate" },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, doctor: "Dr. Sharma", patient: "Abi", time: "10:00 AM", dept: "General", room: "G-101" },
  { id: 2, doctor: "Dr. Verma", patient: "Jane Smith", time: "11:30 AM", dept: "Cardiology", room: "C-201" },
  { id: 3, doctor: "Dr. Rao", patient: "Mark Wilson", time: "01:00 PM", dept: "Neurology", room: "N-304" },
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

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#ef4444", "#10b981", "#f59e0b"];

/* LocalStorage keys */
const LS = {
  UI: "hospdash_ui_prefs_v5",
  RANGE: "hospdash_time_range_v1",
  SEARCH: "hospdash_search_v1",
  DEPTS: "hospdash_dept_filters_v1",
  THEME: "hospdash_theme_v1",
  AMB: "hospdash_ambulances_v1",
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

const exportSummaryCSV = (summary, filename = "hospital_summary.csv") => {
  const rows = Object.entries(summary).map(([k, v]) => ({ metric: k, value: v }));
  exportCSV(rows, filename);
};

const Skeleton = ({ className = "" }) => <div className={`animate-pulse bg-gray-200/70 dark:bg-zinc-800 rounded ${className}`} />;

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

const useTheme = (initial = "auto") => {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(LS.THEME) ?? initial; } catch { return initial; }
  });
  useEffect(() => {
    const prefers = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const isDark = mode === "dark" || (mode === "auto" && prefers);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem(LS.THEME, mode);
  }, [mode]);
  return [mode, setMode];
};

const chipCls = (active) =>
  `inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full border text-xs sm:text-sm transition 
   ${active ? "bg-sky-600 text-white border-sky-600" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"}`;

const parseTimeToMs = (timeStr) => {
  // "01:00 PM" -> ms since start of day
  const m = timeStr?.match?.(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return Number.MAX_SAFE_INTEGER;
  let [_, hh, mm, ap] = m;
  let h = parseInt(hh, 10) % 12;
  if (ap.toUpperCase() === "PM") h += 12;
  return h * 3600000 + parseInt(mm, 10) * 60000;
};

const classNames = (...xs) => xs.filter(Boolean).join(" ");

/* ============================== Main Page =============================== */
export default function HospitalDashboard() {
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useTheme("auto");
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);

  // Notifications with real timestamps
  const seededNotifications = useMemo(
    () => INITIAL_NOTIFICATIONS.map((n, i) => ({ ...n, ts: Date.now() - (i + 1) * 60_000, uid: `${n.id}-${Date.now()}` })),
    []
  );
  const [notifications, setNotifications] = useState(seededNotifications);

  // Ambulances persisted
  const [ambulances, setAmbulances] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.AMB)) || INITIAL_AMBULANCES; } catch { return INITIAL_AMBULANCES; }
  });

  const [search, setSearch] = useState(() => localStorage.getItem(LS.SEARCH) || "");
  const [timeRange, setTimeRange] = useState(() => localStorage.getItem(LS.RANGE) || "week");
  const [density, setDensity] = useDensity("comfortable");
  const [showPieLegend, setShowPieLegend] = useState(true);

  const [deptFilters, setDeptFilters] = useState(() => {
    try { return JSON.parse(localStorage.getItem(LS.DEPTS)) || []; } catch { return []; }
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null); // drawer
  const searchRef = useRef(null);
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

  // Live notifications feed
  useEffect(() => {
    const interval = setInterval(() => {
      const next = INITIAL_NOTIFICATIONS[Math.floor(Math.random() * INITIAL_NOTIFICATIONS.length)];
      setNotifications((prev) => [{ ...next, ts: Date.now(), uid: `${next.id}-${Date.now()}` }, ...prev].slice(0, 10));
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  // Persist prefs & ambulances
  useEffect(() => localStorage.setItem(LS.RANGE, timeRange), [timeRange]);
  useEffect(() => localStorage.setItem(LS.SEARCH, search), [search]);
  useEffect(() => localStorage.setItem(LS.DEPTS, JSON.stringify(deptFilters)), [deptFilters]);
  useEffect(() => localStorage.setItem(LS.AMB, JSON.stringify(ambulances)), [ambulances]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); setFiltersOpen(true); }
      if (e.key.toLowerCase() === "d") { e.preventDefault(); setDensity((d) => (d === "compact" ? "comfortable" : "compact")); }
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        setMode((m) => (m === "dark" ? "auto" : m === "auto" ? "light" : m === "light" ? "dark" : "auto"));
      }
      if (e.key.toLowerCase() === "r") { e.preventDefault(); refreshDemo(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setMode, setDensity]);

  /* ---------- Derived datasets ---------- */
  const allDepts = useMemo(() => {
    const s = new Set([...patients.map(p => p.dept), ...appointments.map(a => a.dept)]);
    return Array.from(s);
  }, [patients, appointments]);

  const filteredPatients = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let rows = patients;
    if (deptFilters.length) rows = rows.filter(p => deptFilters.includes(p.dept));
    if (q) rows = rows.filter((p) =>
      p.name.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q) || p.status.toLowerCase().includes(q) || p.severity.toLowerCase().includes(q)
    );
    return rows;
  }, [debouncedSearch, patients, deptFilters]);

  const filteredAppointments = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    let rows = appointments;
    if (deptFilters.length) rows = rows.filter(a => deptFilters.includes(a.dept));
    if (q) rows = rows.filter((a) =>
      a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q) || a.dept.toLowerCase().includes(q) || a.room.toLowerCase().includes(q)
    );
    return [...rows].sort((a, b) => parseTimeToMs(a.time) - parseTimeToMs(b.time));
  }, [debouncedSearch, appointments, deptFilters]);

  const recentPatients = useMemo(() => {
    const parse = (d) => new Date(d).getTime() || 0;
    return [...filteredPatients].sort((a, b) => parse(b.admitted) - parse(a.admitted)).slice(0, 10);
  }, [filteredPatients]);

  /* ---------- KPIs & computed ---------- */
  const totalAmbulances = ambulances.length;
  const activeTrips = ambulances.filter((a) => a.status === "on trip").length;
  const idleAmbulances = ambulances.filter((a) => a.status === "idle").length;

  const HOSP_CAPACITY = 120; // demo capacity
  const bedOccupancyPct = Math.min(100, Math.round((patients.length / HOSP_CAPACITY) * 100));
  const avgWaitMins = 18; // demo metric
  const sosLast24 = 3; // demo metric

  const deptBars = useMemo(() => {
    const counts = allDepts.map(d => ({
      dept: d,
      patients: patients.filter(p => p.dept === d).length,
      appts: appointments.filter(a => a.dept === d).length,
    }));
    return counts;
  }, [allDepts, patients, appointments]);

  // Case Mix Pie from actual patients (fallback if none)
  const caseMix = useMemo(() => {
    const counts = {};
    patients.forEach(p => counts[p.dept] = (counts[p.dept] || 0) + 1);
    const total = patients.length || 1;
    const entries = Object.entries(counts).map(([name, c]) => ({ name, value: Math.round((c / total) * 100) }));
    return entries.length ? entries : [{ name: "General", value: 100 }];
  }, [patients]);

  // Capacity by department (demo numbers)
  const capacityMatrix = useMemo(() => {
    const byDept = {};
    allDepts.forEach(d => {
      const current = patients.filter(p => p.dept === d).length;
      const capacity = d === "Cardiology" ? 32 : d === "Neurology" ? 28 : d === "Orthopedics" ? 24 : 36;
      byDept[d] = { capacity, used: current, free: Math.max(0, capacity - current) };
    });
    return byDept;
  }, [allDepts, patients]);

  /* ---------- Actions ---------- */
  const assignAmbulance = (patientName) => {
    setAmbulances((prev) => {
      const available = prev.find((a) => a.status === "idle");
      if (!available) {
        setNotifications((n) => [{ ts: Date.now(), uid: `noamb-${Date.now()}`, text: `No ambulances available for ${patientName}`, type: "alert" }, ...n].slice(0, 10));
        return prev;
      }
      const updated = prev.map((a) => (a.id === available.id ? { ...a, status: "on trip", assignedTo: patientName } : a));
      setNotifications((n) => [{ ts: Date.now(), uid: `assign-${Date.now()}`, text: `Ambulance #${available.id} assigned to ${patientName}`, type: "success" }, ...n].slice(0, 10));
      return updated;
    });
  };

  const completeTrip = (id) => {
    setAmbulances(prev => prev.map(a => a.id === id ? { ...a, status: "idle", assignedTo: null } : a));
  };

  const clearFilters = () => {
    setSearch("");
    setDeptFilters([]);
  };

  const refreshDemo = () => {
    setPatients([...INITIAL_PATIENTS]);
    setAppointments([...INITIAL_APPOINTMENTS]);
    setAmbulances([...INITIAL_AMBULANCES]);
    setNotifications(seededNotifications);
  };

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

  const summaryForCSV = {
    total_patients: patients.length,
    total_appointments_today: appointments.length,
    notifications: notifications.length,
    ambulances_idle: idleAmbulances,
    ambulances_on_trip: activeTrips,
    bed_occupancy_percent: `${bedOccupancyPct}%`,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-zinc-900 dark:to-zinc-950 transition-colors duration-500 relative">
      {/* Topbar */}
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 dark:bg-zinc-900/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${containerPad}`}>
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-sky-600" size={28} aria-hidden />
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-sm">Hospital Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-zinc-400">Premium ERP · Operations · Analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-[620px] max-w-full">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 flex-1">
              <SearchIcon size={16} className="text-gray-500 dark:text-zinc-400" />
              <input
                ref={searchRef}
                id="globalSearch"
                type="search"
                aria-label="Search patients, doctors or departments"
                placeholder="Type ‘/’ to search patients, doctors, departments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
              {!!search && (
                <button className="text-xs text-gray-500 dark:text-zinc-400" onClick={() => setSearch("")} aria-label="Clear search">
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={() => setFiltersOpen(true)}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex items-center gap-2"
              title="Filters (F)"
              aria-label="Open filters"
            >
              <Filter size={16} /> Filters
            </button>
          </div>
        </div>
      </header>

      {/* Body with sticky Sidebar + Main */}
      <div className={`max-w-7xl mx-auto grid grid-cols-12 gap-6 ${containerPad}`}>
        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-3 xl:col-span-3 space-y-6">
          {/* Quick Overview */}
          <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${cardPad} sticky top-[88px]`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Today at a Glance</h3>
              <Settings size={16} className="text-zinc-400" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <MiniStat label="Admissions" value={patients.length} tone="sky" />
              <MiniStat label="Appointments" value={appointments.length} tone="emerald" />
              <MiniStat label="Avg Wait" value={`${avgWaitMins}m`} tone="amber" />
              <MiniStat label="SOS (24h)" value={sosLast24} tone="rose" />
            </div>

            {/* Capacity Matrix */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Capacity by Department</div>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(capacityMatrix).map(([dept, v], i) => {
                  const pct = Math.min(100, Math.round((v.used / v.capacity) * 100));
                  return (
                    <div key={dept} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{dept}</span>
                        <span className="text-gray-500 dark:text-zinc-400">{v.used}/{v.capacity}</span>
                      </div>
                      <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div className="h-2 rounded" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Mini Calendar</div>
              <MiniCalendar />
            </div>

            {/* Quick Actions */}
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Quick Actions</div>
              <div className="flex flex-col gap-2">
                <button
                  className="text-left px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
                  onClick={() => exportSummaryCSV(summaryForCSV)}
                  aria-label="Export summary as CSV"
                >
                  <Download className="inline mr-2" size={14}/> Export summary (CSV)
                </button>
                <button className="text-left px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm">
                  + Admit new patient
                </button>
                <button className="text-left px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm">
                  + Schedule appointment
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="col-span-12 lg:col-span-9 xl:col-span-9 space-y-6">
          {/* KPI row */}
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            <KpiCard icon={<Users className="text-sky-600" size={28} />} value={patients.length} label="Total Patients" trend="+5%" trendType="up" />
            <KpiCard icon={<CalendarIcon className="text-green-600" size={28} />} value={appointments.length} label="Appointments Today" trendType="up" />
            <KpiCard icon={<Bell className="text-amber-500" size={28} />} value={notifications.length} label="Notifications" />
            <KpiCard icon={<Truck className="text-red-500" size={28} />} value={`${idleAmbulances}/${totalAmbulances}`} label="Ambulances Idle/Total" />
          </section>

          {/* Analytics */}
          <section className="bg-transparent">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base sm:text-lg font-semibold">Analytics</h2>
              <div className="flex items-center gap-2">
                {["day", "week", "month"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${timeRange === range ? "bg-sky-600 text-white" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700"}`}
                    aria-pressed={timeRange === range}
                  >
                    {range === "day" ? "1 Day" : range === "week" ? "1 Week" : "1 Month"}
                  </button>
                ))}
                <button
                  onClick={refreshDemo}
                  className="px-3 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800 flex items-center gap-2"
                  title="Refresh demo data (R)"
                >
                  <RefreshCcw size={14}/> Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6">
              {/* Admissions Trend */}
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${cardPad} 2xl:col-span-2`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold">Admissions Trend</h3>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{timeRange === "day" ? "Hourly admissions" : timeRange === "week" ? "Last 7 days" : "Last 30 days"}</p>
                  </div>
                </div>
                <div className="w-full h-72">
                  <ResponsiveContainer>
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

              {/* Case Mix Pie */}
              <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${cardPad}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg md:text-xl font-semibold">Case Mix</h3>
                  <button
                    className="text-xs px-2 py-1 rounded border border-zinc-200 dark:border-zinc-800"
                    onClick={() => setShowPieLegend((p) => !p)}
                    aria-pressed={showPieLegend}
                  >
                    {showPieLegend ? <Eye size={14} /> : <EyeOff size={14} />} Legend
                  </button>
                </div>
                <div className="w-full h-72">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={caseMix} dataKey="value" cx="50%" cy="50%" outerRadius={110} label>
                        {caseMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {showPieLegend && (
                  <ul className="mt-3 grid grid-cols-2 gap-x-4 text-sm">
                    {caseMix.map((d, i) => (
                      <li key={d.name} className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
                        {d.name} — <span className="font-medium">{d.value}%</span>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>
            </div>
          </section>

          {/* Data grids */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AdvancedTable
              title="Recent Patients (latest 10)"
              data={recentPatients}
              columns={[
                { key: "name", label: "Name", sortable: true },
                { key: "age", label: "Age", sortable: true },
                { key: "dept", label: "Department", sortable: true },
                { key: "status", label: "Status", sortable: true },
                { key: "severity", label: "Severity", sortable: true },
                { key: "admitted", label: "Admitted", sortable: true },
              ]}
              density={density}
              onExport={() => exportCSV(recentPatients, "patients.csv")}
              onRowClick={(row) => setSelectedPatient(row)}
              pageSize={6}
            />

            <AppointmentList
              title="Upcoming Appointments (today)"
              data={filteredAppointments}
              ambulances={ambulances}
              setAmbulances={setAmbulances}
              assignAmbulance={assignAmbulance}
              density={density}
            />
          </section>

          {/* Ambulance Fleet + Notifications */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <FleetCard
              ambulances={ambulances}
              completeTrip={completeTrip}
              density={density}
              cardPad={cardPad}
            />

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
                        key={n.uid}
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
                            {new Date(n.ts).toLocaleTimeString()}
                          </p>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </section>
          </section>
        </main>
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
                <div className="flex items-center justify-end gap-2">
                  <button onClick={clearFilters} className="px-3 py-2 rounded-lg text-sm border">Clear</button>
                  <button onClick={()=>setFiltersOpen(false)} className="px-3 py-2 rounded-lg text-sm bg-sky-600 text-white">Done</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Patient Detail Drawer */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-[420px] z-50 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
            aria-modal="true" role="dialog" aria-label="Patient details"
          >
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 dark:text-zinc-400">Patient</div>
                <div className="text-xl font-semibold">{selectedPatient.name}</div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close patient panel">
                <X size={18}/>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Detail label="Age" value={selectedPatient.age} />
                <Detail label="Department" value={selectedPatient.dept} />
                <Detail label="Status" value={selectedPatient.status} />
                <Detail label="Severity" value={selectedPatient.severity} />
                <Detail label="Admitted" value={selectedPatient.admitted} />
              </div>
              <div>
                <div className="text-sm font-medium mb-1">Notes</div>
                <div className="text-sm text-gray-600 dark:text-zinc-300 bg-gray-50 dark:bg-zinc-800 rounded-lg p-3">
                  No clinical notes added in this demo.
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-lg text-sm bg-sky-600 text-white">Update record</button>
                <button className="px-3 py-2 rounded-lg text-sm border border-zinc-300 dark:border-zinc-700">Discharge</button>
              </div>
            </div>
          </motion.aside>
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

function MiniStat({ label, value, tone = "sky" }) {
  const tones = {
    sky: "bg-sky-50 dark:bg-sky-900/20",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20",
    amber: "bg-amber-50 dark:bg-amber-900/20",
    rose: "bg-rose-50 dark:bg-rose-900/20",
  };
  return (
    <div className={classNames("p-3 rounded-xl", tones[tone])}>
      <div className="text-xs text-gray-500 dark:text-zinc-400">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="text-sm">
      <div className="text-xs text-gray-500 dark:text-zinc-400">{label}</div>
      <div className="font-medium">{String(value ?? "-")}</div>
    </div>
  );
}

/* ---- Advanced Table: sorting + pagination + row click ---- */
function AdvancedTable({ title, data = [], columns = [], density = "comfortable", onExport, onRowClick, pageSize = 8 }) {
  const compact = density === "compact";
  const [sortBy, setSortBy] = useState(columns[0]?.key || null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sortBy) return data;
    const arr = [...data].sort((a, b) => {
      const va = a[sortBy]; const vb = b[sortBy];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (!isNaN(va) && !isNaN(vb)) return Number(va) - Number(vb);
      return String(va).localeCompare(String(vb));
    });
    return sortDir === "asc" ? arr : arr.reverse();
  }, [data, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  useEffect(() => { setPage(1); }, [data, sortBy, sortDir, pageSize]);

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    if (sortBy === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("asc"); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${compact ? "p-4" : "p-6"} overflow-x-auto`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-semibold">{title}</h2>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 dark:text-zinc-500">{data.length} records</div>
          {onExport && (
            <button onClick={onExport} className="px-2 py-1 rounded bg-sky-600 text-white text-xs flex items-center gap-1" aria-label="Export CSV">
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </div>

      {pageData.length === 0 ? (
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/60 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-xl p-4">
          <Skeleton className="h-10 w-10" />
          <div>
            <div className="text-sm font-medium">No data found</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Try adjusting search or filters.</div>
          </div>
        </div>
      ) : (
        <>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-800 text-sm">
            <thead className="bg-sky-50 dark:bg-zinc-800/60">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={classNames(
                      "px-4 py-2 text-left font-medium text-gray-600 dark:text-zinc-300 whitespace-nowrap",
                      col.sortable && "cursor-pointer select-none"
                    )}
                    onClick={() => handleSort(col.key, col.sortable)}
                    title={col.sortable ? "Click to sort" : undefined}
                    aria-sort={sortBy === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (sortDir === "asc" ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {pageData.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-gray-800 dark:text-zinc-100 whitespace-nowrap">
                      {col.key === "status" ? <StatusBadge value={row[col.key]} /> :
                       col.key === "severity" ? <SeverityBadge value={row[col.key]} /> :
                       String(row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-gray-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button disabled={page<=1} onClick={()=>setPage(1)} className="px-2 py-1 border rounded disabled:opacity-50">First</button>
              <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-2 py-1 border rounded disabled:opacity-50">Prev</button>
              <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="px-2 py-1 border rounded disabled:opacity-50">Next</button>
              <button disabled={page>=totalPages} onClick={()=>setPage(totalPages)} className="px-2 py-1 border rounded disabled:opacity-50">Last</button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

function StatusBadge({ value }) {
  const map = {
    Inpatient: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    Outpatient: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  };
  return <span className={classNames("px-2 py-0.5 rounded text-xs font-medium", map[value] || "bg-gray-100")}>{value}</span>;
}

function SeverityBadge({ value }) {
  const map = {
    Low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    Moderate: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    High: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return <span className={classNames("px-2 py-0.5 rounded text-xs font-medium", map[value] || "bg-gray-100")}>{value}</span>;
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
                  <p className="text-gray-500 dark:text-zinc-400 text-sm">{a.doctor} · {a.time} · {a.dept} · Room {a.room}</p>
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

function FleetCard({ ambulances = [], completeTrip = () => {}, density = "comfortable", cardPad = "p-6" }) {
  const compact = density === "compact";
  const idle = ambulances.filter(a=>a.status==="idle").length;
  const onTrip = ambulances.length - idle;
  const chartData = [
    { name: "Idle", value: idle, fill: "#10b981" },
    { name: "On Trip", value: onTrip, fill: "#ef4444" },
  ];
  return (
    <section className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow ${compact ? "p-4" : cardPad}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-semibold">Ambulance Fleet</h2>
        <span className="text-xs text-gray-400 dark:text-zinc-500">{ambulances.length} vehicles</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {ambulances.map(a => (
            <div key={a.id} className="py-3 flex items-center justify-between">
              <div className="min-w-0">
                <div className="font-medium">#{a.id} · Driver: {a.driver}</div>
                <div className="text-sm text-gray-500 dark:text-zinc-400">
                  Status: <span className={`${a.status === "on trip" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>{a.status}</span>
                  {a.assignedTo && <> · Assigned to <span className="font-medium">{a.assignedTo}</span></>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {a.status === "on trip" ? (
                  <button onClick={() => completeTrip(a.id)} className="px-3 py-1 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
                    Mark Complete
                  </button>
                ) : (
                  <span className="text-xs px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">Idle</span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="h-44">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={chartData} dataKey="value" innerRadius={50} outerRadius={70}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
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

/* ============================== Mini Calendar =========================== */
function MiniCalendar() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOffset = firstDay.getDay(); // 0 Sun
  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(today.getFullYear(), today.getMonth(), d));

  const dow = ["S","M","T","W","T","F","S"];
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-3 py-2 text-sm font-medium bg-gray-50 dark:bg-zinc-800 flex items-center justify-between">
        <span>{today.toLocaleString(undefined, { month: "long", year: "numeric" })}</span>
      </div>
      <div className="grid grid-cols-7 text-xs p-2 gap-1">
        {dow.map(x => <div key={x} className="text-center text-gray-500 dark:text-zinc-400">{x}</div>)}
        {days.map((d, i) => {
          const isToday = d && d.toDateString() === today.toDateString();
          return (
            <div key={i} className={classNames(
              "h-7 flex items-center justify-center rounded",
              d ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800" : ""
            )} aria-current={isToday ? "date" : undefined}>
              {d ? <span className={classNames("px-2 py-1 rounded", isToday && "bg-sky-600 text-white")}>{d.getDate()}</span> : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}
