// src/pages/admin/doctors.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Users, Search, Filter, Download, Upload, SlidersHorizontal, Sun, Moon, Sparkles,
  CheckCircle2, XCircle, ShieldCheck, FileText, Phone, Mail, Building2, Stethoscope, BadgeCheck,
  Star, CalendarDays, Clock, MoreHorizontal, PenSquare, Trash2, Eye, X, ArrowUpDown, AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell
} from "recharts";

/* ========================== LocalStorage helpers ========================== */
const LS = {
  DOCTORS: "admin_doctors_v2",
  PREFS: "admin_doctors_prefs_v1",
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

/* =============================== Seed data =============================== */
const seedDoctors = [
  {
    id: 101,
    name: "Dr. Saniya Ruth",
    dept: "Cardiology",
    specialty: "Interventional Cardiology",
    status: "Active",      // Active | On Leave | Suspended
    rating: 4.8,
    fee: 1200,
    phone: "+91 98765 00123",
    email: "saniya.ruth@hospital.tld",
    tags: ["Senior", "Echo", "Cathlab"],
    verified: true,
    license: "KMC/2020/1112",
    weekly: {
      Mon: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "18:00" }],
      Tue: [{ start: "10:00", end: "13:00" }],
      Wed: [{ start: "11:00", end: "14:00" }],
      Thu: [{ start: "10:00", end: "13:00" }, { start: "16:00", end: "18:00" }],
      Fri: [{ start: "10:00", end: "12:30" }],
      Sat: [],
      Sun: [],
    },
    appointmentsWeek: 32,
    bio: "Over 12 years in interventional cardiology. Focus on complex PCI.",
  },
  {
    id: 102,
    name: "Dr. Varghese GT",
    dept: "General Medicine",
    specialty: "Internal Medicine",
    status: "Active",
    rating: 4.5,
    fee: 800,
    phone: "+91 98765 00234",
    email: "varghese.gt@hospital.tld",
    tags: ["Diabetes", "Hypertension"],
    verified: true,
    license: "KMC/2016/7752",
    weekly: {
      Mon: [{ start: "09:30", end: "12:30" }],
      Tue: [{ start: "09:30", end: "12:30" }, { start: "15:00", end: "17:00" }],
      Wed: [],
      Thu: [{ start: "09:30", end: "12:00" }],
      Fri: [{ start: "10:00", end: "13:00" }],
      Sat: [{ start: "10:00", end: "12:00" }],
      Sun: [],
    },
    appointmentsWeek: 24,
    bio: "General internist with focus on chronic disease management.",
  },
  {
    id: 103,
    name: "Dr. Meera Patil",
    dept: "Neurology",
    specialty: "Stroke & Epilepsy",
    status: "On Leave",
    rating: 4.6,
    fee: 1400,
    phone: "+91 98765 00345",
    email: "meera.patil@hospital.tld",
    tags: ["Stroke", "EEG"],
    verified: false,
    license: "MMC/2018/4421",
    weekly: { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
    appointmentsWeek: 0,
    bio: "Neurologist; acute stroke protocols and EEG clinics.",
  },
  {
    id: 104,
    name: "Dr. Rahul Jain",
    dept: "Orthopedics",
    specialty: "Arthroscopy",
    status: "Active",
    rating: 4.2,
    fee: 1100,
    phone: "+91 98765 00456",
    email: "rahul.jain@hospital.tld",
    tags: ["Sports", "Knee"],
    verified: true,
    license: "DMC/2015/1983",
    weekly: {
      Mon: [{ start: "11:00", end: "13:00" }],
      Tue: [],
      Wed: [{ start: "15:00", end: "18:00" }],
      Thu: [{ start: "11:00", end: "13:00" }],
      Fri: [],
      Sat: [{ start: "10:00", end: "12:00" }],
      Sun: [],
    },
    appointmentsWeek: 18,
    bio: "Orthopedic surgeon, arthroscopy & sports injuries.",
  },
];

/* =============================== Utilities =============================== */
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const statusColors = {
  Active: "bg-emerald-100 text-emerald-700",
  "On Leave": "bg-amber-100 text-amber-700",
  Suspended: "bg-rose-100 text-rose-700",
};
const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7", "#14b8a6", "#ef4444", "#8b5cf6"];

const useDebounced = (v, ms = 260) => {
  const [d, setD] = useState(v); useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]); return d;
};
const initials = (name) => name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
const currency = (n) => new Intl.NumberFormat("en-IN").format(n);

/* ================================ Page =================================== */
export default function AdminDoctorsPage() {
  const [docs, setDocs] = useState(() => load(LS.DOCTORS, seedDoctors));
  const [theme, setTheme] = useState(() => load(LS.PREFS, { theme: "auto", density: "comfortable", sort: "name-asc" }).theme);
  const [density, setDensity] = useState(() => load(LS.PREFS, { theme: "auto", density: "comfortable", sort: "name-asc" }).density);
  const [sortKey, setSortKey] = useState(() => load(LS.PREFS, { theme: "auto", density: "comfortable", sort: "name-asc" }).sort);
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 250);

  const [filter, setFilter] = useState({ dept: "All", spec: "All", status: "All", verified: "All" });
  const [drawer, setDrawer] = useState(null); // doctor or null
  const [bulk, setBulk] = useState(new Set());
  const fileRef = useRef(null);

  // Theme apply
  useEffect(() => {
    const isDark = theme === "dark" || (theme === "auto" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
  }, [theme]);

  // Persist
  useEffect(() => save(LS.DOCTORS, docs), [docs]);
  useEffect(() => save(LS.PREFS, { theme, density, sort: sortKey }), [theme, density, sortKey]);

  /* -------- Derived filters/sorts -------- */
  const depts = useMemo(() => ["All", ...Array.from(new Set(docs.map(d => d.dept)))], [docs]);
  const specs = useMemo(() => ["All", ...Array.from(new Set(docs.map(d => d.specialty)))], [docs]);

  const filtered = useMemo(() => {
    let list = [...docs];
    if (filter.dept !== "All") list = list.filter(d => d.dept === filter.dept);
    if (filter.spec !== "All") list = list.filter(d => d.specialty === filter.spec);
    if (filter.status !== "All") list = list.filter(d => d.status === filter.status);
    if (filter.verified !== "All") list = list.filter(d => d.verified === (filter.verified === "Verified"));
    if (dq) {
      const s = dq.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(s) ||
        d.specialty.toLowerCase().includes(s) ||
        d.dept.toLowerCase().includes(s) ||
        d.email.toLowerCase().includes(s) ||
        d.tags.join(" ").toLowerCase().includes(s));
    }
    // Sort
    const [key, dir] = sortKey.split("-");
    list.sort((a, b) => {
      const vA = key === "rating" ? a.rating : key === "appointments" ? a.appointmentsWeek : key === "fee" ? a.fee : a.name.toLowerCase();
      const vB = key === "rating" ? b.rating : key === "appointments" ? b.appointmentsWeek : key === "fee" ? b.fee : b.name.toLowerCase();
      if (vA < vB) return dir === "asc" ? -1 : 1;
      if (vA > vB) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [docs, dq, filter, sortKey]);

  // Pagination
  const [page, setPage] = useState(1);
  const perPage = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(() => { if (page > pages) setPage(1); }, [filtered.length, pages, page]);
  const pageRows = filtered.slice((page - 1) * perPage, page * perPage);

  // KPIs
  const active = filtered.filter(d => d.status === "Active").length;
  const onLeave = filtered.filter(d => d.status === "On Leave").length;
  const avgRating = filtered.length ? (filtered.reduce((s, d) => s + d.rating, 0) / filtered.length).toFixed(2) : 0;
  const weeklyAppts = filtered.reduce((s, d) => s + (d.appointmentsWeek || 0), 0);

  const toggleBulk = (id) => setBulk((b) => { const nb = new Set(b); nb.has(id) ? nb.delete(id) : nb.add(id); return nb; });
  const bulkClear = () => setBulk(new Set());

  /* -------- Import / Export -------- */
  const toCSV = (rows) => {
    const header = ["id","name","dept","specialty","status","rating","fee","phone","email","tags","verified","license","appointmentsWeek"];
    const lines = [header.join(","),
      ...rows.map(r => header.map(h => JSON.stringify(
        h === "tags" ? r.tags?.join("|") : r[h] ?? ""
      )).join(","))];
    return lines.join("\n");
  };
  const exportCSV = () => {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `doctors_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  const importCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return;
    const head = lines[0].split(",").map(h => h.replace(/(^"|"$)/g, "").trim().toLowerCase());
    const idx = (k) => head.findIndex(h => h === k);
    const next = lines.slice(1).map(row => {
      const cols = row.match(/("([^"]|"")*"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"')) || [];
      const pick = (k, def="") => { const i = idx(k); return i >= 0 ? cols[i] : def; };
      const tags = pick("tags","").split("|").filter(Boolean);
      return {
        id: Number(pick("id")) || Date.now()+Math.random(),
        name: pick("name"),
        dept: pick("dept"),
        specialty: pick("specialty"),
        status: pick("status") || "Active",
        rating: Number(pick("rating")) || 0,
        fee: Number(pick("fee")) || 0,
        phone: pick("phone"),
        email: pick("email"),
        tags,
        verified: /true|1|yes/i.test(pick("verified")),
        license: pick("license"),
        weekly: { Mon:[],Tue:[],Wed:[],Thu:[],Fri:[],Sat:[],Sun:[] }, // schedule not in CSV
        appointmentsWeek: Number(pick("appointmentsweek")) || 0,
        bio: "",
      };
    });
    setDocs(prev => [...next, ...prev]);
  };

  /* -------- Actions -------- */
  const openNew = () => setDrawer({
    id: null, name: "", dept: "", specialty: "", status: "Active", rating: 4.5, fee: 1000,
    phone: "", email: "", tags: [], verified: false, license: "", bio: "",
    weekly: { Mon:[],Tue:[],Wed:[],Thu:[],Fri:[],Sat:[],Sun:[] }, appointmentsWeek: 0
  });
  const openEdit = (d) => setDrawer(JSON.parse(JSON.stringify(d))); // deep-ish copy
  const saveDrawer = (data) => {
    if (!data.name || !data.dept || !data.specialty) return alert("Name, Department and Specialty are required.");
    if (data.id) setDocs(prev => prev.map(x => x.id === data.id ? data : x));
    else setDocs(prev => [{ ...data, id: Date.now() }, ...prev]);
    setDrawer(null);
  };
  const del = (id) => {
    if (!confirm("Delete this doctor?")) return;
    setDocs(prev => prev.filter(d => d.id !== id));
    setBulk(b => { const nb = new Set(b); nb.delete(id); return nb; });
  };
  const setStatus = (id, status) => setDocs(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  const toggleVerify = (id) => setDocs(prev => prev.map(d => d.id === id ? { ...d, verified: !d.verified } : d));

  const bulkAction = (fn) => {
    if (bulk.size === 0) return;
    setDocs(prev => prev.map(d => bulk.has(d.id) ? fn(d) : d));
    bulkClear();
  };

  // Analytics data
  const apptData = useMemo(() => filtered.map(d => ({ name: d.name.split(" ")[1] || d.name, appts: d.appointmentsWeek })), [filtered]);
  const statusPie = useMemo(() => {
    const map = { Active:0, "On Leave":0, Suspended:0 };
    filtered.forEach(d => { map[d.status] = (map[d.status]||0)+1; });
    return Object.entries(map).map(([name,value]) => ({ name, value }));
  }, [filtered]);

  const compact = density === "compact";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-zinc-900 dark:to-zinc-950 text-gray-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-zinc-900/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className={`max-w-7xl mx-auto p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between`}>
          <div className="flex items-center gap-3">
            <Users className="text-sky-600" />
            <div>
              <h1 className="text-2xl font-extrabold">Doctors Admin</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Manage doctors · Schedules · Verification</p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 w-full sm:w-[360px]">
              <Search size={16} className="text-gray-500 dark:text-zinc-400" />
              <input
                placeholder="Search name / dept / specialty / tags / email…"
                value={q}
                onChange={e=>setQ(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
              {q && <button className="text-xs text-gray-500" onClick={()=>setQ("")}>Clear</button>}
            </div>

            <button onClick={openNew} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm flex items-center gap-2">
              <UserPlus size={16} /> Add Doctor
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={()=>setTheme(t => t==="dark"?"light":t==="light"?"auto":"dark")}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex items-center gap-2"
                title="Toggle theme"
              >
                {theme === "dark" ? <Moon size={16}/> : theme === "light" ? <Sun size={16}/> : <Sparkles size={16}/>}
                {theme.toUpperCase()}
              </button>
              <button
                onClick={()=>setDensity(d=>d==="compact"?"comfortable":"compact")}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex items-center gap-2"
                title="Toggle density"
              >
                <SlidersHorizontal size={16}/> {density==="compact"?"Compact":"Comfortable"}
              </button>
              <button onClick={exportCSV} className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm flex items-center gap-2">
                <Download size={16}/> Export
              </button>
              <div className="relative">
                <input type="file" accept=".csv" ref={fileRef} className="hidden"
                  onChange={(e)=>{ const f=e.target.files?.[0]; if(f) importCSV(f); e.target.value=""; }} />
                <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm flex items-center gap-2">
                  <Upload size={16}/> Import
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-8">
        {/* KPI cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi icon={<CheckCircle2 className="text-emerald-600" />} label="Active" value={active} />
          <Kpi icon={<AlertTriangle className="text-amber-500" />} label="On Leave" value={onLeave} />
          <Kpi icon={<Star className="text-yellow-500" />} label="Avg Rating" value={avgRating} />
          <Kpi icon={<CalendarDays className="text-sky-600" />} label="Weekly Appts" value={weeklyAppts} />
        </section>

        {/* Filters + Sort */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow p-4 flex flex-wrap gap-2 items-center">
          <Filter className="text-gray-500" size={16}/>
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.dept} onChange={e=>setFilter(f=>({...f, dept:e.target.value}))}>
            {depts.map(d=><option key={d}>{d}</option>)}
          </select>
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.spec} onChange={e=>setFilter(f=>({...f, spec:e.target.value}))}>
            {specs.map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.status} onChange={e=>setFilter(f=>({...f, status:e.target.value}))}>
            {["All","Active","On Leave","Suspended"].map(s=><option key={s}>{s}</option>)}
          </select>
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.verified} onChange={e=>setFilter(f=>({...f, verified:e.target.value}))}>
            {["All","Verified","Unverified"].map(s=><option key={s}>{s}</option>)}
          </select>

          <span className="ml-auto text-sm opacity-70">Sort</span>
          <button
            onClick={()=>setSortKey(s=>s==="name-asc"?"name-desc":"name-asc")}
            className="px-2 py-1 rounded border text-sm flex items-center gap-1"
          ><ArrowUpDown size={14}/> Name</button>
          <button
            onClick={()=>setSortKey(s=>s==="rating-desc"?"rating-asc":"rating-desc")}
            className="px-2 py-1 rounded border text-sm flex items-center gap-1"
          ><ArrowUpDown size={14}/> Rating</button>
          <button
            onClick={()=>setSortKey(s=>s==="appointments-desc"?"appointments-asc":"appointments-desc")}
            className="px-2 py-1 rounded border text-sm flex items-center gap-1"
          ><ArrowUpDown size={14}/> Appointments</button>
          <button
            onClick={()=>setSortKey(s=>s==="fee-desc"?"fee-asc":"fee-desc")}
            className="px-2 py-1 rounded border text-sm flex items-center gap-1"
          ><ArrowUpDown size={14}/> Fee</button>
        </section>

        {/* Bulk bar */}
        {bulk.size > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-2 rounded-lg flex flex-wrap gap-2 items-center">
            <div className="text-sm">Selected: {bulk.size}</div>
            <button onClick={()=>bulkAction(d=>({ ...d, status:"Active"}))} className="text-xs px-2 py-1 bg-emerald-600 text-white rounded">Activate</button>
            <button onClick={()=>bulkAction(d=>({ ...d, status:"On Leave"}))} className="text-xs px-2 py-1 bg-amber-600 text-white rounded">Mark Leave</button>
            <button onClick={()=>bulkAction(d=>({ ...d, status:"Suspended"}))} className="text-xs px-2 py-1 bg-rose-600 text-white rounded">Suspend</button>
            <button onClick={()=>{
              if(!confirm("Delete selected doctors?")) return;
              setDocs(prev=>prev.filter(d=>!bulk.has(d.id))); bulkClear();
            }} className="text-xs px-2 py-1 bg-gray-900 text-white rounded">Delete</button>
            <button onClick={()=>{
              const rows = docs.filter(d=>bulk.has(d.id));
              const blob = new Blob([rows.length?rows.map(r=>r.name).join("\n"):""],{type:"text/plain"});
              const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="selected.txt"; a.click(); URL.revokeObjectURL(a.href);
            }} className="text-xs px-2 py-1 bg-white border rounded">Export Names</button>
            <button onClick={bulkClear} className="text-xs px-2 py-1 bg-white border rounded">Clear</button>
          </div>
        )}

        {/* Table / Cards */}
        <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow overflow-hidden">
          {/* Desktop table */}
          <div className={`${compact?"p-3":"p-4"} hidden md:block`}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-zinc-800/60">
                <tr>
                  <th className="px-3 py-2 text-left">Select</th>
                  <th className="px-3 py-2 text-left">Doctor</th>
                  <th className="px-3 py-2">Dept</th>
                  <th className="px-3 py-2">Specialty</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Rating</th>
                  <th className="px-3 py-2">Weekly Appts</th>
                  <th className="px-3 py-2">Fee</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pageRows.map(d=>(
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={bulk.has(d.id)} onChange={()=>toggleBulk(d.id)} />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold">{initials(d.name)}</div>
                        <div>
                          <div className="font-medium">{d.name}</div>
                          <div className="text-xs text-gray-500">{d.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{d.dept}</td>
                    <td className="px-3 py-2 text-center">{d.specialty}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[d.status]}`}>{d.status}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="text-yellow-500" size={14}/><span>{d.rating}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{d.appointmentsWeek}</td>
                    <td className="px-3 py-2 text-center">₹ {currency(d.fee)}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={()=>toggleVerify(d.id)} className="px-2 py-1 rounded border text-xs flex items-center gap-1">
                          {d.verified ? <ShieldCheck size={14} className="text-emerald-600"/> : <ShieldCheck size={14} className="text-gray-400"/>}
                          {d.verified ? "Verified" : "Verify"}
                        </button>
                        <button onClick={()=>openEdit(d)} className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border text-xs flex items-center gap-1"><PenSquare size={14}/> Edit</button>
                        <button onClick={()=>del(d.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs flex items-center gap-1"><Trash2 size={14}/> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageRows.length===0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-gray-500">No doctors match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            {pageRows.map(d=>(
              <div key={d.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold">{initials(d.name)}</div>
                    <div>
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-xs text-gray-500">{d.specialty} · {d.dept}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {d.tags.map(t=><span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px]">{t}</span>)}
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" checked={bulk.has(d.id)} onChange={()=>toggleBulk(d.id)} />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[d.status]}`}>{d.status}</span>
                  <span className="text-xs flex items-center gap-1"><Star size={12} className="text-yellow-500"/>{d.rating}</span>
                  <span className="text-xs">Appts: {d.appointmentsWeek}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={()=>toggleVerify(d.id)} className="px-2 py-1 rounded border text-xs flex items-center gap-1">
                    <ShieldCheck size={12}/> {d.verified?"Verified":"Verify"}
                  </button>
                  <button onClick={()=>openEdit(d)} className="px-2 py-1 rounded border text-xs">Edit</button>
                  <button onClick={()=>del(d.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs">Delete</button>
                </div>
              </div>
            ))}
            {pageRows.length===0 && <div className="p-6 text-center text-gray-500">No doctors match your filters.</div>}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-zinc-800/60">
            <div className="text-xs opacity-70">Showing {(page-1)*perPage+1}-{Math.min(page*perPage, filtered.length)} of {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-2 py-1 rounded border text-xs disabled:opacity-40">Prev</button>
              <div className="text-xs">Page {page} / {pages}</div>
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} className="px-2 py-1 rounded border text-xs disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>

        {/* Analytics */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Appointments per Doctor (This Week)</h3>
            </div>
            <div style={{ width:"100%", height:320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={apptData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="currentColor" tick={{ fill:"currentColor" }} />
                  <YAxis stroke="currentColor" tick={{ fill:"currentColor" }} />
                  <Tooltip content={<BarTip />} />
                  <Bar dataKey="appts" stroke="#0ea5e9" fill="#0ea5e9" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow p-4">
            <h3 className="font-semibold mb-2">Status Mix</h3>
            <div style={{ width:"100%", height:320 }}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie dataKey="value" data={statusPie} cx="50%" cy="50%" outerRadius={110} label>
                    {statusPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip content={<PieTip/>}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={()=>setDrawer(null)} />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[560px] bg-white dark:bg-zinc-900 shadow-xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type:"spring", stiffness: 280, damping: 30 }}
            >
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold">
                    {initials(drawer.name || "DR")}
                  </div>
                  <div>
                    <div className="font-semibold">{drawer.name || "New Doctor"}</div>
                    <div className="text-xs text-gray-500">{drawer.specialty || "—"} · {drawer.dept || "—"}</div>
                  </div>
                </div>
                <button onClick={()=>setDrawer(null)} className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"><X/></button>
              </div>

              {/* Form */}
              <div className="p-4 space-y-4 overflow-y-auto h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Name *" value={drawer.name} onChange={v=>setDrawer(d=>({...d, name:v}))}/>
                  <Input label="License" value={drawer.license} onChange={v=>setDrawer(d=>({...d, license:v}))} icon={<BadgeCheck size={14}/>}/>
                  <Input label="Department *" value={drawer.dept} onChange={v=>setDrawer(d=>({...d, dept:v}))} icon={<Building2 size={14}/>}/>
                  <Input label="Specialty *" value={drawer.specialty} onChange={v=>setDrawer(d=>({...d, specialty:v}))} icon={<Stethoscope size={14}/>}/>
                  <Input label="Consultation Fee (₹)" type="number" value={drawer.fee} onChange={v=>setDrawer(d=>({...d, fee:+v||0}))}/>
                  <Input label="Rating" type="number" step="0.1" value={drawer.rating} onChange={v=>setDrawer(d=>({...d, rating:Math.min(5, Math.max(0, +v||0))}))} />
                  <Input label="Phone" value={drawer.phone} onChange={v=>setDrawer(d=>({...d, phone:v}))} icon={<Phone size={14}/>}/>
                  <Input label="Email" value={drawer.email} onChange={v=>setDrawer(d=>({...d, email:v}))} icon={<Mail size={14}/>}/>
                </div>

                <div>
                  <label className="text-xs font-medium">Tags</label>
                  <TagEditor
                    value={drawer.tags||[]}
                    onChange={(tags)=>setDrawer(d=>({...d, tags}))}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium">Bio / Notes</label>
                  <textarea rows={3} value={drawer.bio||""} onChange={e=>setDrawer(d=>({...d, bio:e.target.value}))}
                    className="mt-1 w-full p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"/>
                </div>

                <div className="flex items-center gap-2">
                  <select value={drawer.status} onChange={e=>setDrawer(d=>({...d, status:e.target.value}))}
                    className="p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm">
                    {["Active","On Leave","Suspended"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={drawer.verified||false} onChange={e=>setDrawer(d=>({...d, verified:e.target.checked}))}/>
                    Verified
                  </label>
                </div>

                {/* Availability */}
                <div className="border rounded-lg dark:border-zinc-800">
                  <div className="px-3 py-2 border-b dark:border-zinc-800 flex items-center gap-2">
                    <Clock size={16}/><div className="font-medium text-sm">Weekly Availability</div>
                  </div>
                  <ScheduleEditor
                    value={drawer.weekly || { Mon:[],Tue:[],Wed:[],Thu:[],Fri:[],Sat:[],Sun:[] }}
                    onChange={(weekly)=>setDrawer(d=>({...d, weekly}))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button onClick={()=>setDrawer(null)} className="px-3 py-2 rounded bg-gray-100 dark:bg-zinc-800">Cancel</button>
                  <div className="flex items-center gap-2">
                    {drawer.id && (
                      <>
                        <button onClick={()=>setStatus(drawer.id, drawer.status==="Active"?"On Leave":"Active")} className="px-3 py-2 rounded border">
                          {drawer.status==="Active" ? "Mark Leave" : "Activate"}
                        </button>
                        <button onClick={()=>toggleVerify(drawer.id)} className="px-3 py-2 rounded border">{drawer.verified?"Unverify":"Verify"}</button>
                      </>
                    )}
                    <button onClick={()=>saveDrawer(drawer)} className="px-3 py-2 rounded bg-emerald-600 text-white flex items-center gap-2">
                      <CheckCircle2 size={16}/> Save
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================ Subcomponents ============================ */
function Kpi({ icon, label, value }) {
  return (
    <motion.div whileHover={{ scale:1.02 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow p-4">
      <div className="flex items-center justify-between">
        <div className="p-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className="text-sm text-gray-500 dark:text-zinc-400 mt-2">{label}</div>
    </motion.div>
  );
}

function Input({ label, value, onChange, type="text", step, icon }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2 border rounded px-2 py-1.5 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {icon}
        <input
          type={type} step={step} value={value ?? ""} onChange={(e)=>onChange(e.target.value)}
          className="w-full bg-transparent outline-none text-sm"
        />
      </div>
    </div>
  );
}

function TagEditor({ value=[], onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v=input.trim(); if(!v) return; onChange(Array.from(new Set([...(value||[]), v]))); setInput(""); };
  return (
    <div className="mt-1">
      <div className="flex flex-wrap gap-2">
        {(value||[]).map(t=>(
          <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-xs flex items-center gap-1">
            {t}
            <button onClick={()=>onChange(value.filter(x=>x!==t))} className="opacity-70 hover:opacity-100">
              <X size={12}/>
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} className="p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex-1" placeholder="Add tag"/>
        <button onClick={add} className="px-3 py-2 rounded bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-sm">Add</button>
      </div>
    </div>
  );
}

function ScheduleEditor({ value, onChange }) {
  const addSlot = (day) => onChange({ ...value, [day]: [ ...(value[day]||[]), { start:"10:00", end:"12:00" } ] });
  const setSlot = (day, i, field, val) => {
    const next = (value[day]||[]).map((s,idx)=> idx===i?{...s,[field]:val}:s);
    onChange({ ...value, [day]: next });
  };
  const delSlot = (day, i) => onChange({ ...value, [day]: (value[day]||[]).filter((_,idx)=>idx!==i) });

  return (
    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
      {days.map(day=>(
        <div key={day} className="border rounded-lg p-2 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div className="font-medium text-sm">{day}</div>
            <button onClick={()=>addSlot(day)} className="text-xs px-2 py-1 rounded bg-white dark:bg-zinc-900 border dark:border-zinc-800">Add</button>
          </div>
          {(value[day]||[]).length===0 ? (
            <div className="text-xs opacity-60 mt-2">No slots</div>
          ) : (
            <div className="mt-2 space-y-2">
              {value[day].map((s,i)=>(
                <div key={i} className="flex items-center gap-2">
                  <input type="time" value={s.start} onChange={e=>setSlot(day,i,"start",e.target.value)} className="p-1 border rounded text-xs dark:border-zinc-800"/>
                  <span className="text-xs opacity-60">to</span>
                  <input type="time" value={s.end} onChange={e=>setSlot(day,i,"end",e.target.value)} className="p-1 border rounded text-xs dark:border-zinc-800"/>
                  <button onClick={()=>delSlot(day,i)} className="ml-auto text-rose-600 text-xs px-2 py-1 rounded border">Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BarTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3 py-2 shadow">
      <div className="font-medium">{label}</div>
      <div className="text-sky-600 dark:text-sky-300">{p.value} appointments</div>
    </div>
  );
}
function PieTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm px-3 py-2 shadow">
      <div className="font-medium">{p?.name}</div>
      <div className="text-sky-600 dark:text-sky-300">{p?.value}</div>
    </div>
  );
}
