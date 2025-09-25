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
  Clock,
  Filter,
  Download,
  Plus,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

// Single-file advanced Doctor Dashboard with: search + debounce, filters, sorting, pagination,
// persistent localStorage, editable patient modal, add appointment modal, CSV export, task toggles,
// inline charts, quick actions, keyboard shortcut ("/") to focus search.

const LOCAL_KEYS = {
  PATIENTS: "dd_patients_v1",
  TASKS: "dd_tasks_v1",
  APPTS: "dd_appts_v1",
};

const initialPatients = [
  {
    id: 1,
    name: "John Doe",
    age: 45,
    gender: "Male",
    condition: "Diabetes",
    lastVisit: "2025-09-12",
    photo: "https://randomuser.me/api/portraits/men/45.jpg",
    history: ["Blood test", "Insulin prescription", "Diet consultation"],
  },
  {
    id: 2,
    name: "Jane Smith",
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

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("localStorage save failed", e);
  }
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    console.warn("localStorage load failed", e);
    return fallback;
  }
}

export default function DoctorDashboard() {
  // Core data
  const [patients, setPatients] = useState(() => loadFromStorage(LOCAL_KEYS.PATIENTS, initialPatients));
  const [tasks, setTasks] = useState(() => loadFromStorage(LOCAL_KEYS.TASKS, initialTasks));
  const [appointments, setAppointments] = useState(() => loadFromStorage(LOCAL_KEYS.APPTS, initialAppts));

  // UI state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [filters, setFilters] = useState({ gender: "All", condition: "All" });
  const [sortBy, setSortBy] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const searchInputRef = useRef(null);

  // Derived metrics
  const stats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const patientsToday = appointments.filter((a) => a.time.slice(0, 10) === today).length;
    return [
      { icon: <Users className="w-6 h-6 text-indigo-500" />, label: "Patients Today", value: patientsToday },
      { icon: <Calendar className="w-6 h-6 text-pink-500" />, label: "Appointments", value: appointments.length },
      { icon: <HeartPulse className="w-6 h-6 text-red-500" />, label: "Emergencies", value: appointments.filter((a) => a.urgent).length },
      { icon: <Activity className="w-6 h-6 text-green-500" />, label: "Reports Pending", value: tasks.filter((t) => !t.done).length },
    ];
  }, [appointments, tasks]);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);

  // Persist to localStorage
  useEffect(() => saveToStorage(LOCAL_KEYS.PATIENTS, patients), [patients]);
  useEffect(() => saveToStorage(LOCAL_KEYS.TASKS, tasks), [tasks]);
  useEffect(() => saveToStorage(LOCAL_KEYS.APPTS, appointments), [appointments]);

  // Keyboard shortcut: focus search on '/'
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Filtering, searching, sorting
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
      const valA = a[sortBy.key];
      const valB = b[sortBy.key];
      if (valA < valB) return sortBy.dir === "asc" ? -1 : 1;
      if (valA > valB) return sortBy.dir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [patients, debouncedQuery, filters, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]);

  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Helpers: CSV export
  function exportCSV() {
    const rows = ["Name,Age,Gender,Condition,Last Visit"].concat(
      patients.map((p) => `${p.name},${p.age},${p.gender},${p.condition},${p.lastVisit}`)
    );
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patients_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Patient CRUD
  function handleSavePatient(updated) {
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === updated.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      }
      return [{ ...updated, id: Date.now() }, ...prev];
    });
    setEditingPatient(null);
  }

  function handleDeletePatient(id) {
    if (!confirm("Delete patient record? This action cannot be undone.")) return;
    setPatients((prev) => prev.filter((p) => p.id !== id));
    setSelectedPatient(null);
  }

  // Tasks
  function toggleTaskDone(id) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function addTask(text) {
    setTasks((prev) => [{ id: Date.now(), task: text, done: false }, ...prev]);
  }

  // Appointments
  function addAppointment(payload) {
    setAppointments((prev) => [{ id: Date.now(), ...payload }, ...prev]);
    setShowAddAppt(false);
  }

  // Small quick statistics for charts
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

  // Inline small toast
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <header className="flex items-center justify-between p-4 bg-white shadow sticky top-0 z-50">
        <div className="flex items-center gap-2 w-full max-w-2xl">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, conditions, age...  (press / to focus)"
            className="w-full outline-none bg-transparent text-sm"
          />
          <button
            onClick={() => {
              setQuery("");
              setDebouncedQuery("");
            }}
            className="text-xs text-gray-500"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="p-2 bg-indigo-50 rounded-lg flex items-center gap-2 text-indigo-600"
            onClick={() => {
              setShowAddAppt(true);
            }}
            title="Add appointment"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Appointment</span>
          </button>

          <button
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
            onClick={exportCSV}
            title="Export patients"
          >
            <Download className="w-4 h-4 text-gray-600" />
          </button>

          <Bell className="w-6 h-6 text-gray-600 cursor-pointer hover:text-indigo-600" />
          <img
            src="https://randomuser.me/api/portraits/men/32.jpg"
            alt="doctor"
            className="w-10 h-10 rounded-full border"
          />
        </div>
      </header>

      <main className="p-6 flex-1 space-y-6">
        {/* Title + quick summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Stethoscope className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Doctor Dashboard</h1>
              <p className="text-sm text-gray-500">Interactive, persistent, and keyboard friendly</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white p-3 rounded-2xl shadow flex items-center gap-3">
              <Users className="w-5 h-5 text-indigo-500" />
              <div>
                <div className="text-xs text-gray-500">Total Patients</div>
                <div className="font-semibold">{patients.length}</div>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl shadow flex items-center gap-3">
              <Calendar className="w-5 h-5 text-pink-500" />
              <div>
                <div className="text-xs text-gray-500">Appointments</div>
                <div className="font-semibold">{appointments.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="bg-white shadow rounded-2xl p-5 flex items-center gap-4 transition"
            >
              <div className="p-3 bg-gray-100 rounded-xl">{s.icon}</div>
              <div>
                <h3 className="text-sm text-gray-500">{s.label}</h3>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Appointments This Week</h3>
              <div className="text-sm text-gray-500">Interactive</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={appointments.map((a) => ({ day: new Date(a.time).toLocaleDateString(), count: 1 }))}>
                <defs>
                  <linearGradient id="colorAppt2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" hide />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorAppt2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white shadow rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Patients Demographics</h3>
              <div className="text-sm text-gray-500">Live</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={demographics} dataKey="value" nameKey="name" outerRadius={80} label>
                  {demographics.map((entry, index) => (
                    <Cell key={index} fill={["#4f46e5", "#ec4899", "#10b981"][index % 3]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conditions + activity */}
        <div className="bg-white shadow rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Conditions Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conditionCounts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="condition" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Controls: filters, sort, quick export */}
        <div className="bg-white shadow rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => setFilters((s) => ({ ...s, gender: e.target.value }))}
                className="p-2 rounded bg-gray-50 border"
              >
                <option>All</option>
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Condition</label>
              <select
                value={filters.condition}
                onChange={(e) => setFilters((s) => ({ ...s, condition: e.target.value }))}
                className="p-2 rounded bg-gray-50 border"
              >
                <option>All</option>
                {Array.from(new Set(patients.map((p) => p.condition))).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500">Sort</label>
              <select
                value={`${sortBy.key}_${sortBy.dir}`}
                onChange={(e) => {
                  const [key, dir] = e.target.value.split("_");
                  setSortBy({ key, dir });
                }}
                className="p-2 rounded bg-gray-50 border"
              >
                <option value="name_asc">Name ↑</option>
                <option value="name_desc">Name ↓</option>
                <option value="age_asc">Age ↑</option>
                <option value="age_desc">Age ↓</option>
                <option value="lastVisit_desc">Last Visit ↓</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setFilters({ gender: "All", condition: "All" });
                setQuery("");
                setSortBy({ key: "name", dir: "asc" });
                setToast("Filters reset");
              }}
              className="px-3 py-2 text-sm bg-gray-50 rounded border"
            >
              Reset
            </button>

            <button onClick={exportCSV} className="px-3 py-2 bg-indigo-600 text-white rounded">
              Export CSV
            </button>
          </div>
        </div>

        {/* Patients table + actions */}
        <div className="bg-white shadow rounded-2xl p-5 overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" /> Patients Records
            </h3>
            <div className="text-sm text-gray-500">Showing {filtered.length} results</div>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
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
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 flex items-center gap-2">
                    <img src={p.photo} alt={p.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-gray-500">{p.history.slice(0, 2).join(" • ")}</div>
                    </div>
                  </td>
                  <td className="p-3">{p.age}</td>
                  <td className="p-3">{p.gender}</td>
                  <td className="p-3">{p.condition}</td>
                  <td className="p-3">{p.lastVisit}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => setSelectedPatient(p)}
                      className="p-2 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingPatient(p)}
                      className="p-2 bg-yellow-100 text-yellow-600 rounded hover:bg-yellow-200"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePatient(p.id)}
                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-50 rounded">Prev</button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 bg-gray-50 rounded">Next</button>
            </div>
          </div>
        </div>

        {/* Tasks + Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><ClipboardCheck className="w-5 h-5 text-indigo-500"/> Doctor’s Tasks</h3>
            <div className="space-y-3">
              {tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className={t.done ? "line-through text-gray-400" : "text-gray-700"}>{t.task}</div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={t.done} onChange={() => toggleTaskDone(t.id)} className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input id="newTask" className="flex-1 p-2 rounded border" placeholder="Add task and press Enter" onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  addTask(e.currentTarget.value.trim());
                  e.currentTarget.value = "";
                  setToast("Task added");
                }
              }} />
            </div>
          </div>

          <div className="bg-white shadow rounded-2xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-indigo-500"/> Recent Activity</h3>
            <div className="relative border-l-2 border-indigo-200 pl-6 space-y-6">
              {appointments.slice(0,6).map((a, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-3 w-6 h-6 bg-indigo-600 rounded-full border-4 border-white"></div>
                  <div>
                    <p className="text-sm text-gray-500">{new Date(a.time).toLocaleString()}</p>
                    <p className="text-gray-700">{a.patient} — {a.condition} {a.urgent ? "(urgent)" : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* View patient modal */}
      <AnimatePresence>
        {selectedPatient && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg relative" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <button onClick={() => setSelectedPatient(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X/></button>
              <div className="flex items-center gap-4 mb-4">
                <img src={selectedPatient.photo} alt={selectedPatient.name} className="w-16 h-16 rounded-full" />
                <div>
                  <h2 className="text-xl font-bold">{selectedPatient.name}</h2>
                  <p className="text-gray-500">{selectedPatient.age} • {selectedPatient.gender}</p>
                  <p className="text-sm text-indigo-600 font-semibold">Condition: {selectedPatient.condition}</p>
                </div>
              </div>
              <h3 className="font-semibold mb-2">Medical History</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {selectedPatient.history.map((h, idx) => (<li key={idx}>{h}</li>))}
              </ul>

              <div className="mt-4 flex gap-2">
                <button onClick={() => { setEditingPatient(selectedPatient); setSelectedPatient(null); }} className="px-3 py-2 bg-yellow-100 text-yellow-600 rounded">Edit</button>
                <button onClick={() => handleDeletePatient(selectedPatient.id)} className="px-3 py-2 bg-red-100 text-red-600 rounded">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit/Create patient modal */}
      <AnimatePresence>
        {editingPatient !== null && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-lg relative" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <button onClick={() => setEditingPatient(null)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X/></button>

              <PatientForm patient={editingPatient} onSave={handleSavePatient} onCancel={() => setEditingPatient(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add appointment modal */}
      <AnimatePresence>
        {showAddAppt && (
          <motion.div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <button onClick={() => setShowAddAppt(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X/></button>
              <AddAppointmentForm onAdd={addAppointment} onCancel={() => setShowAddAppt(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 bg-indigo-600 text-white px-4 py-2 rounded shadow">{toast}</div>
      )}
    </div>
  );
}

// ----------------- Small components -----------------
function PatientForm({ patient, onSave, onCancel }) {
  const [form, setForm] = useState({ ...(patient || { name: "", age: "", gender: "Male", condition: "", lastVisit: new Date().toISOString().slice(0,10), photo: "https://randomuser.me/api/portraits/lego/1.jpg", history: [] }) });
  useEffect(() => setForm({ ...(patient || { name: "", age: "", gender: "Male", condition: "", lastVisit: new Date().toISOString().slice(0,10), photo: "https://randomuser.me/api/portraits/lego/1.jpg", history: [] }) }), [patient]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{patient ? "Edit Patient" : "New Patient"}</h2>
      <div className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
        <div className="flex gap-2">
          <input className="flex-1 p-2 border rounded" placeholder="Age" value={form.age} onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))} />
          <select className="p-2 border rounded" value={form.gender} onChange={(e) => setForm((s) => ({ ...s, gender: e.target.value }))}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <input className="w-full p-2 border rounded" placeholder="Condition" value={form.condition} onChange={(e) => setForm((s) => ({ ...s, condition: e.target.value }))} />
        <input className="w-full p-2 border rounded" type="date" value={form.lastVisit} onChange={(e) => setForm((s) => ({ ...s, lastVisit: e.target.value }))} />
        <textarea className="w-full p-2 border rounded" placeholder="History (comma separated)" value={form.history.join(", ")} onChange={(e) => setForm((s) => ({ ...s, history: e.target.value.split(",").map(x => x.trim()).filter(Boolean) }))} />

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-2 bg-gray-50 rounded">Cancel</button>
          <button onClick={() => onSave({ ...form, id: patient?.id ?? Date.now() })} className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>
  );
}

function AddAppointmentForm({ onAdd, onCancel }) {
  const [payload, setPayload] = useState({ patient: "", time: new Date().toISOString().slice(0,16), condition: "", urgent: false });
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">New Appointment</h2>
      <div className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Patient name" value={payload.patient} onChange={(e) => setPayload((s) => ({ ...s, patient: e.target.value }))} />
        <input className="w-full p-2 border rounded" type="datetime-local" value={payload.time} onChange={(e) => setPayload((s) => ({ ...s, time: e.target.value }))} />
        <input className="w-full p-2 border rounded" placeholder="Condition" value={payload.condition} onChange={(e) => setPayload((s) => ({ ...s, condition: e.target.value }))} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={payload.urgent} onChange={(e) => setPayload((s) => ({ ...s, urgent: e.target.checked }))} /> Mark as urgent</label>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-2 bg-gray-50 rounded">Cancel</button>
          <button onClick={() => onAdd(payload)} className="px-3 py-2 bg-indigo-600 text-white rounded">Add</button>
        </div>
      </div>
    </div>
  );
}
