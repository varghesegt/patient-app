// src/pages/doctors/patients.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Plus, Upload, Download, Sparkles, ShieldCheck, Phone, Mail, CalendarPlus,
  AlertTriangle, FileText, HeartPulse, Droplet, Syringe, ClipboardList, MapPin, Building2,
  Stethoscope, ArrowUpDown, ChevronRight, X, CheckCircle2, Copy, Trash2, Link, QrCode, BadgeInfo
} from "lucide-react";

/* ----------------------------- LocalStorage ----------------------------- */
const LS = {
  PATS: "dd_patients_v3",
  APPTS: "dd_appts_v5",
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

/* --------------------------------- Seed --------------------------------- */
const seed = [
  {
    id: 1,
    mediId: "MEDI-AB12-XY34",
    name: "Anna Brown",
    gender: "Female",
    age: 46,
    phone: "+91 98765 11111",
    email: "anna.brown@demo.tld",
    blood: "O+",
    allergies: ["Penicillin"],
    chronic: ["Hypertension"],
    doctor: "Dr. Varghese GT",
    dept: "General Medicine",
    address: "OPD Lane · Room 12",
    tags: ["priority", "follow-up"],
    insurance: { provider: "MediCover", number: "MC-001-778", validTill: "2026-03-31" },
    notes: "Bring old ECG for next visit.",
    visits: [
      { id: "v1", date: "2025-09-16", reason: "Hypertension review", doctor: "Dr. Varghese GT", triage: "High", summary: "BP better; continue meds" },
      { id: "v2", date: "2025-10-08", reason: "Cardiac follow-up", doctor: "Dr. Varghese GT", triage: "High", summary: "ECG advised" },
    ],
  },
  {
    id: 2,
    mediId: "MEDI-ML22-ZZ99",
    name: "Mark Lee",
    gender: "Male",
    age: 34,
    phone: "+91 98765 22222",
    email: "mark.lee@demo.tld",
    blood: "A+",
    allergies: [],
    chronic: [],
    doctor: "Dr. Saniya Ruth",
    dept: "Cardiology",
    address: "OPD Wing B",
    tags: ["new"],
    insurance: { provider: "CareHealth", number: "CH-009-122", validTill: "2025-12-31" },
    notes: "",
    visits: [
      { id: "v3", date: "2025-10-08", reason: "General Checkup", doctor: "Dr. Saniya Ruth", triage: "Low", summary: "" },
    ],
  },
];

/* -------------------------------- Utils --------------------------------- */
const initials = (s="") => s.split(" ").map(p=>p[0]||"").join("").toUpperCase().slice(0,2);
const currency = (n) => new Intl.NumberFormat("en-IN").format(n);
const todayISO = () => new Date().toISOString().slice(0,10);
const fmtDTLocal = (iso) => new Date(iso).toLocaleString();

/* MediID: MEDI-XXXX-YYYY letters+digits */
const genMediId = () => {
  const seg = () => Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g,"").slice(2,6);
  return `MEDI-${seg()}-${seg()}`;
};
const validMediId = (m) => /^MEDI-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(m || "");

/* safe CSV parse */
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { head: [], rows: [] };
  const head = lines[0].match(/("([^"]|"")*"|[^,]+)/g)?.map(h=>h.replace(/^"|"$/g,"").replace(/""/g,'"')) || [];
  const rows = lines.slice(1).map(line => (line.match(/("([^"]|"")*"|[^,]+)/g)||[]).map(c=>c.replace(/^"|"$/g,"").replace(/""/g,'"')));
  return { head, rows };
};
const toCSV = (rows) => {
  const head = ["mediId","name","gender","age","phone","email","blood","allergies","chronic","doctor","dept","address","tags","insurance_provider","insurance_number","insurance_validTill","notes"];
  return [head.join(","), ...rows.map(r=> head.map(h=>{
    const v = h==="allergies" ? (r.allergies||[]).join("|")
      : h==="chronic" ? (r.chronic||[]).join("|")
      : h==="tags" ? (r.tags||[]).join("|")
      : h==="insurance_provider" ? (r.insurance?.provider||"")
      : h==="insurance_number" ? (r.insurance?.number||"")
      : h==="insurance_validTill" ? (r.insurance?.validTill||"")
      : r[h] ?? "";
    return `"${String(v).replace(/"/g,'""')}"`;
  }).join(","))].join("\n");
};

/* --------------------------------- Page --------------------------------- */
export default function PatientsPage() {
  const [patients, setPatients] = useState(() => load(LS.PATS, seed));
  const [q, setQ] = useState("");
  const [debQ, setDebQ] = useState("");
  const [filter, setFilter] = useState({ dept: "All", hasInsurance: "All", chronic: "All" });
  const [sortKey, setSortKey] = useState("name-asc");
  const [drawer, setDrawer] = useState(null); // selected patient
  const [bulk, setBulk] = useState(new Set());
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);
  const linkRef = useRef(null);

  /* persist */
  useEffect(()=>save(LS.PATS, patients), [patients]);

  /* debounced search */
  useEffect(()=>{ const t=setTimeout(()=>setDebQ(q.trim()), 250); return ()=>clearTimeout(t); }, [q]);

  /* Jump-to (from appointments) */
  useEffect(() => {
    const key = "jump_patient_mediId";
    const target = localStorage.getItem(key);
    if (target) {
      const p = patients.find(x => x.mediId === target);
      if (p) setDrawer(p);
      try { localStorage.removeItem(key); } catch {}
    }
    // also allow ?mediId= in URL
    const sp = new URLSearchParams(window.location.search);
    const mid = sp.get("mediId");
    if (mid) {
      const p = patients.find(x => x.mediId === mid);
      if (p) setDrawer(p);
    }
  }, [patients]);

  /* Derived lists */
  const depts = useMemo(()=>["All", ...Array.from(new Set(patients.map(p=>p.dept).filter(Boolean)))], [patients]);
  const chronicCats = useMemo(()=>["All", ...Array.from(new Set(patients.flatMap(p=>p.chronic||[])))], [patients]);

  const filtered = useMemo(() => {
    let list = [...patients];
    if (filter.dept !== "All") list = list.filter(p => p.dept === filter.dept);
    if (filter.hasInsurance !== "All") list = list.filter(p => !!p.insurance === (filter.hasInsurance==="Yes"));
    if (filter.chronic !== "All") list = list.filter(p => (p.chronic||[]).includes(filter.chronic));

    if (debQ) {
      const s = debQ.toLowerCase();
      list = list.filter(p =>
        (p.mediId||"").toLowerCase().includes(s) ||
        (p.name||"").toLowerCase().includes(s) ||
        (p.phone||"").toLowerCase().includes(s) ||
        (p.email||"").toLowerCase().includes(s) ||
        (p.tags||[]).join(" ").toLowerCase().includes(s)
      );
    }

    const [key, dir] = sortKey.split("-");
    list.sort((a,b)=>{
      const vA = key==="age" ? (a.age||0) : key==="visits" ? (a.visits?.length||0) : (a.name||"").toLowerCase();
      const vB = key==="age" ? (b.age||0) : key==="visits" ? (b.visits?.length||0) : (b.name||"").toLowerCase();
      if (vA < vB) return dir==="asc" ? -1 : 1;
      if (vA > vB) return dir==="asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [patients, filter, debQ, sortKey]);

  /* helpers */
  const showToast = (t) => { setToast(t); setTimeout(()=>setToast(null), 2000); };
  const toggleBulk = (id) => setBulk(b => { const nb = new Set(b); nb.has(id) ? nb.delete(id) : nb.add(id); return nb; });
  const bulkClear = () => setBulk(new Set());

  const addPatient = () => {
    const m = genMediId();
    setDrawer({
      id: null, mediId: m, name: "", gender:"", age:"", phone:"", email:"",
      blood:"", allergies:[], chronic:[], doctor:"", dept:"", address:"",
      tags:[], insurance: { provider:"", number:"", validTill:"" }, notes:"", visits:[]
    });
  };

  const savePatient = (p) => {
    if (!p.name || !p.mediId) { showToast("Name & MediID required"); return; }
    if (!validMediId(p.mediId)) { showToast("Invalid MediID format"); return; }
    const dup = patients.find(x => x.mediId === p.mediId && x.id !== p.id);
    if (dup) { showToast("MediID already exists"); return; }
    if (p.id) setPatients(prev => prev.map(x => x.id === p.id ? p : x));
    else setPatients(prev => [{ ...p, id: Date.now() }, ...prev]);
    setDrawer(null); showToast("Saved");
  };

  const delPatient = (id) => {
    if (!confirm("Delete this patient?")) return;
    setPatients(prev => prev.filter(p => p.id !== id));
    setBulk(b => { const nb = new Set(b); nb.delete(id); return nb; });
    if (drawer?.id === id) setDrawer(null);
  };

  const duplicatePatient = (p) => {
    const copy = { ...p, id: Date.now(), mediId: genMediId(), name: `${p.name} (Copy)` };
    setPatients(prev => [copy, ...prev]); showToast("Duplicated");
  };

  /* Merge (select two) */
  const [mergeSel, setMergeSel] = useState([]);
  const startMerge = (p) => {
    setMergeSel(arr => (arr.find(x=>x.id===p.id) ? arr : arr.length<2 ? [...arr, p] : arr));
  };
  const doMerge = () => {
    if (mergeSel.length !== 2) return;
    const [a, b] = mergeSel;
    const base = (a.visits?.length||0) >= (b.visits?.length||0) ? a : b;
    const other = base.id === a.id ? b : a;
    const merged = {
      ...base,
      name: base.name || other.name,
      gender: base.gender || other.gender,
      age: base.age || other.age,
      phone: base.phone || other.phone,
      email: base.email || other.email,
      blood: base.blood || other.blood,
      allergies: Array.from(new Set([...(base.allergies||[]), ...(other.allergies||[])])),
      chronic: Array.from(new Set([...(base.chronic||[]), ...(other.chronic||[])])),
      doctor: base.doctor || other.doctor,
      dept: base.dept || other.dept,
      address: base.address || other.address,
      tags: Array.from(new Set([...(base.tags||[]), ...(other.tags||[])])),
      insurance: base.insurance?.provider ? base.insurance : other.insurance || base.insurance,
      notes: [base.notes, other.notes].filter(Boolean).join(" • "),
      visits: [ ...(base.visits||[]), ...(other.visits||[]) ].sort((x,y)=>x.date.localeCompare(y.date)),
    };
    setPatients(prev => [merged, ...prev.filter(p => p.id !== other.id && p.id !== base.id)]);
    setMergeSel([]); showToast("Merged records");
  };

  /* Import / Export */
  const exportCSV = () => {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type:"text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `patients_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(filtered,null,2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `patients_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  const importCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const { head, rows } = parseCSV(text);
    if (!head.length) return showToast("CSV empty/invalid");
    const idx = (k) => head.findIndex(h => h.toLowerCase() === k.toLowerCase());
    const next = rows.map(cols => {
      const get = (k, d="") => { const i = idx(k); return i>=0 ? cols[i] : d; };
      const allergies = (get("allergies","")||"").split("|").filter(Boolean);
      const chronic = (get("chronic","")||"").split("|").filter(Boolean);
      const tags = (get("tags","")||"").split("|").filter(Boolean);
      const insurance = {
        provider: get("insurance_provider",""),
        number: get("insurance_number",""),
        validTill: get("insurance_validTill",""),
      };
      const mediId = get("mediId","").toUpperCase();
      return {
        id: Date.now()+Math.random(),
        mediId: validMediId(mediId) ? mediId : genMediId(),
        name: get("name",""),
        gender: get("gender",""),
        age: Number(get("age","")) || "",
        phone: get("phone",""),
        email: get("email",""),
        blood: get("blood",""),
        allergies, chronic, doctor: get("doctor",""), dept:get("dept",""), address:get("address",""),
        tags, insurance, notes:get("notes",""),
        visits: [],
      };
    });
    setPatients(prev => [...next, ...prev]);
    showToast("Imported");
  };

  /* Create appointment for patient -> writes to dd_appts_v5 */
  const createAppointment = (patient, minutes=15) => {
    const st = new Date(Date.now()+10*60000).toISOString().slice(0,16);
    const en = addMinutes(st, minutes);
    const appt = {
      id: Date.now(),
      title: "Consultation",
      patient: patient.name,
      mediId: patient.mediId,
      doctor: patient.doctor || "",
      location: patient.dept || "",
      room: patient.dept || "",
      start: st, end: en,
      status:"Pending", stage:"Waiting", triage:"Medium", urgent:false, notes:"", checkedIn:false
    };
    const current = load(LS.APPTS, []);
    save(LS.APPTS, [appt, ...current]);
    showToast("Appointment created");
  };
  const addMinutes = (iso, m) => new Date(new Date(iso).getTime()+m*60000).toISOString().slice(0,16);

  /* Shareable link with ?mediId= */
  const copyLink = (mediId) => {
    const url = `${location.origin}${location.pathname}?mediId=${encodeURIComponent(mediId)}`;
    navigator.clipboard.writeText(url).then(()=>showToast("Link copied"));
  };

  /* Pagination */
  const [page, setPage] = useState(1);
  const perPage = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(()=>{ if(page>pages) setPage(1); }, [pages, page]);
  const pageRows = filtered.slice((page-1)*perPage, page*perPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-zinc-900 dark:to-zinc-950 text-gray-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-zinc-900/70 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div className="max-w-7xl mx-auto p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-sky-600" />
            <div>
              <h1 className="text-2xl font-extrabold">Patients (MediID)</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Access & manage patients by Medi ID · visits · billing</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 w-full sm:w-[380px]">
              <Search size={16} className="text-gray-500" />
              <input
                placeholder="Search by MediID, name, phone, tags…"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
              {q && <button className="text-xs text-gray-500" onClick={()=>setQ("")}>Clear</button>}
            </div>

            <button onClick={addPatient} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm flex items-center gap-2">
              <Plus size={16} /> New Patient
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={exportCSV}
                className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm flex items-center gap-2"
              ><Download size={16}/> Export CSV</button>
              <button
                onClick={exportJSON}
                className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm flex items-center gap-2"
              ><Download size={16}/> Export JSON</button>
              <div className="relative">
                <input type="file" accept=".csv" ref={fileRef} className="hidden"
                  onChange={(e)=>{ const f=e.target.files?.[0]; if(f) importCSV(f); e.target.value=""; }} />
                <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm flex items-center gap-2">
                  <Upload size={16}/> Import
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar Filters */}
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-3 flex flex-wrap gap-2">
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.dept} onChange={(e)=>setFilter(f=>({...f, dept:e.target.value}))}>
            {depts.map(d=><option key={d}>{d}</option>)}
          </select>
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.hasInsurance} onChange={(e)=>setFilter(f=>({...f, hasInsurance:e.target.value}))}>
            {["All","Yes","No"].map(d=><option key={d}>{d}</option>)}
          </select>
          <select className="p-2 rounded-lg bg-white dark:bg-zinc-900 border dark:border-zinc-800" value={filter.chronic} onChange={(e)=>setFilter(f=>({...f, chronic:e.target.value}))}>
            {chronicCats.map(d=><option key={d}>{d}</option>)}
          </select>

          <span className="ml-auto text-sm opacity-70">Sort</span>
          <button onClick={()=>setSortKey(s=>s==="name-asc"?"name-desc":"name-asc")} className="px-2 py-1 rounded border text-sm flex items-center gap-1"><ArrowUpDown size={14}/> Name</button>
          <button onClick={()=>setSortKey(s=>s==="age-asc"?"age-desc":"age-asc")} className="px-2 py-1 rounded border text-sm flex items-center gap-1"><ArrowUpDown size={14}/> Age</button>
          <button onClick={()=>setSortKey(s=>s==="visits-desc"?"visits-asc":"visits-desc")} className="px-2 py-1 rounded border text-sm flex items-center gap-1"><ArrowUpDown size={14}/> Visits</button>
        </div>
      </div>

      {/* Bulk merge bar */}
      {mergeSel.length > 0 && (
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-2 rounded-lg flex flex-wrap gap-2 items-center">
            <div className="text-sm">Merge selected ({mergeSel.length}/2)</div>
            <button onClick={doMerge} disabled={mergeSel.length!==2} className="text-xs px-2 py-1 bg-amber-600 text-white rounded disabled:opacity-50">Merge</button>
            <button onClick={()=>setMergeSel([])} className="text-xs px-2 py-1 bg-white border rounded">Clear</button>
          </div>
        </div>
      )}

      {/* Table + Cards */}
      <div className="max-w-7xl mx-auto p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block p-3">
          <table className="min-w-full text-sm">
            <thead className="bg-sky-50 dark:bg-zinc-800/60">
              <tr>
                <th className="px-3 py-2 text-left">Select</th>
                <th className="px-3 py-2 text-left">Patient</th>
                <th className="px-3 py-2">MediID</th>
                <th className="px-3 py-2">Dept</th>
                <th className="px-3 py-2">Chronic</th>
                <th className="px-3 py-2">Allergies</th>
                <th className="px-3 py-2">Visits</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-zinc-800">
              {pageRows.map(p=>(
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={bulk.has(p.id)} onChange={()=>toggleBulk(p.id)} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold">{initials(p.name)}</div>
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.gender || "—"} · {p.age || "—"} yrs</div>
                        <div className="text-xs text-gray-500">{p.phone || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button className="underline" title="Open" onClick={()=>setDrawer(p)}>{p.mediId}</button>
                  </td>
                  <td className="px-3 py-2 text-center">{p.dept || "—"}</td>
                  <td className="px-3 py-2 text-center">
                    {(p.chronic||[]).length ? p.chronic.join(", ") : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {(p.allergies||[]).length ? p.allergies.join(", ") : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">{p.visits?.length || 0}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={()=>startMerge(p)} className="px-2 py-1 rounded border text-xs">Select for Merge</button>
                      <button onClick={()=>duplicatePatient(p)} className="px-2 py-1 rounded border text-xs">Duplicate</button>
                      <button onClick={()=>setDrawer(p)} className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border text-xs flex items-center gap-1"><ClipboardList size={14}/> Open</button>
                      <button onClick={()=>delPatient(p.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs flex items-center gap-1"><Trash2 size={14}/> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length===0 && (
                <tr><td colSpan={8} className="px-3 py-6 text-center text-gray-500">No patients match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-200 dark:divide-zinc-800">
          {pageRows.map(p=>(
            <div key={p.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold">{initials(p.name)}</div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.gender || "—"} · {p.age || "—"} yrs · {p.dept||"—"}</div>
                    <button className="text-xs underline mt-1" onClick={()=>setDrawer(p)}>{p.mediId}</button>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(p.tags||[]).map(t=><span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px]">{t}</span>)}
                    </div>
                  </div>
                </div>
                <input type="checkbox" checked={bulk.has(p.id)} onChange={()=>toggleBulk(p.id)} />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={()=>startMerge(p)} className="px-2 py-1 rounded border text-xs">Merge</button>
                <button onClick={()=>setDrawer(p)} className="px-2 py-1 rounded border text-xs">Open</button>
                <button onClick={()=>delPatient(p.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs">Delete</button>
              </div>
            </div>
          ))}
          {pageRows.length===0 && <div className="p-6 text-center text-gray-500">No patients match your filters.</div>}
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
      </div>

      {/* Drawer (patient) */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
            <div className="absolute inset-0 bg-black/40" onClick={()=>setDrawer(null)} />
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-full sm:w-[680px] bg-white dark:bg-zinc-900 shadow-xl"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type:"spring", stiffness: 280, damping: 30 }}
            >
              <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-300 font-semibold">
                    {initials(drawer.name || "PT")}
                  </div>
                  <div>
                    <div className="font-semibold">{drawer.name || "New Patient"}</div>
                    <div className="text-xs text-gray-500">{drawer.dept || "—"} · {drawer.doctor || "—"}</div>
                  </div>
                </div>
                <button onClick={()=>setDrawer(null)} className="p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"><X/></button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto h-full">
                {/* Quick actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={()=>copyLink(drawer.mediId)} className="px-3 py-1.5 rounded border text-xs flex items-center gap-1"><Link size={14}/> Copy Link</button>
                  <button onClick={()=>createAppointment(drawer)} className="px-3 py-1.5 rounded bg-emerald-600 text-white text-xs flex items-center gap-1"><CalendarPlus size={14}/> New Appointment</button>
                  <button onClick={()=>duplicatePatient(drawer)} className="px-3 py-1.5 rounded border text-xs">Duplicate</button>
                  <button onClick={()=>delPatient(drawer.id)} className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs flex items-center gap-1"><Trash2 size={14}/> Delete</button>
                </div>

                {/* Identity */}
                <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Medi ID *" value={drawer.mediId} onChange={v=>setDrawer(d=>({...d, mediId:v.toUpperCase()}))}
                         rightAddon={<button className="text-xs px-2 py-1 rounded bg-white dark:bg-zinc-800 border" onClick={()=>setDrawer(d=>({...d, mediId:genMediId()}))}>Generate</button>}
                         hint={validMediId(drawer.mediId) ? "Valid" : "Format: MEDI-XXXX-YYYY"} />
                  <Input label="Full Name *" value={drawer.name} onChange={v=>setDrawer(d=>({...d, name:v}))}/>
                  <Input label="Gender" value={drawer.gender} onChange={v=>setDrawer(d=>({...d, gender:v}))}/>
                  <Input label="Age" type="number" value={drawer.age} onChange={v=>setDrawer(d=>({...d, age:+v||""}))}/>
                  <Input label="Phone" value={drawer.phone} onChange={v=>setDrawer(d=>({...d, phone:v}))} icon={<Phone size={14}/>}/>
                  <Input label="Email" value={drawer.email} onChange={v=>setDrawer(d=>({...d, email:v}))} icon={<Mail size={14}/>}/>
                  <Input label="Department" value={drawer.dept} onChange={v=>setDrawer(d=>({...d, dept:v}))} icon={<Building2 size={14}/>}/>
                  <Input label="Primary Doctor" value={drawer.doctor} onChange={v=>setDrawer(d=>({...d, doctor:v}))} icon={<Stethoscope size={14}/>}/>
                  <Input label="Address / Location" value={drawer.address} onChange={v=>setDrawer(d=>({...d, address:v}))} icon={<MapPin size={14}/>}/>
                </section>

                {/* Health */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Blood Group" value={drawer.blood} onChange={v=>setDrawer(d=>({...d, blood:v}))} icon={<Droplet size={14}/>}/>
                  <TagEditor label="Allergies" icon={<Syringe size={14}/>} value={drawer.allergies||[]} onChange={(t)=>setDrawer(d=>({...d, allergies:t}))}/>
                  <TagEditor label="Chronic" icon={<HeartPulse size={14}/>} value={drawer.chronic||[]} onChange={(t)=>setDrawer(d=>({...d, chronic:t}))}/>
                </section>

                {/* Insurance */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Insurance Provider" value={drawer.insurance?.provider||""} onChange={v=>setDrawer(d=>({...d, insurance:{...(d.insurance||{}), provider:v}}))}/>
                  <Input label="Policy Number" value={drawer.insurance?.number||""} onChange={v=>setDrawer(d=>({...d, insurance:{...(d.insurance||{}), number:v}}))}/>
                  <Input label="Valid Till" type="date" value={drawer.insurance?.validTill||""} onChange={v=>setDrawer(d=>({...d, insurance:{...(d.insurance||{}), validTill:v}}))}/>
                </section>

                {/* Notes */}
                <div>
                  <label className="text-xs font-medium">Notes</label>
                  <textarea rows={3} value={drawer.notes||""} onChange={e=>setDrawer(d=>({...d, notes:e.target.value}))}
                    className="mt-1 w-full p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"/>
                </div>

                {/* Visits */}
                <div className="border rounded-lg dark:border-zinc-800">
                  <div className="px-3 py-2 border-b dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-2"><ClipboardList size={16}/><div className="font-medium text-sm">Visits</div></div>
                    <button onClick={()=>{
                      const v = { id:"v"+Date.now(), date: todayISO(), reason:"Follow-up", doctor: drawer.doctor||"", triage:"Medium", summary:"" };
                      setDrawer(d=>({...d, visits:[v, ...(d.visits||[])]}));
                    }} className="text-xs px-2 py-1 rounded bg-white dark:bg-zinc-900 border">Add Visit</button>
                  </div>
                  <div className="divide-y dark:divide-zinc-800">
                    {(drawer.visits||[]).length===0 ? (
                      <div className="text-sm opacity-70 p-3">No visits recorded.</div>
                    ) : (drawer.visits||[]).map(v=>(
                      <div key={v.id} className="p-3 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                        <input type="date" value={v.date} onChange={e=>setDrawer(d=>({...d, visits:d.visits.map(x=>x.id===v.id?{...x, date:e.target.value}:x)}))} className="p-2 border rounded text-sm dark:border-zinc-800"/>
                        <input value={v.reason} onChange={e=>setDrawer(d=>({...d, visits:d.visits.map(x=>x.id===v.id?{...x, reason:e.target.value}:x)}))} className="p-2 border rounded text-sm dark:border-zinc-800" placeholder="Reason"/>
                        <input value={v.doctor} onChange={e=>setDrawer(d=>({...d, visits:d.visits.map(x=>x.id===v.id?{...x, doctor:e.target.value}:x)}))} className="p-2 border rounded text-sm dark:border-zinc-800" placeholder="Doctor"/>
                        <select value={v.triage||"Medium"} onChange={e=>setDrawer(d=>({...d, visits:d.visits.map(x=>x.id===v.id?{...x, triage:e.target.value}:x)}))} className="p-2 border rounded text-sm dark:border-zinc-800">
                          {["Low","Medium","High","Critical"].map(t=><option key={t}>{t}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>setDrawer(d=>({...d, visits:d.visits.filter(x=>x.id!==v.id)}))} className="px-2 py-1 rounded bg-rose-600 text-white text-xs">Remove</button>
                        </div>
                        <div className="sm:col-span-5">
                          <textarea rows={2} value={v.summary} onChange={e=>setDrawer(d=>({...d, visits:d.visits.map(x=>x.id===v.id?{...x, summary:e.target.value}:x)}))} className="w-full p-2 border rounded text-sm dark:border-zinc-800" placeholder="Summary / notes"/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Save */}
                <div className="flex items-center justify-between">
                  <div className="text-xs opacity-70">Last edit: {fmtDTLocal(new Date().toISOString())}</div>
                  <div className="flex items-center gap-2">
                    <button onClick={()=>setDrawer(null)} className="px-3 py-2 rounded bg-gray-100 dark:bg-zinc-800">Cancel</button>
                    <button onClick={()=>savePatient(drawer)} className="px-3 py-2 rounded bg-emerald-600 text-white flex items-center gap-2"><CheckCircle2 size={16}/> Save</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow max-w-[80vw]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print tweaks */}
      <style>{`@media print { header, .fixed, .sticky { display:none !important; } .shadow { box-shadow:none !important; } body { background:white; } }`}</style>
    </div>
  );
}

/* ---------------------------- Subcomponents ---------------------------- */
function Input({ label, value, onChange, type="text", icon, rightAddon, hint }) {
  return (
    <div>
      <label className="text-xs font-medium">{label}</label>
      <div className="mt-1 flex items-center gap-2 border rounded px-2 py-1.5 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {icon}
        <input type={type} value={value ?? ""} onChange={(e)=>onChange(e.target.value)} className="w-full bg-transparent outline-none text-sm" />
        {rightAddon}
      </div>
      {hint && <div className="text-[11px] mt-1 opacity-70">{hint}</div>}
    </div>
  );
}
function TagEditor({ label, icon, value=[], onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v=input.trim(); if(!v) return; onChange(Array.from(new Set([...(value||[]), v]))); setInput(""); };
  return (
    <div>
      <label className="text-xs font-medium flex items-center gap-2">{icon}{label}</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {(value||[]).map(t=>(
          <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-xs flex items-center gap-1">
            {t}
            <button onClick={()=>onChange(value.filter(x=>x!==t))} className="opacity-70 hover:opacity-100"><X size={12}/></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input value={input} onChange={e=>setInput(e.target.value)} className="p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex-1" placeholder={`Add ${label.toLowerCase()}`}/>
        <button onClick={add} className="px-3 py-2 rounded bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-sm">Add</button>
      </div>
    </div>
  );
}
