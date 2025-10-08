import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Calendar,
  Users,
  FileText,
  Bell,
  Stethoscope,
  Search,
  Activity,
  HeartPulse,
  Eye,
  Edit,
  Trash2,
  ClipboardCheck,
  Download,
  Plus,
  X,
  Sun,
  Moon,
  Info,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Upload,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend,
} from "recharts";

/** ------------------ Local storage ------------------ */
const LOCAL_KEYS = {
  PATIENTS: "dd_patients_v1",
  TASKS: "dd_tasks_v1",
  APPTS: "dd_appts_v1",
  UI: "dd_ui_v1",
};

/** ------------------ Seed data ------------------ */
const initialPatients = [
  {
    id: 1,
    name: "akash",
    age: 45,
    gender: "Male",
    condition: "Diabetes",
    lastVisit: "2025-09-12",
    photo: "https://randomuser.me/api/portraits/men/45.jpg",
    history: ["Blood test", "Insulin prescription", "Diet consultation"],
  },
  {
    id: 2,
    name: "Janie",
    age: 32,
    gender: "Female",
    condition: "Hypertension",
    lastVisit: "2025-09-18",
    photo: "https://randomuser.me/api/portraits/women/32.jpg",
    history: ["ECG", "BP Monitoring", "Lifestyle changes"],
  },
  {
    id: 3,
    name: "Peter Parker",
    age: 28,
    gender: "Male",
    condition: "Fracture",
    lastVisit: "2025-09-20",
    photo: "https://randomuser.me/api/portraits/men/28.jpg",
    history: ["X-ray", "Surgery", "Physiotherapy"],
  },
];

const initialTasks = [
  { id: 1, task: "Review lab reports", done: false },
  { id: 2, task: "Check ECG results", done: true },
  { id: 3, task: "Prepare weekly summary", done: false },
];

const initialAppts = [
  { id: 1, time: "2025-09-24T14:00:00", patient: "Mark Lee", condition: "Checkup", urgent: false },
  { id: 2, time: "2025-09-24T15:15:00", patient: "Anna Brown", condition: "Cardiac Follow-up", urgent: true },
  { id: 3, time: "2025-09-24T16:30:00", patient: "Chris Evans", condition: "Fracture Review", urgent: false },
];

/** ------------------ Utils ------------------ */
function saveToStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
function loadFromStorage(key, fallback) {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; }
}
const highlight = (text, q) => {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
};

export default function DoctorDashboard() {
  /** ------------------ State ------------------ */
  const [patients, setPatients] = useState(() => loadFromStorage(LOCAL_KEYS.PATIENTS, initialPatients));
  const [tasks, setTasks] = useState(() => loadFromStorage(LOCAL_KEYS.TASKS, initialTasks));
  const [appointments, setAppointments] = useState(() => loadFromStorage(LOCAL_KEYS.APPTS, initialAppts));

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [filters, setFilters] = useState({ gender: "All", condition: "All" });
  const [sortBy, setSortBy] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // UI prefs: density + theme
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const [ui, setUi] = useState(() => loadFromStorage(LOCAL_KEYS.UI, { density: "comfortable", theme: prefersDark ? "dark" : "light" }));
  const [bulk, setBulk] = useState(new Set()); // selected ids
  const [toast, setToast] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  /** ------------------ Effects ------------------ */
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => saveToStorage(LOCAL_KEYS.PATIENTS, patients), [patients]);
  useEffect(() => saveToStorage(LOCAL_KEYS.TASKS, tasks), [tasks]);
  useEffect(() => saveToStorage(LOCAL_KEYS.APPTS, appointments), [appointments]);
  useEffect(() => saveToStorage(LOCAL_KEYS.UI, ui), [ui]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault(); searchInputRef.current?.focus();
      }
      if (e.key.toLowerCase() === "a") setShowAddAppt(true);
      if (e.key.toLowerCase() === "n") setEditingPatient({});
      if (e.key.toLowerCase() === "e") exportCSV();
      if (e.key === "?") setHelpOpen((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /** ------------------ Derived ------------------ */
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const patientsToday = appointments.filter((a) => a.time.slice(0, 10) === today).length;
    return [
      { icon: <Users className="w-6 h-6 text-indigo-500" />, label: "Patients Today", value: patientsToday },
      { icon: <Calendar className="w-6 h-6 text-pink-500" />, label: "Appointments", value: appointments.length },
      { icon: <HeartPulse className="w-6 h-6 text-red-500" />, label: "Emergencies", value: appointments.filter((a) => a.urgent).length },
      { icon: <Activity className="w-6 h-6 text-green-500" />, label: "Pending Tasks", value: tasks.filter((t) => !t.done).length },
    ];
  }, [appointments, tasks]);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (filters.gender !== "All") list = list.filter((p) => p.gender === filters.gender);
    if (filters.condition !== "All") list = list.filter((p) => p.condition === filters.condition);

    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.condition.toLowerCase().includes(q) ||
          String(p.age).includes(q)
      );
    }

    list.sort((a, b) => {
      const va = a[sortBy.key]; const vb = b[sortBy.key];
      if (va < vb) return sortBy.dir === "asc" ? -1 : 1;
      if (va > vb) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [patients, debouncedQuery, filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const conditionCounts = useMemo(() => {
    const map = {};
    patients.forEach((p) => (map[p.condition] = (map[p.condition] || 0) + 1));
    return Object.entries(map).map(([condition, count]) => ({ condition, count }));
  }, [patients]);

  const demographics = useMemo(() => {
    const m = patients.filter((p) => p.gender === "Male").length;
    const f = patients.filter((p) => p.gender === "Female").length;
    const o = patients.length - m - f;
    return [
      { name: "Male", value: m },
      { name: "Female", value: f },
      { name: "Other", value: Math.max(0, o) },
    ];
  }, [patients]);

  /** ------------------ Actions ------------------ */
  function exportCSV(ids) {
    const set = ids?.length ? patients.filter((p) => ids.includes(p.id)) : patients;
    const rows = ["Name,Age,Gender,Condition,Last Visit"].concat(
      set.map((p) => `"${p.name}",${p.age},${p.gender},"${p.condition}",${p.lastVisit}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `patients_${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
    setToast(`Exported ${set.length} record(s)`);
  }
  function exportJSON(ids) {
    const set = ids?.length ? patients.filter((p) => ids.includes(p.id)) : patients;
    const blob = new Blob([JSON.stringify(set, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `patients_${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
    setToast(`Exported ${set.length} record(s)`);
  }
  function importCSV(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean);
      const data = lines.slice(1).map((line) => {
        const [name, age, gender, condition, lastVisit] = line.split(",").map((s) => s.replace(/^"|"$/g, ""));
        return { id: Date.now() + Math.random(), name, age: Number(age) || "", gender, condition, lastVisit, photo: "https://randomuser.me/api/portraits/lego/1.jpg", history: [] };
      });
      setPatients((prev) => [...data, ...prev]);
      setToast(`Imported ${data.length} record(s)`);
    };
    reader.readAsText(file);
  }

  function handleSavePatient(updated) {
    const prev = patients;
    setPatients((p) => {
      const idx = p.findIndex((x) => x.id === updated.id);
      if (idx >= 0) {
        const copy = [...p]; copy[idx] = { ...copy[idx], ...updated }; return copy;
      }
      return [{ ...updated, id: Date.now() }, ...p];
    });
    setEditingPatient(null);
    // Undo toast
    setToast(
      <span className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-white" /> Saved. <button onClick={() => setPatients(prev)} className="underline">Undo</button>
      </span>
    );
  }

  function handleDeletePatient(id) {
    if (!confirm("Delete patient record? This action cannot be undone.")) return;
    const prev = patients;
    setPatients((p) => p.filter((x) => x.id !== id));
    setSelectedPatient(null);
    setToast(
      <span className="flex items-center gap-2">
        Deleted. <button onClick={() => setPatients(prev)} className="underline">Undo</button>
      </span>
    );
  }

  function toggleTaskDone(id) { setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))); }
  function addTask(text) { setTasks((prev) => [{ id: Date.now(), task: text, done: false }, ...prev]); }
  function addAppointment(payload) { setAppointments((prev) => [{ id: Date.now(), ...payload }, ...prev]); setShowAddAppt(false); }

  // Bulk
  const toggleBulk = (id) => setBulk((s) => {
    const next = new Set(s); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });
  const clearBulk = () => setBulk(new Set());
  const bulkDelete = () => {
    if (bulk.size === 0) return;
    if (!confirm(`Delete ${bulk.size} selected record(s)?`)) return;
    const prev = patients;
    setPatients((p) => p.filter((x) => !bulk.has(x.id)));
    clearBulk();
    setToast(
      <span className="flex items-center gap-2">
        Deleted {bulk.size}. <button onClick={() => setPatients(prev)} className="underline">Undo</button>
      </span>
    );
  };

  /** ------------------ Theme ------------------ */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", ui.theme === "dark");
  }, [ui.theme]);

  /** ------------------ Render ------------------ */
  return (
    <div className={`flex flex-col min-h-screen ${ui.theme === "dark" ? "bg-gray-950 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      {/* Top Navbar */}
      <header className={`flex items-center justify-between p-4 ${ui.theme === "dark" ? "bg-gray-900" : "bg-white"} shadow sticky top-0 z-50`}>
        {/* Search */}
        <div className={`flex items-center gap-2 w-full max-w-2xl rounded-xl px-3 py-2 ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, conditions, age...  (press / to focus)"
            className={`w-full outline-none bg-transparent text-sm ${ui.theme === "dark" ? "placeholder-gray-400" : ""}`}
            aria-label="Search patients"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="text-xs text-gray-500"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Density */}
          <button
            onClick={() => setUi((s) => ({ ...s, density: s.density === "comfortable" ? "compact" : "comfortable" }))}
            className={`hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
            title="Toggle density"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm">{ui.density === "compact" ? "Compact" : "Comfortable"}</span>
          </button>

          {/* Theme */}
          <button
            onClick={() => setUi((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" }))}
            className={`p-2 rounded-lg ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {ui.theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Add appointment */}
          <button
            className="p-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2"
            onClick={() => setShowAddAppt(true)}
            title="Add appointment (A)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Appointment</span>
          </button>

          {/* Export */}
          <div className="flex items-center gap-2">
            <button
              className={`p-2 rounded-lg ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
              onClick={() => exportCSV([...bulk])}
              title="Export CSV (E)"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded-lg ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
              onClick={() => exportJSON([...bulk])}
              title="Export JSON"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              className={`p-2 rounded-lg ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
              onClick={() => fileInputRef.current?.click()}
              title="Import CSV"
            >
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={(e) => importCSV(e.target.files?.[0])} />
          </div>

          <Bell className="w-6 h-6 opacity-70" />
          <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="doctor" className="w-10 h-10 rounded-full border" />
        </div>
      </header>

      <main className={`p-4 sm:p-6 flex-1 space-y-6 ${ui.density === "compact" ? "text-[15px]" : ""}`}>
        {/* Title + quick summary */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold">Doctor Dashboard</h1>
            </div>
          </div>

          {/* Quick counters */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3">
            <InfoPill icon={<Users className="w-5 h-5 text-indigo-500" />} label="Total Patients" value={patients.length} />
            <InfoPill icon={<Calendar className="w-5 h-5 text-pink-500" />} label="Appointments" value={appointments.length} />
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              whileHover={reducedMotion ? undefined : { scale: 1.03 }}
              className={`shadow rounded-2xl p-5 flex items-center gap-4 transition ${ui.theme === "dark" ? "bg-gray-900" : "bg-white"}`}
            >
              <div className={`p-3 rounded-xl ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>{s.icon}</div>
              <div>
                <h3 className="text-sm opacity-70">{s.label}</h3>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Appointments This Week" subtitle="Interactive">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={appointments.map((a) => ({ day: new Date(a.time).toLocaleDateString(), count: 1 }))}>
                <defs>
                  <linearGradient id="colorAppt2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={ui.theme === "dark" ? "#1f2937" : "#e5e7eb"} />
                <XAxis dataKey="day" stroke={ui.theme === "dark" ? "#9ca3af" : "#6b7280"} hide />
                <YAxis stroke={ui.theme === "dark" ? "#9ca3af" : "#6b7280"} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorAppt2)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Patients Demographics" subtitle="Live">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={demographics} dataKey="value" nameKey="name" outerRadius={80} label>
                  {demographics.map((_, i) => (
                    <Cell key={i} fill={["#4f46e5", "#ec4899", "#10b981"][i % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Conditions */}
        <Card title="Conditions Overview">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conditionCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke={ui.theme === "dark" ? "#1f2937" : "#e5e7eb"} />
              <XAxis dataKey="condition" stroke={ui.theme === "dark" ? "#9ca3af" : "#6b7280"} />
              <YAxis stroke={ui.theme === "dark" ? "#9ca3af" : "#6b7280"} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Controls: filters, sort, bulk */}
        <div className={`rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow ${ui.theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
          <div className="flex flex-wrap items-center gap-3">
            <Select label="Gender" value={filters.gender} onChange={(v) => setFilters((s) => ({ ...s, gender: v }))} options={["All", "Male", "Female"]} />
            <Select
              label="Condition"
              value={filters.condition}
              onChange={(v) => setFilters((s) => ({ ...s, condition: v }))}
              options={["All", ...Array.from(new Set(patients.map((p) => p.condition)))]}
            />
            <Select
              label="Sort"
              value={`${sortBy.key}_${sortBy.dir}`}
              onChange={(v) => { const [key, dir] = v.split("_"); setSortBy({ key, dir }); }}
              options={[
                ["name_asc", "Name ↑"], ["name_desc", "Name ↓"],
                ["age_asc", "Age ↑"], ["age_desc", "Age ↓"],
                ["lastVisit_desc", "Last Visit ↓"],
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            {bulk.size > 0 && (
              <>
                <button onClick={() => exportCSV([...bulk])} className="px-3 py-2 bg-indigo-600 text-white rounded">Export {bulk.size}</button>
                <button onClick={bulkDelete} className="px-3 py-2 bg-rose-600 text-white rounded">Delete {bulk.size}</button>
                <button onClick={clearBulk} className={`px-3 py-2 rounded ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>Clear</button>
              </>
            )}
            <button
              onClick={() => {
                setFilters({ gender: "All", condition: "All" });
                setQuery(""); setSortBy({ key: "name", dir: "asc" });
                setToast("Filters reset");
              }}
              className={`px-3 py-2 text-sm rounded border ${ui.theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-50"}`}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Patients: responsive table (desktop) + cards (mobile) */}
        <div className={`rounded-2xl p-5 shadow ${ui.theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Patients Records
            </h3>
            <div className="text-sm opacity-70">Showing {filtered.length} results</div>
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${ui.theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <th className="p-3 w-10">
                    <input
                      aria-label="Select all"
                      type="checkbox"
                      checked={pageItems.every((p) => bulk.has(p.id)) && pageItems.length > 0}
                      onChange={(e) => {
                        const next = new Set(bulk);
                        if (e.target.checked) pageItems.forEach((p) => next.add(p.id));
                        else pageItems.forEach((p) => next.delete(p.id));
                        setBulk(next);
                      }}
                    />
                  </th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Age</th>
                  <th className="p-3">Gender</th>
                  <th className="p-3">Condition</th>
                  <th className="p-3">Last Visit</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((p) => (
                  <tr key={p.id} className={`${ui.theme === "dark" ? "border-gray-800" : ""} border-b hover:bg-gray-50 dark:hover:bg-gray-800/60`}>
                    <td className="p-3">
                      <input
                        aria-label={`Select ${p.name}`}
                        type="checkbox"
                        checked={bulk.has(p.id)}
                        onChange={() => toggleBulk(p.id)}
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="font-medium">{highlight(p.name, debouncedQuery)}</div>
                          <div className="text-xs opacity-70">{p.history.slice(0, 2).join(" • ")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{highlight(String(p.age), debouncedQuery)}</td>
                    <td className="p-3">{p.gender}</td>
                    <td className="p-3">{highlight(p.condition, debouncedQuery)}</td>
                    <td className="p-3">{p.lastVisit}</td>
                    <td className="p-3 flex gap-2">
                      <IconBtn title="View" onClick={() => setSelectedPatient(p)}><Eye className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Edit" color="amber" onClick={() => setEditingPatient(p)}><Edit className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Delete" color="rose" onClick={() => handleDeletePatient(p.id)}><Trash2 className="w-4 h-4" /></IconBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid md:hidden gap-3">
            {pageItems.map((p) => (
              <div key={p.id} className={`rounded-xl p-3 border ${ui.theme === "dark" ? "border-gray-800 bg-gray-900" : "bg-white"}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={bulk.has(p.id)} onChange={() => toggleBulk(p.id)} />
                  <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs opacity-70">{p.gender} • Age {p.age}</div>
                    <div className="text-sm mt-1"><span className="font-medium">Condition:</span> {p.condition}</div>
                    <div className="text-xs opacity-70">Last visit: {p.lastVisit}</div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <IconBtn title="View" onClick={() => setSelectedPatient(p)}><Eye className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Edit" color="amber" onClick={() => setEditingPatient(p)}><Edit className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Delete" color="rose" onClick={() => handleDeletePatient(p.id)}><Trash2 className="w-4 h-4" /></IconBtn>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm opacity-70">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className={`px-3 py-1 rounded ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                <ChevronLeft className="w-4 h-4 inline" /> Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className={`px-3 py-1 rounded ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
                Next <ChevronRight className="w-4 h-4 inline" />
              </button>
            </div>
          </div>
        </div>

        {/* Tasks + Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Doctor’s Tasks" icon={<ClipboardCheck className="w-5 h-5 text-indigo-500" />}>
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${ui.theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>
                  <div className={t.done ? "line-through opacity-50" : ""}>{t.task}</div>
                  <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} className="w-4 h-4" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                id="newTask"
                className={`flex-1 p-2 rounded border ${ui.theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`}
                placeholder="Add task and press Enter"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.currentTarget.value.trim()) {
                    addTask(e.currentTarget.value.trim()); e.currentTarget.value = ""; setToast("Task added");
                  }
                }}
              />
            </div>
          </Card>

          <Card title="Recent Activity" icon={<Activity className="w-5 h-5 text-indigo-500" />}>
            <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900 pl-6 space-y-6">
              {appointments.slice(0, 6).map((a, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-3 w-6 h-6 bg-indigo-600 rounded-full border-4 border-white dark:border-gray-900"></div>
                  <div>
                    <p className="text-sm opacity-70">{new Date(a.time).toLocaleString()}</p>
                    <p className="">{a.patient} — {a.condition} {a.urgent ? "(urgent)" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>

      {/* View patient modal / mobile bottom sheet */}
      <Sheet open={!!selectedPatient} onClose={() => setSelectedPatient(null)} reducedMotion={reducedMotion}>
        {selectedPatient && (
          <div className="w-full max-w-lg mx-auto">
            <div className="flex items-center gap-4 mb-4">
              <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-16 h-16 rounded-full" />
              <div>
                <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                <p className="opacity-70">{selectedPatient.age} • {selectedPatient.gender}</p>
                <p className="text-sm text-indigo-600 font-semibold">Condition: {selectedPatient.condition}</p>
              </div>
            </div>
            <h3 className="font-semibold mb-2">Medical History</h3>
            <ul className="list-disc pl-5 space-y-1">
              {selectedPatient.history.map((h, idx) => (<li key={idx}>{h}</li>))}
            </ul>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { setEditingPatient(selectedPatient); setSelectedPatient(null); }} className="px-3 py-2 bg-amber-100 text-amber-700 rounded">Edit</button>
              <button onClick={() => handleDeletePatient(selectedPatient.id)} className="px-3 py-2 bg-rose-100 text-rose-700 rounded">Delete</button>
            </div>
          </div>
        )}
      </Sheet>

      {/* Edit/Create patient */}
      <Sheet open={editingPatient !== null} onClose={() => setEditingPatient(null)} reducedMotion={reducedMotion}>
        {editingPatient !== null && (
          <div className="w-full max-w-lg mx-auto">
            <PatientForm patient={editingPatient} onSave={handleSavePatient} onCancel={() => setEditingPatient(null)} theme={ui.theme} />
          </div>
        )}
      </Sheet>

      {/* Add appointment */}
      <Sheet open={showAddAppt} onClose={() => setShowAddAppt(false)} reducedMotion={reducedMotion}>
        {showAddAppt && (
          <div className="w-full max-w-md mx-auto">
            <AddAppointmentForm onAdd={addAppointment} onCancel={() => setShowAddAppt(false)} theme={ui.theme} />
          </div>
        )}
      </Sheet>

      {/* Help */}
      <Sheet open={helpOpen} onClose={() => setHelpOpen(false)} reducedMotion={reducedMotion}>
        <div className="w-full max-w-md mx-auto space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Info className="w-5 h-5" /> Keyboard Shortcuts</h2>
          <ul className="text-sm space-y-1 opacity-80">
            <li><b>/</b> Focus search</li>
            <li><b>A</b> Add appointment</li>
            <li><b>N</b> New patient</li>
            <li><b>E</b> Export CSV</li>
            <li><b>?</b> Toggle help</li>
          </ul>
        </div>
      </Sheet>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed right-4 bottom-4 bg-indigo-600 text-white px-4 py-2 rounded shadow max-w-[80vw]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** ------------------ Reusable UI ------------------ */
function Card({ title, subtitle, icon, children }) {
  return (
    <div className="rounded-2xl p-5 shadow bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          {icon ? icon : null} {title}
        </h3>
        {subtitle && <div className="text-sm opacity-70">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow flex items-center gap-3">
      {icon}
      <div>
        <div className="text-xs opacity-70">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

function IconBtn({ children, title, color, onClick }) {
  const colorMap = {
    amber: "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    rose: "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
    default: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300",
  };
  return (
    <button
      title={title}
      onClick={onClick}
      className={`p-2 rounded ${colorMap[color || "default"]}`}
      aria-label={title}
    >
      {children}
    </button>
  );
}

/** ------------------ Bottom Sheet / Modal ------------------ */
function Sheet({ open, onClose, children, reducedMotion }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-[10vh] w-[92vw] sm:w-auto sm:left-1/2 sm:translate-x-[-50%] sm:top-[10vh] bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-5 max-h-[80vh] overflow-auto sm:max-w-[90vw]"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.98 }}
        >
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" aria-label="Close"><X /></button>
          {children}
        </motion.div>

        {/* Mobile bottom sheet */}
        <motion.div
          className="sm:hidden absolute left-0 right-0 bottom-0 bg-white dark:bg-gray-900 rounded-t-2xl shadow-lg p-5 max-h-[85vh] overflow-auto"
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 80 }}
          animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 80 }}
        >
          <div className="absolute top-2 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-gray-300" />
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600" aria-label="Close"><X /></button>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/** ------------------ Forms ------------------ */
function PatientForm({ patient, onSave, onCancel, theme }) {
  const defaults = { name: "", age: "", gender: "Male", condition: "", lastVisit: new Date().toISOString().slice(0, 10), photo: "https://randomuser.me/api/portraits/lego/1.jpg", history: [] };
  const [form, setForm] = useState({ ...(patient || defaults) });
  useEffect(() => setForm({ ...(patient || defaults) }), [patient]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{patient?.id ? "Edit Patient" : "New Patient"}</h2>
      <div className="space-y-3">
        <input className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        <div className="flex gap-2">
          <input className={`flex-1 p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} placeholder="Age" value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))} />
          <select className={`p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}>
            <option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <input className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} placeholder="Condition" value={form.condition} onChange={(e) => setForm((s) => ({ ...s, condition: e.target.value }))} />
        <input className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} type="date" value={form.lastVisit} onChange={(e) => setForm((s) => ({ ...s, lastVisit: e.target.value }))} />
        <textarea className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} placeholder="History (comma separated)" value={form.history.join(", ")} onChange={(e) => setForm((s) => ({ ...s, history: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }))} />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className={`px-3 py-2 rounded ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>Cancel</button>
          <button onClick={() => onSave({ ...form, id: patient?.id ?? Date.now() })} className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

function AddAppointmentForm({ onAdd, onCancel, theme }) {
  const [payload, setPayload] = useState({ patient: "", time: new Date().toISOString().slice(0, 16), condition: "", urgent: false });
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">New Appointment</h2>
      <div className="space-y-3">
        <input className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} placeholder="Patient name" value={payload.patient} onChange={(e) => setPayload((s) => ({ ...s, patient: e.target.value }))} />
        <input className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} type="datetime-local" value={payload.time} onChange={(e) => setPayload((s) => ({ ...s, time: e.target.value }))} />
        <input className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-900 border-gray-800" : ""}`} placeholder="Condition" value={payload.condition} onChange={(e) => setPayload((s) => ({ ...s, condition: e.target.value }))} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={payload.urgent} onChange={(e) => setPayload((s) => ({ ...s, urgent: e.target.checked }))} /> Mark as urgent</label>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className={`px-3 py-2 rounded ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}>Cancel</button>
          <button onClick={() => onAdd(payload)} className="px-3 py-2 bg-indigo-600 text-white rounded">Add</button>
        </div>
      </div>
    </div>
  );
}

/** ------------------ Small controls ------------------ */
function Select({ label, value, onChange, options }) {
  const normalize = (o) => (Array.isArray(o) ? o : [o, o]);
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs opacity-70">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="p-2 rounded bg-gray-50 dark:bg-gray-800 border dark:border-gray-700"
      >
        {options.map((o) => {
          const [val, text] = normalize(o);
          return <option key={val} value={val}>{text}</option>;
        })}
      </select>
    </div>
  );
}
