// src/pages/doctors/patients.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  RefreshCw,
  Activity,
  Pill,
  Stethoscope,
  User,
  Calendar,
  FileText,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Thermometer,
  Gauge,
  ClipboardList,
  X,
  Shield,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  AlertTriangle,
  Sparkles,
  FolderDown,
  FolderUp,
  Trash2,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* --------------------------- Local Storage Utils --------------------------- */
const LS = { PTS_V3: "dd_patients_v3", PTS_V2: "dd_patients_v2" };
const load = (k, f) => {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : f;
  } catch {
    return f;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

/* ----------------------------- Helper Functions ---------------------------- */
const dateISO = (d) => new Date(d).toISOString().slice(0, 10);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const uid = () => Math.random().toString(36).slice(2, 9);
const genMediId = () => `MEDI-${Math.random().toString(36).toUpperCase().slice(2, 6)}-${Math.random().toString(36).toUpperCase().slice(2, 6)}`;
const ageBand = (age) => (age < 18 ? "Child" : age < 40 ? "Adult" : age < 60 ? "Middle" : "Senior");
const calcBMI = (kg, cm) => (kg && cm ? +(kg / (cm / 100) ** 2).toFixed(1) : null);

/* Simple rules-based insights */
function insightsFor(p) {
  const tips = [];
  const lastBP = p.vitals?.slice(-1)[0];
  const bmi = calcBMI(p?.body?.weight, p?.body?.height);
  if (lastBP?.bp >= 140) tips.push("Elevated BP trend — monitor and consider medication adjustment.");
  if (bmi && bmi >= 30) tips.push(`BMI ${bmi} (Obese). Counsel on diet/exercise; screen for metabolic risks.`);
  if (p.allergies?.length) tips.push(`Allergies noted: ${p.allergies.join(", ")}.`);
  if ((p.meds || []).some((m) => /steroid/i.test(m.name))) tips.push("Steroid usage detected — track glucose, BP, bone health.");
  if ((p.labs || []).some((l) => l.name.toLowerCase().includes("hb1") || l.name.toLowerCase().includes("hba1c"))) {
    const lastA1c = [...p.labs].reverse().find((l) => /hba1c|hb1/i.test(l.name));
    if (lastA1c && parseFloat(lastA1c.value) >= 6.5) tips.push(`HbA1c ${lastA1c.value}${lastA1c.unit}. Diabetes threshold met — review plan.`);
  }
  if (!p.insurance?.provider) tips.push("No insurance on file — verify coverage to prevent delays.");
  if (!p.emergencyContact?.phone) tips.push("Missing emergency contact — add one.");
  if (!tips.length) tips.push("No obvious risks — continue routine follow-up.");
  return tips;
}

/* ------------------------------- Seed Data -------------------------------- */
const seedPatients = [
  {
    id: 1,
    mediId: genMediId(),
    name: "John Doe",
    age: 42,
    gender: "Male",
    phone: "+91 90000 11111",
    email: "john.d@example.com",
    address: "OPD-2, Main Wing",
    condition: "Hypertension",
    tags: ["chronic", "cardio"],
    lastVisit: "2025-09-20",
    doctor: "Dr. Varghese GT",
    body: { height: 174, weight: 84 }, // cm, kg
    vitals: [
      { date: "2025-09-01", bp: 130, pulse: 78 },
      { date: "2025-09-10", bp: 140, pulse: 80 },
      { date: "2025-09-20", bp: 135, pulse: 76 },
    ],
    meds: [
      { name: "Amlodipine 5mg", dose: "5mg", freq: "OD", start: "2025-08-12" },
      { name: "Aspirin 75mg", dose: "75mg", freq: "OD", start: "2025-08-12" },
    ],
    allergies: ["Penicillin"],
    notes: "Blood pressure improving with current regimen.",
    history: [
      { date: "2025-08-12", diagnosis: "Hypertension", action: "Started medication" },
      { date: "2025-09-20", diagnosis: "Follow-up", action: "Dose adjusted" },
    ],
    labs: [
      { date: "2025-09-18", name: "HbA1c", value: "6.8", unit: "%" },
      { date: "2025-08-28", name: "Lipid Profile LDL", value: "142", unit: "mg/dL" },
    ],
    imaging: [{ date: "2025-07-02", name: "Chest X-ray", result: "No acute findings" }],
    procedures: [{ date: "2025-04-11", name: "ECG", result: "Sinus tachycardia" }],
    insurance: { provider: "HDFC Ergo", id: "HDFC-99821", validity: "2026-03-31" },
    emergencyContact: { name: "Anna Doe", phone: "+91 90000 22222" },
    consents: [{ name: "Data Sharing", date: "2025-05-01", status: "Given" }],
    attachments: [],
  },
  {
    id: 2,
    mediId: genMediId(),
    name: "Anita Sharma",
    age: 29,
    gender: "Female",
    phone: "+91 95555 22222",
    email: "anita.s@example.com",
    address: "City Clinic, OPD-1",
    condition: "Asthma",
    tags: ["pulmo"],
    lastVisit: "2025-10-04",
    doctor: "Dr. Saniya Ruth",
    body: { height: 160, weight: 52 },
    vitals: [
      { date: "2025-09-12", bp: 118, pulse: 70 },
      { date: "2025-09-30", bp: 116, pulse: 72 },
      { date: "2025-10-04", bp: 120, pulse: 74 },
    ],
    meds: [{ name: "Budesonide Inhaler", dose: "200mcg", freq: "BD", start: "2024-12-01" }],
    allergies: [],
    notes: "Seasonal triggers. Educated on spacer technique.",
    history: [{ date: "2025-10-04", diagnosis: "Asthma follow-up", action: "No change" }],
    labs: [],
    imaging: [{ date: "2025-09-01", name: "Spirometry", result: "Mild obstruction" }],
    procedures: [],
    insurance: { provider: "", id: "", validity: "" },
    emergencyContact: { name: "", phone: "" },
    consents: [],
    attachments: [],
  },
  {
    id: 3,
    mediId: genMediId(),
    name: "Rahul Iyer",
    age: 64,
    gender: "Male",
    phone: "+91 98888 33333",
    email: "rahul.iyer@example.com",
    address: "Ward-3, Bed-12",
    condition: "Type-2 Diabetes",
    tags: ["endocrine", "chronic"],
    lastVisit: "2025-10-07",
    doctor: "Dr. Varghese GT",
    body: { height: 168, weight: 86 },
    vitals: [
      { date: "2025-09-14", bp: 145, pulse: 84 },
      { date: "2025-09-28", bp: 150, pulse: 82 },
      { date: "2025-10-07", bp: 148, pulse: 86 },
    ],
    meds: [
      { name: "Metformin 500mg", dose: "500mg", freq: "BD", start: "2023-05-01" },
      { name: "Atorvastatin 10mg", dose: "10mg", freq: "HS", start: "2024-01-10" },
    ],
    allergies: ["Sulfa"],
    notes: "Foot care education. Eye exam pending.",
    history: [
      { date: "2025-07-20", diagnosis: "T2DM Poor control", action: "Diet + exercise plan" },
      { date: "2025-10-07", diagnosis: "Follow-up", action: "Add DPP4 if A1c > 7 next test" },
    ],
    labs: [{ date: "2025-09-30", name: "HbA1c", value: "7.4", unit: "%" }],
    imaging: [],
    procedures: [],
    insurance: { provider: "Star Health", id: "STAR-77888", validity: "2026-01-31" },
    emergencyContact: { name: "Meera Iyer", phone: "+91 98888 44444" },
    consents: [{ name: "Surgery Consent", date: "2025-02-11", status: "Given" }],
    attachments: [],
  },
];

/* --------------------------- Patient Management Page --------------------------- */
export default function PatientsPage() {
  // Back-compat loader: prefer v3; if absent, try v2 then save as v3
  const [patients, setPatients] = useState(() => {
    const v3 = load(LS.PTS_V3, null);
    if (Array.isArray(v3)) return v3;
    const v2 = load(LS.PTS_V2, null);
    if (Array.isArray(v2)) {
      save(LS.PTS_V3, v2);
      return v2;
    }
    save(LS.PTS_V3, seedPatients);
    return seedPatients;
  });

  const [search, setSearch] = useState(""); // supports "id:MEDI-XXXX"
  const [genderFilter, setGenderFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All"); // All | HighBP | NoInsurance | Senior
  const [ageFilter, setAgeFilter] = useState("All"); // All | Child | Adult | Middle | Senior
  const [sortBy, setSortBy] = useState("Last Visit"); // Name | Last Visit | Age
  const [selected, setSelected] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const fileInputRef = useRef(null);

  // Live reload
  useEffect(() => {
    const onFocus = () => setPatients(load(LS.PTS_V3, []));
    window.addEventListener("focus", onFocus);
    const iv = setInterval(onFocus, 4000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(iv);
    };
  }, []);

  // Derived list
  const filtered = useMemo(() => {
    let list = [...patients];

    // Search by mediId or name/condition/doctor
    const q = search.trim();
    if (q) {
      if (q.toLowerCase().startsWith("id:")) {
        const key = q.slice(3).trim().toLowerCase();
        list = list.filter((p) => (p.mediId || "").toLowerCase().includes(key));
      } else {
        const s = q.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(s) ||
            (p.condition || "").toLowerCase().includes(s) ||
            (p.doctor || "").toLowerCase().includes(s) ||
            (p.mediId || "").toLowerCase().includes(s)
        );
      }
    }

    if (genderFilter !== "All") list = list.filter((p) => p.gender === genderFilter);
    if (ageFilter !== "All") list = list.filter((p) => ageBand(p.age) === ageFilter);

    if (riskFilter !== "All") {
      list = list.filter((p) => {
        if (riskFilter === "HighBP") {
          const last = p.vitals?.slice(-1)[0];
          return last?.bp >= 140;
        }
        if (riskFilter === "NoInsurance") return !p.insurance?.provider;
        if (riskFilter === "Senior") return p.age >= 60;
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === "Name") return a.name.localeCompare(b.name);
      if (sortBy === "Age") return b.age - a.age;
      // Last Visit (default)
      return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
    });

    return list;
  }, [patients, search, genderFilter, riskFilter, ageFilter, sortBy]);

  /* ------------------------------- Exporters -------------------------------- */
  const exportListCSV = () => {
    const rows = [
      ["Medi ID", "Name", "Age", "Gender", "Condition", "Last Visit", "Doctor", "Phone", "Email", "Insurance"],
      ...filtered.map((p) => [
        p.mediId || "",
        p.name,
        p.age,
        p.gender,
        p.condition || "",
        p.lastVisit || "",
        p.doctor || "",
        p.phone || "",
        p.email || "",
        p.insurance?.provider || "",
      ]),
    ];
    const csv = rows.map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `patients_${dateISO(new Date())}.csv`;
    a.click();
  };

  const exportPatientJSON = (p) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(p.name || "patient").replace(/\s+/g, "_")}_${p.mediId || p.id}.json`;
    a.click();
  };

  const importPatientsJSON = async (file) => {
    const txt = await file.text();
    try {
      const data = JSON.parse(txt);
      if (Array.isArray(data)) {
        const merged = mergePatients(patients, data);
        setPatients(merged);
        save(LS.PTS_V3, merged);
      } else if (data && typeof data === "object") {
        const merged = mergePatients(patients, [data]);
        setPatients(merged);
        save(LS.PTS_V3, merged);
      }
    } catch {}
  };

  function mergePatients(oldList, newList) {
    const map = new Map(oldList.map((p) => [p.mediId || p.id, p]));
    for (const p of newList) {
      const key = p.mediId || p.id || genMediId();
      map.set(key, { ...map.get(key), ...p, mediId: key });
    }
    return [...map.values()];
  }

  /* ------------------------------ CRUD: Editor ------------------------------ */
  const emptyPatient = {
    id: null,
    mediId: genMediId(),
    name: "",
    age: 30,
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    condition: "",
    tags: [],
    lastVisit: dateISO(new Date()),
    doctor: "Dr. Varghese GT",
    body: { height: 170, weight: 70 },
    vitals: [],
    meds: [],
    allergies: [],
    notes: "",
    history: [],
    labs: [],
    imaging: [],
    procedures: [],
    insurance: { provider: "", id: "", validity: "" },
    emergencyContact: { name: "", phone: "" },
    consents: [],
    attachments: [],
  };

  const openAdd = () => {
    setEditing({ ...emptyPatient, id: Date.now() });
    setEditorOpen(true);
  };
  const openEdit = (p) => {
    setEditing(JSON.parse(JSON.stringify(p)));
    setEditorOpen(true);
  };
  const saveEdit = () => {
    if (!editing?.name) return;
    let list = [...patients];
    const idx = list.findIndex((x) => (x.mediId || x.id) === (editing.mediId || editing.id));
    if (idx >= 0) list[idx] = editing;
    else list.unshift(editing);
    setPatients(list);
    save(LS.PTS_V3, list);
    setEditorOpen(false);
  };
  const removePatient = (p) => {
    if (!confirm(`Delete ${p.name}? This cannot be undone.`)) return;
    const list = patients.filter((x) => (x.mediId || x.id) !== (p.mediId || p.id));
    setPatients(list);
    save(LS.PTS_V3, list);
    setSelected(null);
  };

  /* ------------------------------- UI Render -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b shadow flex items-center justify-between px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <h1 className="text-lg sm:text-xl font-bold">Patients</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportListCSV}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white flex items-center gap-2"
            title="Export current list as CSV"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={openAdd}
            className="px-3 py-2 rounded-lg bg-emerald-600 text-white flex items-center gap-2"
            title="Add new patient"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </header>

      {/* Search + Filters */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4">
        <div className="bg-white rounded-xl border shadow p-3 sm:p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                className="border p-2 rounded-lg flex-1"
                placeholder="Search by name / doctor / condition, or type id:MEDI-XXXX to jump by Medi ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select className="p-2 rounded-lg border" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                {["All", "Male", "Female", "Other"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <select className="p-2 rounded-lg border" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
                {["All", "Child", "Adult", "Middle", "Senior"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <select className="p-2 rounded-lg border" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
                {["All", "HighBP", "NoInsurance", "Senior"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <select className="p-2 rounded-lg border" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {["Last Visit", "Name", "Age"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pb-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <motion.div
            key={p.mediId || p.id}
            layout
            onClick={() => setSelected(p)}
            className="bg-white border shadow-sm rounded-xl p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-lg">{p.name}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{p.mediId}</span>
                </div>
                <div className="text-sm text-gray-600">{p.condition}</div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Last visit: {p.lastVisit || "—"}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(p.tags || []).map((t, i) => (
                    <span key={i} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                  {(!p.insurance?.provider) && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">No Insurance</span>}
                  {p.age >= 60 && <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">Senior</span>}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center opacity-60 py-10 col-span-full">No patients found.</div>
        )}
      </div>

      {/* Patient Detail Modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto p-5 relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-xl">{selected.name}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{selected.mediId}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                      {selected.gender}, {selected.age}y
                    </span>
                    {selected.body?.height && selected.body?.weight && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        BMI {calcBMI(selected.body.weight, selected.body.height)}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selected.condition || "—"} &middot; {selected.doctor || "—"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                    {selected.phone && (<span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {selected.phone}</span>)}
                    {selected.email && (<span className="inline-flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {selected.email}</span>)}
                    {selected.address && (<span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {selected.address}</span>)}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => openEdit(selected)}
                      className="px-3 py-1.5 rounded-lg border bg-white flex items-center gap-2 text-sm"
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => removePatient(selected)}
                      className="px-3 py-1.5 rounded-lg border bg-white text-rose-600 flex items-center gap-2 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="mt-4 bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/60 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <div className="font-semibold">AI-style Insights</div>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {insightsFor(selected).map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>

              {/* Sections */}
              <div className="grid lg:grid-cols-2 gap-4 mt-4">
                {/* Vitals */}
                <Card title="Vitals Trend" icon={<Activity className="w-4 h-4" />}>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selected.vitals || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="bp" stroke="#6366F1" name="BP" />
                        <Line type="monotone" dataKey="pulse" stroke="#10B981" name="Pulse" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <QuickVitalForm
                      onAdd={(v) => {
                        const list = patients.map((p) =>
                          (p.mediId || p.id) === (selected.mediId || selected.id)
                            ? { ...p, vitals: [...(p.vitals || []), v] }
                            : p
                        );
                        setPatients(list);
                        save(LS.PTS_V3, list);
                        setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                      }}
                    />
                  </div>
                </Card>

                {/* Medical History */}
                <Card title="Medical History" icon={<ClipboardList className="w-4 h-4" />}>
                  <ul className="divide-y text-sm">
                    {(selected.history || []).map((h, i) => (
                      <li key={i} className="py-2">
                        <div className="font-medium">{h.date}</div>
                        <div>{h.diagnosis || "—"}</div>
                        <div className="text-xs text-gray-500">{h.action || "—"}</div>
                      </li>
                    ))}
                    {(!selected.history || !selected.history.length) && <div className="py-2 opacity-60">No history</div>}
                  </ul>
                  <QuickHistoryForm
                    onAdd={(row) => {
                      const list = patients.map((p) =>
                        (p.mediId || p.id) === (selected.mediId || selected.id)
                          ? { ...p, history: [...(p.history || []), row] }
                          : p
                      );
                      setPatients(list); save(LS.PTS_V3, list);
                      setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                    }}
                  />
                </Card>

                {/* Medications */}
                <Card title="Medications" icon={<Pill className="w-4 h-4" />}>
                  <ul className="text-sm space-y-1">
                    {(selected.meds || []).map((m, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-gray-500">({m.dose} · {m.freq})</span>
                        {m.start && <span className="text-xs text-gray-400">since {m.start}</span>}
                      </li>
                    ))}
                    {(!selected.meds || !selected.meds.length) && <div className="opacity-60">No medications</div>}
                  </ul>
                  <QuickMedForm
                    onAdd={(row) => {
                      const list = patients.map((p) =>
                        (p.mediId || p.id) === (selected.mediId || selected.id)
                          ? { ...p, meds: [...(p.meds || []), row] }
                          : p
                      );
                      setPatients(list); save(LS.PTS_V3, list);
                      setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                    }}
                  />
                </Card>

                {/* Allergies & Consents */}
                <Card title="Allergies & Consents" icon={<Shield className="w-4 h-4" />}>
                  <div className="text-sm">
                    <div className="mb-2 font-medium">Allergies</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(selected.allergies || []).map((a, i) => (
                        <span key={i} className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">{a}</span>
                      ))}
                      {(!selected.allergies || !selected.allergies.length) && <span className="opacity-60">None</span>}
                    </div>
                    <QuickAllergyForm
                      onAdd={(a) => {
                        const list = patients.map((p) =>
                          (p.mediId || p.id) === (selected.mediId || selected.id)
                            ? { ...p, allergies: [...(p.allergies || []), a] }
                            : p
                        );
                        setPatients(list); save(LS.PTS_V3, list);
                        setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                      }}
                    />
                    <div className="mt-4 mb-2 font-medium">Consents</div>
                    <ul className="text-sm space-y-1">
                      {(selected.consents || []).map((c, i) => (
                        <li key={i}>{c.name} — {c.status} ({c.date})</li>
                      ))}
                      {(!selected.consents || !selected.consents.length) && <div className="opacity-60">No consents</div>}
                    </ul>
                  </div>
                </Card>

                {/* Labs & Imaging */}
                <Card title="Labs" icon={<Gauge className="w-4 h-4" />}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2">Date</th><th>Test</th><th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.labs || []).map((l, i) => (
                        <tr key={i} className="border-b last:border-none">
                          <td className="py-2">{l.date}</td>
                          <td>{l.name}</td>
                          <td>{l.value}{l.unit ? ` ${l.unit}` : ""}</td>
                        </tr>
                      ))}
                      {(!selected.labs || !selected.labs.length) && (
                        <tr><td colSpan={3} className="py-3 opacity-60">No labs</td></tr>
                      )}
                    </tbody>
                  </table>
                  <QuickLabForm
                    onAdd={(row) => {
                      const list = patients.map((p) =>
                        (p.mediId || p.id) === (selected.mediId || selected.id)
                          ? { ...p, labs: [...(p.labs || []), row] }
                          : p
                      );
                      setPatients(list); save(LS.PTS_V3, list);
                      setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                    }}
                  />
                </Card>

                <Card title="Imaging & Procedures" icon={<BarChart3 className="w-4 h-4" />}>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <div className="font-medium mb-1">Imaging</div>
                      <ul className="text-sm list-disc pl-5">
                        {(selected.imaging || []).map((im, i) => (
                          <li key={i}>{im.date} — {im.name}: <span className="text-gray-600">{im.result}</span></li>
                        ))}
                        {(!selected.imaging || !selected.imaging.length) && <div className="opacity-60">No imaging</div>}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Procedures</div>
                      <ul className="text-sm list-disc pl-5">
                        {(selected.procedures || []).map((pr, i) => (
                          <li key={i}>{pr.date} — {pr.name}: <span className="text-gray-600">{pr.result}</span></li>
                        ))}
                        {(!selected.procedures || !selected.procedures.length) && <div className="opacity-60">No procedures</div>}
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Insurance & Emergency */}
                <Card title="Insurance & Emergency" icon={<Shield className="w-4 h-4" />}>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-medium">Insurance</div>
                      <div>Provider: {selected.insurance?.provider || "—"}</div>
                      <div>ID: {selected.insurance?.id || "—"}</div>
                      <div>Valid till: {selected.insurance?.validity || "—"}</div>
                    </div>
                    <div>
                      <div className="font-medium">Emergency Contact</div>
                      <div>Name: {selected.emergencyContact?.name || "—"}</div>
                      <div>Phone: {selected.emergencyContact?.phone || "—"}</div>
                    </div>
                  </div>
                </Card>

                {/* Notes & Attachments */}
                <Card title="Doctor Notes" icon={<FileText className="w-4 h-4" />}>
                  <textarea
                    className="w-full border rounded-lg p-2 text-sm"
                    rows={5}
                    value={selected.notes || ""}
                    onChange={(e) => {
                      const list = patients.map((p) =>
                        (p.mediId || p.id) === (selected.mediId || selected.id) ? { ...p, notes: e.target.value } : p
                      );
                      setPatients(list); save(LS.PTS_V3, list);
                      setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                    }}
                  />
                  <QuickNoteSnippet setText={(txt) => {
                    const list = patients.map((p) =>
                      (p.mediId || p.id) === (selected.mediId || selected.id) ? { ...p, notes: (p.notes || "") + (p.notes ? "\n" : "") + txt } : p
                    );
                    setPatients(list); save(LS.PTS_V3, list);
                    setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                  }} />
                </Card>

                <Card title="Attachments" icon={<FolderUp className="w-4 h-4" />}>
                  <AttachmentUploader
                    items={selected.attachments || []}
                    onAdd={(att) => {
                      const list = patients.map((p) =>
                        (p.mediId || p.id) === (selected.mediId || selected.id)
                          ? { ...p, attachments: [...(p.attachments || []), att] }
                          : p
                      );
                      setPatients(list); save(LS.PTS_V3, list);
                      setSelected(list.find((x) => (x.mediId || x.id) === (selected.mediId || selected.id)));
                    }}
                  />
                </Card>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor Modal */}
      <AnimatePresence>
        {editorOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-5 relative"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <button onClick={() => setEditorOpen(false)} className="absolute top-3 right-3 p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                <X className="w-4 h-4" />
              </button>
              <div className="font-semibold text-lg mb-3">{editing?.id ? "Edit Patient" : "New Patient"}</div>
              {editing && (
                <div className="grid md:grid-cols-2 gap-3 text-sm">
                  <Text label="Medi ID" value={editing.mediId} onChange={(v) => setEditing({ ...editing, mediId: v })} />
                  <Text label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                  <Number label="Age" value={editing.age} onChange={(v) => setEditing({ ...editing, age: v })} />
                  <Select label="Gender" value={editing.gender} options={["Male", "Female", "Other"]} onChange={(v) => setEditing({ ...editing, gender: v })} />
                  <Text label="Phone" value={editing.phone} onChange={(v) => setEditing({ ...editing, phone: v })} />
                  <Text label="Email" value={editing.email} onChange={(v) => setEditing({ ...editing, email: v })} />
                  <Text label="Address" value={editing.address} onChange={(v) => setEditing({ ...editing, address: v })} />
                  <Text label="Condition" value={editing.condition} onChange={(v) => setEditing({ ...editing, condition: v })} />
                  <Text label="Doctor" value={editing.doctor} onChange={(v) => setEditing({ ...editing, doctor: v })} />
                  <Text label="Last Visit (YYYY-MM-DD)" value={editing.lastVisit} onChange={(v) => setEditing({ ...editing, lastVisit: v })} />
                  <Number label="Height (cm)" value={editing.body?.height || ""} onChange={(v) => setEditing({ ...editing, body: { ...editing.body, height: v } })} />
                  <Number label="Weight (kg)" value={editing.body?.weight || ""} onChange={(v) => setEditing({ ...editing, body: { ...editing.body, weight: v } })} />
                  <Text label="Allergies (comma separated)" value={(editing.allergies || []).join(", ")} onChange={(v) => setEditing({ ...editing, allergies: v.split(",").map((x) => x.trim()).filter(Boolean) })} />
                </div>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setEditorOpen(false)} className="px-3 py-1.5 rounded-lg border bg-white">Cancel</button>
                <button onClick={saveEdit} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white">Save</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print styles */}
      <style>{`@media print {
        header, .fixed, .sticky { display:none !important; }
        body { background:white; }
        .shadow { box-shadow:none !important; }
      }`}</style>
    </div>
  );
}

/* ------------------------------ Small Components ------------------------------ */
function Card({ title, icon, children }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-indigo-600">{icon}</span>
        <div className="font-semibold">{title}</div>
      </div>
      {children}
    </div>
  );
}

function Text({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">{label}</span>
      <input value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="border p-2 rounded-lg" />
    </label>
  );
}
function Number({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">{label}</span>
      <input type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value ? +e.target.value : "")} className="border p-2 rounded-lg" />
    </label>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-600">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="border p-2 rounded-lg">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

/* ------------------------------ Quick Forms ------------------------------ */
function QuickVitalForm({ onAdd }) {
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs">BP
        <input className="border p-1 rounded ml-1 w-20" placeholder="mmHg" value={bp} onChange={(e) => setBp(e.target.value)} />
      </label>
      <label className="text-xs">Pulse
        <input className="border p-1 rounded ml-1 w-20" placeholder="bpm" value={pulse} onChange={(e) => setPulse(e.target.value)} />
      </label>
      <button
        className="px-2 py-1 rounded bg-indigo-600 text-white text-xs"
        onClick={() => {
          const v = { date: dateISO(new Date()), bp: +bp || 0, pulse: +pulse || 0 };
          onAdd(v);
          setBp(""); setPulse("");
        }}
      >
        Add Vital
      </button>
    </div>
  );
}
function QuickHistoryForm({ onAdd }) {
  const [diag, setDiag] = useState("");
  const [act, setAct] = useState("");
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <input className="border p-1 rounded w-40 text-sm" placeholder="Diagnosis" value={diag} onChange={(e) => setDiag(e.target.value)} />
      <input className="border p-1 rounded w-56 text-sm" placeholder="Action / Plan" value={act} onChange={(e) => setAct(e.target.value)} />
      <button
        className="px-2 py-1 rounded bg-indigo-600 text-white text-xs"
        onClick={() => { onAdd({ date: dateISO(new Date()), diagnosis: diag, action: act }); setDiag(""); setAct(""); }}
      >
        Add History
      </button>
    </div>
  );
}
function QuickMedForm({ onAdd }) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("OD");
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <input className="border p-1 rounded w-56 text-sm" placeholder="Medication name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="border p-1 rounded w-24 text-sm" placeholder="Dose" value={dose} onChange={(e) => setDose(e.target.value)} />
      <select className="border p-1 rounded text-sm" value={freq} onChange={(e) => setFreq(e.target.value)}>
        {["OD", "BD", "TID", "QID", "HS"].map((x) => <option key={x}>{x}</option>)}
      </select>
      <button
        className="px-2 py-1 rounded bg-indigo-600 text-white text-xs"
        onClick={() => { onAdd({ name, dose, freq, start: dateISO(new Date()) }); setName(""); setDose(""); setFreq("OD"); }}
      >
        Add Med
      </button>
    </div>
  );
}
function QuickAllergyForm({ onAdd }) {
  const [a, setA] = useState("");
  return (
    <div className="flex items-end gap-2">
      <input className="border p-1 rounded text-sm" placeholder="Add allergy..." value={a} onChange={(e) => setA(e.target.value)} />
      <button className="px-2 py-1 rounded bg-indigo-600 text-white text-xs" onClick={() => { if (!a.trim()) return; onAdd(a.trim()); setA(""); }}>Add</button>
    </div>
  );
}
function QuickLabForm({ onAdd }) {
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2">
      <input className="border p-1 rounded w-40 text-sm" placeholder="Test name" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="border p-1 rounded w-24 text-sm" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
      <input className="border p-1 rounded w-20 text-sm" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
      <button
        className="px-2 py-1 rounded bg-indigo-600 text-white text-xs"
        onClick={() => { if (!name) return; onAdd({ date: dateISO(new Date()), name, value, unit }); setName(""); setValue(""); setUnit(""); }}
      >
        Add Lab
      </button>
    </div>
  );
}
function QuickNoteSnippet({ setText }) {
  const templates = [
    "Patient counselled on lifestyle and medication adherence.",
    "Discussed potential side effects; patient verbalized understanding.",
    "Follow-up in 2 weeks with BP logs and fasting labs.",
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {templates.map((t, i) => (
        <button key={i} className="px-2 py-1 rounded border bg-white text-xs" onClick={() => setText(t)}>
          + {t.slice(0, 42)}{t.length > 42 ? "…" : ""}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------ Attachments ------------------------------ */
function AttachmentUploader({ items, onAdd }) {
  const ref = useRef(null);
  return (
    <div>
      <div className="flex items-center gap-2">
        <button onClick={() => ref.current?.click()} className="px-3 py-1.5 rounded-lg border bg-white flex items-center gap-2 text-sm">
          <Upload className="w-4 h-4" /> Upload
        </button>
        <input
          ref={ref}
          type="file"
          className="hidden"
          accept="image/*,application/pdf"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => {
              onAdd({ id: uid(), name: f.name, type: f.type, size: f.size, dataURL: reader.result });
            };
            reader.readAsDataURL(f);
            e.target.value = "";
          }}
        />
      </div>
      <div className="mt-3 grid sm:grid-cols-2 gap-2">
        {items.map((att) => (
          <div key={att.id} className="border rounded-lg p-2 text-xs">
            <div className="font-medium">{att.name}</div>
            <div className="text-gray-500">{att.type} · {(att.size / 1024).toFixed(1)} KB</div>
            {att.type.startsWith("image/") && (
              <img src={att.dataURL} alt={att.name} className="mt-2 rounded border max-h-48 object-contain" />
            )}
            {att.type === "application/pdf" && <div className="mt-2 text-gray-600">[PDF stored]</div>}
          </div>
        ))}
        {!items.length && <div className="opacity-60">No attachments</div>}
      </div>
    </div>
  );
}
