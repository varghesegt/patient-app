
import React, { useEffect, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  Download,
  Plus,
  Search,
  X,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Upload,
  Share2,
  Clock,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Users,
  DoorOpen,
  DoorClosed,
  AlarmClock,
  Save,
  Sparkles,
  FileDown,
} from "lucide-react";

/* ------------------------- localStorage helpers ------------------------- */
const LS = {
  APPTS: "dd_appts_v5",
  WAIT: "dd_waitlist_v1",
  PATS: "dd_patients_v3",
  TPLS: "dd_appt_templates_v1",
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

/* ------------------------------ dummy data ------------------------------ */
const seed = [
  {
    id: 1,
    title: "Cardiac Follow-up",
    patient: "Anna Brown",
    mediId: "MEDI-AB12-XY34",
    doctor: "Dr. Varghese GT",
    location: "OPD-2",
    room: "OPD-2",
    start: "2025-10-08T10:30",
    end: "2025-10-08T11:00",
    status: "Confirmed",
    stage: "Waiting",
    triage: "High",
    urgent: true,
    notes: "Bring old ECG.",
    checkedIn: true,
  },
  {
    id: 2,
    title: "General Checkup",
    patient: "Mark Lee",
    mediId: "MEDI-ML22-ZZ99",
    doctor: "Dr. Saniya Ruth",
    location: "OPD-1",
    room: "OPD-1",
    start: "2025-10-08T12:00",
    end: "2025-10-08T12:20",
    status: "Pending",
    stage: "Waiting",
    triage: "Low",
    urgent: false,
    notes: "",
    checkedIn: false,
  },
];

/* ------------------------------- utils ---------------------------------- */
const fmtDT = (s) => new Date(s);
const durMins = (a, b) => Math.max(0, Math.round((fmtDT(b) - fmtDT(a)) / 60000));
const isSameDay = (a, b = new Date()) => fmtDT(a).toDateString() === fmtDT(b).toDateString();
const withinNextDays = (iso, days) => {
  const d = fmtDT(iso).getTime();
  const now = Date.now();
  const until = now + days * 86400000;
  return d >= now && d <= until;
};
const byStart = (a, b) => fmtDT(a.start) - fmtDT(b.start);
const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
const stages = ["Waiting", "InRoom", "Completed", "Cancelled"];
const triages = ["Low", "Medium", "High", "Critical"];
const addMinutes = (iso, m) => new Date(fmtDT(iso).getTime() + m * 60000).toISOString().slice(0,16);

function relTime(when) {
  const diff = fmtDT(when).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  if (mins < 60) return diff >= 0 ? `in ${mins}m` : `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return diff >= 0 ? `in ${hrs}h` : `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return diff >= 0 ? `in ${days}d` : `${days}d ago`;
}
function hasConflict(a, list, ignoreId) {
  const s1 = fmtDT(a.start).getTime();
  const e1 = fmtDT(a.end).getTime();
  return list.some((b) => {
    if (ignoreId && b.id === ignoreId) return false;
    const s2 = fmtDT(b.start).getTime();
    const e2 = fmtDT(b.end).getTime();
    return Math.max(s1, s2) < Math.min(e1, e2);
  });
}

/* ------------------------------ ICS helpers ----------------------------- */
function icsFor(a) {
  const esc = (t) => String(t || "").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  const dt = (s) => new Date(s).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return [
    "BEGIN:VCALENDAR","VERSION:2.0","CALSCALE:GREGORIAN","PRODID:-//DoctorDesk//Appt//EN","BEGIN:VEVENT",
    `UID:${a.id || Date.now()}@doctor.desk`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(a.start)}`,
    `DTEND:${dt(a.end)}`,
    `SUMMARY:${esc(`${a.title} (${a.patient})`)}`,
    a.room ? `LOCATION:${esc(a.room)}` : "",
    a.notes ? `DESCRIPTION:${esc(a.notes)}` : "",
    "END:VEVENT","END:VCALENDAR"
  ].filter(Boolean).join("\r\n");
}
function downloadICS(filename, text) {
  const blob = new Blob([text], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function exportDayICS(list, dateISO) {
  const body = [
    "BEGIN:VCALENDAR","VERSION:2.0","CALSCALE:GREGORIAN","PRODID:-//DoctorDesk//Day//EN",
    ...list.map(a=>[
      "BEGIN:VEVENT",
      `UID:${a.id}@doctor.desk`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").split(".")[0]}Z`,
      `DTSTART:${new Date(a.start).toISOString().replace(/[-:]/g,"").split(".")[0]}Z`,
      `DTEND:${new Date(a.end).toISOString().replace(/[-:]/g,"").split(".")[0]}Z`,
      `SUMMARY:${(a.title||"").replace(/([,;])/g,"\\$1")}`,
      a.room?`LOCATION:${(a.room||"").replace(/([,;])/g,"\\$1")}`:"",
      "END:VEVENT"
    ].join("\r\n")),
    "END:VCALENDAR"
  ].join("\r\n");
  downloadICS(`agenda_${dateISO}.ics`, body);
}

/* ------------------------------- CSV export ----------------------------- */
function exportCSV(appts) {
  const header = ["Title","Patient","MediID","Doctor","Location","Room","Start","End","Duration(min)","Status","Stage","Triage","Urgent","Notes","CheckedIn"];
  const rows = appts.map((e) => [
    e.title, e.patient, e.mediId||"", e.doctor||"", e.location||"", e.room||"",
    e.start, e.end, durMins(e.start, e.end), e.status, e.stage, e.triage||"",
    e.urgent ? "Yes":"No", (e.notes||"").replace(/\n/g," "), e.checkedIn ? "Yes":"No"
  ]);
  const csv = [header, ...rows].map(r => r.map(x => `"${String(x??"").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `appointments_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* --------------------------------- Page --------------------------------- */
export default function AppointmentsPage() {
  const [appts, setAppts] = useState(() => load(LS.APPTS, seed));
  const [waitlist, setWaitlist] = useState(() => load(LS.WAIT, []));
  const [templates, setTemplates] = useState(() => load(LS.TPLS, [
    { id: "tpl_consult", name: "Consult 15m", minutes: 15, triage: "Medium" },
    { id: "tpl_followup", name: "Follow-up 20m", minutes: 20, triage: "Low" },
    { id: "tpl_emergency", name: "Emergency 30m", minutes: 30, triage: "Critical", urgent: true },
  ]));

  const [query, setQuery] = useState("");
  const [debQ, setDebQ] = useState("");
  const [filter, setFilter] = useState({
    status: "All",
    urgent: "All",
    range: "All",
    triage: "All",
    doctor: "All",
    room: "All",
    from: "",
    to: "",
  });
  const [view, setView] = useState("List"); // List | Today | Insights | Rooms
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [bulk, setBulk] = useState(new Set());
  const fileRef = useRef(null);

  /* debounced search + persistence */
  useEffect(() => { const id = setTimeout(() => setDebQ(query.trim()), 250); return () => clearTimeout(id); }, [query]);
  useEffect(() => { save(LS.APPTS, appts); }, [appts]);
  useEffect(() => { save(LS.WAIT, waitlist); }, [waitlist]);
  useEffect(() => { save(LS.TPLS, templates); }, [templates]);

  /* keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.key.toLowerCase() === "n") openForm();
      if (e.key === "/") { e.preventDefault(); document.getElementById("apptSearch")?.focus(); }
      if (e.key.toLowerCase() === "t") setView("Today");
      if (e.key.toLowerCase() === "l") setView("List");
      if (e.key.toLowerCase() === "r") setView("Rooms");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  /* core actions */
  const openForm = (appt) => { setEditAppt(appt || null); setFormOpen(true); };
  const upsertAppt = (data) => {
    const list = appts.filter((x) => x.id !== (data.id ?? -1));
    if (hasConflict(data, list)) showToast("⚠️ Time conflict with another appointment");
    if (data.id) {
      setAppts((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      showToast("Appointment updated");
    } else {
      setAppts((prev) => [{ ...data, id: Date.now() }, ...prev]);
      showToast("Appointment added");
    }
    setFormOpen(false);
  };
  const addToWaitlist = (w) => {
    setWaitlist(p=>[{ ...w, id: Date.now() }, ...p]);
    setFormOpen(false);
    showToast("Added to waitlist");
  };
  const deleteAppt = (id) => {
    setAppts((p) => p.filter((a) => a.id !== id));
    setBulk((b) => { const nb = new Set(b); nb.delete(id); return nb; });
    showToast("Appointment deleted");
  };
  const duplicateAppt = (a) => {
    const copy = { ...a, id: Date.now(), title: `${a.title} (Copy)` };
    setAppts((p) => [copy, ...p]);
    showToast("Duplicated");
  };
  const setStatus = (id, status) => {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, status, stage: status === "Completed" ? "Completed" : a.stage } : a));
    showToast(`Marked ${status}`);
  };
  const setStage = (id, stage) => {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, stage, checkedIn: stage !== "Waiting" ? true : a.checkedIn } : a));
    showToast(`Stage → ${stage}`);
  };
  const toggleCheckIn = (id) => {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, checkedIn: !a.checkedIn, stage: !a.checkedIn ? "Waiting" : a.stage } : a));
  };
  const nudgeTime = (id, deltaMin) => {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, start: addMinutes(a.start, deltaMin), end: addMinutes(a.end, deltaMin) } : a));
  };
  const snooze = (id, min = 10) => nudgeTime(id, min);

  /* ---------------------- derived filtered list ---------------------- */
  const allDoctors = useMemo(() => ["All", ...Array.from(new Set(appts.map(a => a.doctor).filter(Boolean)))], [appts]);
  const allRooms = useMemo(() => ["All", ...Array.from(new Set(appts.map(a => a.room || a.location).filter(Boolean)))], [appts]);

  const filtered = useMemo(() => {
    let list = [...appts];
    if (filter.status !== "All") list = list.filter((a) => a.status === filter.status);
    if (filter.urgent !== "All") list = list.filter((a) => a.urgent === (filter.urgent === "Urgent"));
    if (filter.triage !== "All") list = list.filter((a) => (a.triage || "Low") === filter.triage);
    if (filter.doctor !== "All") list = list.filter((a) => (a.doctor || "") === filter.doctor);
    if (filter.room !== "All") list = list.filter((a) => (a.room || a.location || "") === filter.room);

    if (filter.range === "Today") list = list.filter((a) => isSameDay(a.start));
    else if (filter.range === "Next7") list = list.filter((a) => withinNextDays(a.start, 7));
    else if (filter.range === "Custom" && filter.from && filter.to) {
      const f = new Date(filter.from).getTime();
      const t = new Date(filter.to).getTime();
      list = list.filter((a) => {
        const s = fmtDT(a.start).getTime();
        return s >= f && s <= t;
      });
    }

    if (debQ) {
      const ql = debQ.toLowerCase();
      list = list.filter((a) =>
        [a.title, a.patient, a.mediId, a.location, a.room, a.notes, a.doctor]
          .some((s) => (s || "").toLowerCase().includes(ql))
      );
    }
    return list.sort(byStart);
  }, [appts, filter, debQ]);

  /* stats */
  const now = Date.now();
  const upcoming = filtered.filter((a) => fmtDT(a.start) > new Date()).length;
  const urgentCount = filtered.filter((a) => a.urgent).length;
  const byStatus = statuses.reduce((acc, s) => (acc[s] = filtered.filter(a => a.status === s).length, acc), {});
  const noShows = filtered.filter(a => fmtDT(a.end).getTime() < now && !a.checkedIn && a.status === "Pending").length;

  /* bulk helpers */
  const toggleBulk = (id) => setBulk((b) => { const nb = new Set(b); nb.has(id) ? nb.delete(id) : nb.add(id); return nb; });
  const bulkAction = (fn, label) => {
    if (bulk.size === 0) return;
    setAppts((p) => p.map((a) => bulk.has(a.id) ? fn(a) : a).filter(Boolean));
    setBulk(new Set());
    showToast(label);
  };

  /* import CSV */
  const handleCSV = async (file, mode = "merge") => {
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return showToast("CSV empty");
    const head = lines[0].split(",").map((h) => h.replace(/(^"|"$)/g, "").trim().toLowerCase());
    const idx = (name) => head.findIndex((h) => h.includes(name));
    const next = lines.slice(1).map((row) => {
      const cols = row.match(/("([^"]|"")*"|[^,]+)/g)?.map(c => c.replace(/^"|"$/g, "").replace(/""/g, '"')) || [];
      const get = (key, def="") => { const i = idx(key); return i >= 0 ? cols[i] : def; };
      const start = get("start"); const end = get("end");
      const dur = start && end ? null : 20; // fallback 20m if missing end
      const st = start || new Date().toISOString().slice(0,16);
      const en = end || addMinutes(st, dur);
      return {
        id: Date.now() + Math.random(),
        title: get("title"),
        patient: get("patient"),
        mediId: get("mediid"),
        doctor: get("doctor"),
        location: get("location"),
        room: get("room") || get("location"),
        start: st,
        end: en,
        status: get("status") || "Pending",
        stage: get("stage") || "Waiting",
        triage: get("triage") || "Low",
        urgent: /yes/i.test(get("urgent")),
        notes: get("notes"),
        checkedIn: /yes/i.test(get("checked")),
      };
    });
    setAppts((prev) => mode === "replace" ? next : [...next, ...prev]);
    showToast(mode === "replace" ? "Imported (replaced)" : "Imported (merged)");
  };

  /* share helpers */
  const shareAppt = async (a) => {
    const text = `Appointment: ${a.title} (${a.patient})
Doctor: ${a.doctor||"—"}
When: ${new Date(a.start).toLocaleString()} - ${new Date(a.end).toLocaleString()}
Where: ${a.room || a.location || "—"}
Status: ${a.status}${a.urgent ? " • URGENT" : ""}
MediID: ${a.mediId || "—"}`;
    try {
      if (navigator.share) await navigator.share({ title: a.title, text });
      else { await navigator.clipboard.writeText(text); showToast("Copied details"); }
    } catch {}
  };

  /* navigation to patient */
  const openPatient = (mediId) => {
    if (!mediId) { showToast("No Medi ID on this appointment"); return; }
    try { localStorage.setItem("jump_patient_mediId", mediId); } catch {}
    if (window?.location) window.location.href = "/doctors/patients";
  };

  /* helpers for advanced modal */
  const suggestNextFreeSlot = (doctor, room, minutes) => {
    const base = [...appts]
      .filter(a => (!doctor || a.doctor===doctor) && (!room || (a.room||a.location)===room))
      .sort(byStart);
    const nowIso = new Date().toISOString().slice(0,16);
    let cursor = nowIso;
    for (const a of base) {
      const cEnd = addMinutes(cursor, minutes || 15);
      const overlap = Math.max(fmtDT(cursor).getTime(), fmtDT(a.start).getTime()) < Math.min(fmtDT(cEnd).getTime(), fmtDT(a.end).getTime());
      if (overlap) { cursor = a.end; }
    }
    return { start: cursor, end: addMinutes(cursor, minutes || 15) };
  };

  /* render helpers */
  const StatusBadge = ({ s }) => (
    <span className={
      "px-2 py-1 rounded text-xs " +
      (s === "Pending" ? "bg-amber-100 text-amber-700" :
       s === "Confirmed" ? "bg-indigo-100 text-indigo-700" :
       s === "Completed" ? "bg-emerald-100 text-emerald-700" :
       "bg-rose-100 text-rose-700")
    }>{s}</span>
  );
  const StageBadge = ({ st }) => (
    <span className={
      "px-2 py-1 rounded text-xs " +
      (st === "Waiting" ? "bg-slate-100 text-slate-700" :
       st === "InRoom" ? "bg-blue-100 text-blue-700" :
       st === "Completed" ? "bg-emerald-100 text-emerald-700" :
       "bg-rose-100 text-rose-700")
    }>{st}</span>
  );
  const TriageBadge = ({ t }) => (
    <span className={
      "px-2 py-0.5 rounded text-[10px] " +
      (t === "Low" ? "bg-slate-100 text-slate-700" :
       t === "Medium" ? "bg-amber-100 text-amber-700" :
       t === "High" ? "bg-orange-100 text-orange-700" :
       "bg-rose-600/10 text-rose-700 border border-rose-200")
    }>{t}</span>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 print:bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 shadow bg-white/90 backdrop-blur p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-lg sm:text-xl font-bold">Appointments</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered)} className="hidden sm:flex px-3 py-2 bg-indigo-600 text-white rounded-lg items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>

          {/* CSV import */}
          <div className="relative">
            <input type="file" accept=".csv" ref={fileRef}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f, "merge"); e.target.value = ""; }}
              className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="hidden sm:flex px-3 py-2 bg-white border rounded-lg items-center gap-2">
              <Upload className="w-4 h-4" /> Import CSV
            </button>
          </div>

          <button onClick={() => openForm()} className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </header>

      {/* View Tabs (mobile scroll) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["List","Today","Rooms","Insights"].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-full text-sm border ${view===v ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"}`}>
              {v}
            </button>
          ))}
          {/* Quick ranges */}
          {["All","Today","Next7"].map(r => (
            <button key={r} onClick={() => setFilter((f)=>({ ...f, range: r }))}
              className={`px-3 py-1.5 rounded-full text-sm border ${filter.range===r ? "bg-gray-900 text-white border-gray-900" : "bg-white"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="max-w-6xl mx-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow"><div className="text-xs sm:text-sm opacity-70">Total (filtered)</div><div className="text-xl sm:text-2xl font-bold">{filtered.length}</div></div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow"><div className="text-xs sm:text-sm opacity-70">Upcoming</div><div className="text-xl sm:text-2xl font-bold">{upcoming}</div></div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow"><div className="text-xs sm:text-sm opacity-70">Urgent</div><div className="text-xl sm:text-2xl font-bold text-rose-600">{urgentCount}</div></div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow hidden sm:block"><div className="text-sm opacity-70">No-Shows (past, not checked-in)</div><div className="font-medium">{noShows}</div></div>
      </div>

      {/* Filters row */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white shadow flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input id="apptSearch" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title / patient / MediID / notes / doctor / room…" className="flex-1 bg-transparent outline-none text-sm" />
            {query && (<button onClick={() => { setQuery(""); setDebQ(""); }} className="text-xs opacity-70">Clear</button>)}
          </div>

          <select className="p-2 rounded-lg bg-white shadow" value={filter.status} onChange={(e) => setFilter((s) => ({ ...s, status: e.target.value }))}>{["All", ...statuses].map(s => <option key={s}>{s}</option>)}</select>
          <select className="p-2 rounded-lg bg-white shadow" value={filter.urgent} onChange={(e) => setFilter((s) => ({ ...s, urgent: e.target.value }))}>{["All", "Urgent", "Normal"].map(s => <option key={s}>{s}</option>)}</select>
          <select className="p-2 rounded-lg bg-white shadow" value={filter.triage} onChange={(e) => setFilter((s) => ({ ...s, triage: e.target.value }))}>{["All", ...triages].map(s => <option key={s}>{s}</option>)}</select>
          <select className="p-2 rounded-lg bg-white shadow" value={filter.doctor} onChange={(e) => setFilter((s) => ({ ...s, doctor: e.target.value }))}>{["All", ...new Set(appts.map(a=>a.doctor).filter(Boolean))].map(s => <option key={s}>{s}</option>)}</select>
          <select className="p-2 rounded-lg bg-white shadow" value={filter.room} onChange={(e) => setFilter((s) => ({ ...s, room: e.target.value }))}>{["All", ...new Set(appts.map(a=>a.room||a.location).filter(Boolean))].map(s => <option key={s}>{s}</option>)}</select>

          {/* Custom date */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white shadow">
            <Filter className="w-4 h-4 text-gray-500" />
            <select className="text-sm" value={filter.range} onChange={(e)=>setFilter((f)=>({ ...f, range: e.target.value }))}>{["All","Today","Next7","Custom"].map(s => <option key={s}>{s}</option>)}</select>
            {filter.range === "Custom" && (
              <div className="flex items-center gap-2">
                <input type="date" className="p-1 border rounded text-sm" value={filter.from} onChange={(e)=>setFilter((f)=>({...f, from:e.target.value}))}/>
                <span className="text-xs opacity-60">to</span>
                <input type="date" className="p-1 border rounded text-sm" value={filter.to} onChange={(e)=>setFilter((f)=>({...f, to:e.target.value}))}/>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Views */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {view === "Today" && <TodayTimeline appts={filtered.filter(a => isSameDay(a.start)).sort(byStart)} />}
        {view === "Insights" && <InsightsPanel filtered={filtered} byStatus={byStatus} />}
        {view === "Rooms" && <RoomsBoard appts={filtered} setStage={setStage} nudgeTime={nudgeTime} />}

        {view === "List" && (
          filtered.length === 0 ? (
            <div className="p-6 text-center opacity-60 bg-white rounded-lg shadow">No appointments found</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => {
                const conflict = hasConflict(a, filtered, a.id);
                const isPast = fmtDT(a.end).getTime() < now;
                const soon = fmtDT(a.start).getTime() - now < 10*60000 && fmtDT(a.start).getTime() > now;
                return (
                  <div key={a.id} className={`p-3 sm:p-4 rounded-xl shadow bg-white ${a.triage==="Critical" ? "ring-2 ring-rose-300" : ""}`}>
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input type="checkbox" aria-label="Select appointment" checked={!!bulk.has(a.id)} onChange={() => toggleBulk(a.id)} className="mt-1 sm:mt-0" />
                        <div>
                          <div className="font-semibold text-base sm:text-lg flex flex-wrap items-center gap-2">
                            {a.title}
                            {a.urgent && <span className="px-2 py-0.5 bg-rose-600/10 text-rose-600 rounded text-[10px] sm:text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Urgent</span>}
                            {conflict && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] sm:text-xs">Conflict</span>}
                            {soon && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] sm:text-xs">Starts soon</span>}
                            <TriageBadge t={a.triage || "Low"} />
                          </div>
                          <div className="text-xs sm:text-sm opacity-70 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{new Date(a.start).toLocaleString()} — {new Date(a.end).toLocaleString()} • {durMins(a.start, a.end)}m</span>
                            {a.room && <span>• Room: {a.room}</span>}
                            {a.doctor && <span>• {a.doctor}</span>}
                            {a.mediId && <span>• MediID: <button className="underline" onClick={()=>openPatient(a.mediId)}>{a.mediId}</button></span>}
                            <span>• {relTime(a.start)}</span>
                          </div>
                          <div className="mt-1 sm:mt-2 flex items-center gap-2 flex-wrap">
                            <StatusBadge s={a.status} />
                            <StageBadge st={a.stage || "Waiting"} />
                            {a.checkedIn && <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700">Checked-in</span>}
                          </div>
                        </div>
                      </div>

                      {/* right actions (desktop) */}
                      <div className="hidden sm:flex gap-2 items-center shrink-0">
                        <button onClick={() => toggleCheckIn(a.id)} className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs">{a.checkedIn ? "Undo Check-in" : "Check-in"}</button>
                        <button onClick={() => setStage(a.id, a.stage==="Waiting" ? "InRoom" : "Waiting")} className="px-3 py-1 rounded bg-white border text-xs flex items-center gap-1">{a.stage==="Waiting" ? <DoorOpen className="w-3 h-3"/> : <DoorClosed className="w-3 h-3"/>}{a.stage==="Waiting" ? "Start Visit" : "Back to Waiting"}</button>
                        <button onClick={() => snooze(a.id, 10)} className="px-2 py-1 rounded bg-white border text-xs flex items-center gap-1"><AlarmClock className="w-3 h-3"/>Snooze</button>
                        <button onClick={() => downloadICS(`appointment_${a.id}.ics`, icsFor(a))} className="px-3 py-1 rounded bg-white border text-xs"><FileDown className="w-3 h-3" /> .ics</button>
                        {a.status !== "Completed" && (<button onClick={() => setStatus(a.id, "Completed")} className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 text-xs">Complete</button>)}
                        {a.status !== "Cancelled" && (<button onClick={() => setStatus(a.id, "Cancelled")} className="px-3 py-1 rounded bg-rose-100 text-rose-700 text-xs">Cancel</button>)}
                        <button onClick={() => openForm(a)} className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs">Edit</button>
                        <button onClick={() => duplicateAppt(a)} className="px-3 py-1 rounded bg-white border text-xs">Duplicate</button>
                        <button onClick={() => shareAppt(a)} className="px-3 py-1 rounded bg-white border text-xs flex items-center gap-1"><Share2 className="w-3 h-3" />Share</button>
                        <button onClick={() => deleteAppt(a.id)} className="px-3 py-1 rounded bg-slate-800 text-white text-xs">Delete</button>
                      </div>

                      {/* mobile overflow menu */}
                      <div className="sm:hidden">
                        <MobileMenu
                          onCheck={() => toggleCheckIn(a.id)}
                          checked={a.checkedIn}
                          onStage={() => setStage(a.id, a.stage==="Waiting" ? "InRoom" : "Waiting")}
                          stage={a.stage}
                          onMinus15={() => nudgeTime(a.id, -15)}
                          onPlus15={() => nudgeTime(a.id, 15)}
                          onComplete={() => setStatus(a.id, "Completed")}
                          onCancel={() => setStatus(a.id, "Cancelled")}
                          onEdit={() => openForm(a)}
                          onDup={() => duplicateAppt(a)}
                          onIcs={() => downloadICS(`appointment_${a.id}.ics`, icsFor(a))}
                          onShare={() => shareAppt(a)}
                          onDelete={() => deleteAppt(a.id)}
                          onOpenPatient={() => openPatient(a.mediId)}
                        />
                      </div>
                    </div>

                    {/* Notes / warnings */}
                    {(a.notes || conflict || isPast) && (
                      <div className="mt-2 sm:mt-3">
                        <button className="sm:hidden text-xs flex items-center gap-1 opacity-70" onClick={()=> setOpenId(openId===a.id ? null : a.id)}>
                          {openId===a.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>} Details
                        </button>
                        <div className={`text-sm ${openId===a.id ? "block" : "hidden sm:block"}`}>
                          {a.notes && <div className="opacity-80"><span className="font-medium">Notes:</span> {a.notes}</div>}
                          {conflict && <div className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded mt-1 inline-block">Overlaps with another appointment in the list.</div>}
                          {isPast && a.status!=="Completed" && a.status!=="Cancelled" && (
                            <div className="text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded mt-1 inline-block">
                              Ended {relTime(a.end)} • consider marking <button className="underline" onClick={()=>setStatus(a.id,"Completed")}>Completed</button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Waitlist + Tools (no QuickAdd) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-24">
        <div className="grid lg:grid-cols-2 gap-3">
          {/* Waitlist */}
          <div className="bg-white rounded-xl shadow p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Waitlist</div>
              <button onClick={() => setWaitlist([])} className="text-xs text-rose-600">Clear</button>
            </div>
            {waitlist.length === 0 ? (
              <div className="text-sm opacity-70 mt-2">No people in waitlist.</div>
            ) : (
              <ul className="mt-2 space-y-2">
                {waitlist.map((w) => (
                  <li key={w.id} className="border rounded-lg p-2 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-medium">{w.patient || "Unnamed"} {w.mediId ? <span className="text-xs opacity-70">({w.mediId})</span> : null}</div>
                      <div className="text-xs opacity-70">{w.reason || "—"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2 py-1 rounded bg-white border" onClick={() => {
                        const st = new Date(Date.now()+15*60000).toISOString().slice(0,16);
                        const en = addMinutes(st, w.duration || 15);
                        const newAppt = { id: Date.now(), title: w.title || "Consultation", patient: w.patient || "Unnamed", mediId: w.mediId, doctor: w.doctor, room: w.room, location: w.room, start: st, end: en, status:"Pending", stage:"Waiting", triage: w.triage || "Medium", urgent: !!w.urgent, notes: w.reason || "" };
                        setAppts(p => [newAppt, ...p]); setWaitlist(p => p.filter(x => x.id !== w.id));
                        showToast("Promoted from waitlist");
                      }}>Promote</button>
                      <button className="text-xs px-2 py-1 rounded bg-rose-50 text-rose-700 border" onClick={() => setWaitlist(p => p.filter(x => x.id !== w.id))}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tools */}
          <div className="bg-white rounded-xl shadow p-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Day Tools</div>
              <button onClick={() => openForm()} className="text-xs px-2 py-1 rounded bg-green-600 text-white flex items-center gap-1"><Plus className="w-3 h-3" /> New</button>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <button
                onClick={() => {
                  const today = new Date().toISOString().slice(0,10);
                  const dayList = appts.filter(a=>a.start.slice(0,10)===today);
                  if (dayList.length===0) return showToast("No events today");
                  exportDayICS(dayList, today);
                }}
                className="px-3 py-1.5 rounded bg-white border text-sm flex items-center gap-2"
              ><FileDown className="w-4 h-4"/> Export Day .ics</button>

              <button
                onClick={()=>{
                  // Simple optimizer: pull first urgent waitlist into next free slot
                  const w = waitlist.find(x=>x.urgent) || waitlist[0];
                  if (!w) return showToast("Waitlist empty");
                  const { start, end } = suggestNextFreeSlot(w.doctor || null, w.room || null, w.duration || 15);
                  const newAppt = { id: Date.now(), title: w.title || "Consultation", patient: w.patient || "Unnamed", mediId: w.mediId||"", doctor: w.doctor||"", room: w.room||"", location: w.room||"", start, end, status:"Pending", stage:"Waiting", triage: w.triage || "Medium", urgent: !!w.urgent, notes: w.reason || "", checkedIn:false };
                  setAppts(p=>[newAppt, ...p]);
                  setWaitlist(p=>p.filter(x=>x.id!==w.id));
                  showToast("Scheduled next free slot from waitlist");
                }}
                className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm flex items-center gap-2"
              ><Sparkles className="w-4 h-4"/> Fill Next Free Slot</button>
            </div>

            {/* Templates manage */}
            <div className="mt-3 border-t pt-3">
              <div className="text-sm font-semibold mb-2">Templates</div>
              <div className="flex flex-wrap gap-2">
                {templates.map(t=>(
                  <button key={t.id}
                    onClick={()=>{
                      const st = new Date(Date.now()+5*60000).toISOString().slice(0,16);
                      const en = addMinutes(st, t.minutes||15);
                      openForm({ title: t.name.replace(/\s+\d+m$/i,""), patient:"", mediId:"", doctor:"", room:"", location:"", start:st, end:en, status:"Pending", stage:"Waiting", triage:t.triage||"Medium", urgent:!!t.urgent, notes:"", checkedIn:false });
                    }}
                    className="px-3 py-1.5 rounded border bg-white text-xs">{t.name}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom mobile bar */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="bg-white border shadow-lg rounded-2xl flex items-center justify-between px-3 py-2">
          <button onClick={()=>openForm()} className="px-3 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2"><Plus className="w-4 h-4"/>New</button>
          <button onClick={()=>exportCSV(filtered)} className="px-3 py-2 bg-indigo-600 text-white rounded-xl flex items-center gap-2"><Download className="w-4 h-4"/>CSV</button>
          <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 bg-white border rounded-xl flex items-center gap-2"><Upload className="w-4 h-4"/>Import</button>
        </div>
      </div>

      {/* Modal Form (Advanced) */}
      <AnimatePresence>
        {formOpen && (
          <motion.div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-2xl shadow-lg relative"
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}>
              <button className="absolute top-3 right-3" onClick={() => setFormOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{editAppt?.id ? "Edit" : "Add"} Appointment</h2>
                <div className="flex items-center gap-2">
                  {/* Save as template */}
                  <button
                    onClick={()=>{
                      const name = prompt("Save current fields as template name?");
                      if (!name) return;
                      const minutes = editAppt?.start && editAppt?.end ? durMins(editAppt.start, editAppt.end) : 15;
                      const tpl = { id: "tpl_"+Date.now(), name: `${name} ${minutes}m`, minutes, triage: editAppt?.triage || "Medium", urgent: !!editAppt?.urgent };
                      setTemplates(t=>[tpl, ...t].slice(0,20));
                      showToast("Template saved");
                    }}
                    className="px-2 py-1 text-xs rounded bg-white border flex items-center gap-1"
                    title="Save fields as template">
                    <Save className="w-3 h-3"/> Save Template
                  </button>
                </div>
              </div>
              <AdvancedForm
                initial={editAppt}
                all={appts}
                allDoctors={allDoctors.filter(x=>x!=="All")}
                allRooms={allRooms.filter(x=>x!=="All")}
                onCancel={() => setFormOpen(false)}
                onSave={upsertAppt}
                onWait={addToWaitlist}
                onSuggest={(doctor, room, minutes)=>suggestNextFreeSlot(doctor, room, minutes)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow max-w-[80vw]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print tweaks */}
      <style>{`@media print { header, .fixed, .sticky { display:none !important; } .shadow { box-shadow:none !important; } body { background:white; } }`}</style>
    </div>
  );
}

/* ------------------------------ Today timeline ------------------------------ */
function TodayTimeline({ appts }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-semibold mb-2">Today’s Timeline</div>
      {appts.length === 0 ? (
        <div className="text-sm opacity-70">No appointments today.</div>
      ) : (
        <div className="relative pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-px bg-gray-200" />
          <div className="space-y-4">
            {appts.map(a => (
              <div key={a.id} className="relative">
                <div className={`absolute -left-0.5 top-1 w-2 h-2 rounded-full ${a.urgent ? "bg-rose-600" : "bg-indigo-600"}`} />
                <div className="text-xs opacity-70">{new Date(a.start).toLocaleTimeString([], { hour: "2-digit", minute:"2-digit" })} • {durMins(a.start, a.end)}m</div>
                <div className="font-medium">{a.title} — <span className="opacity-80">{a.patient}</span></div>
                <div className="text-xs opacity-70">{a.room || a.location || "—"} · {a.triage || "Low"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Insights -------------------------------- */
function InsightsPanel({ filtered, byStatus }) {
  const urgent = filtered.filter(a=>a.urgent).length;
  const total = filtered.length || 1;
  const late = filtered.filter(a => new Date(a.start).getTime() < Date.now() && a.stage==="Waiting").length;
  const inRoom = filtered.filter(a => a.stage==="InRoom").length;
  const pct = (n) => Math.round((n/total)*100);

  const Bar = ({ value, label }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span>{label}</span><span>{value}</span></div>
      <div className="h-2 bg-gray-100 rounded"><div className="h-2 rounded" style={{ width: `${Math.min(100, pct(value))}%`, background: "linear-gradient(90deg, rgba(99,102,241,.9), rgba(16,185,129,.9))" }} /></div>
    </div>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div className="bg-white rounded-xl shadow p-4">
        <div className="font-semibold mb-3">Status Breakdown</div>
        <div className="space-y-3">
          {Object.entries(byStatus).map(([k,v]) => <Bar key={k} value={v} label={`${k} (${pct(v)}%)`} />)}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-4">
        <div className="font-semibold mb-3">Operational</div>
        <Bar value={urgent} label={`Urgent (${pct(urgent)}%)`} />
        <Bar value={inRoom} label={`In Room (${pct(inRoom)}%)`} />
        <Bar value={late} label={`Late / Behind Time (${pct(late)}%)`} />
        <div className="mt-3 text-xs opacity-70">Total considered: {filtered.length}</div>
      </div>
    </div>
  );
}

/* -------------------------------- Rooms view ------------------------------- */
function RoomsBoard({ appts, setStage, nudgeTime }) {
  const byRoom = useMemo(() => {
    const map = {};
    appts.forEach(a => {
      const r = a.room || a.location || "—";
      map[r] ||= [];
      map[r].push(a);
    });
    Object.values(map).forEach(arr => arr.sort(byStart));
    return map;
  }, [appts]);

  const rooms = Object.keys(byRoom).sort();

  return (
    <div className="grid md:grid-cols-2 gap-3">
      {rooms.map((room) => (
        <div key={room} className="bg-white rounded-xl shadow p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold">Room: {room}</div>
            <div className="text-xs opacity-70">{byRoom[room].length} appts</div>
          </div>
          <div className="space-y-2">
            {byRoom[room].map(a => (
              <div key={a.id} className="border rounded-lg p-2 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{a.title} <span className="opacity-70">— {a.patient}</span></div>
                  <div className="text-xs opacity-70">{new Date(a.start).toLocaleTimeString([], { hour: "2-digit", minute:"2-digit" })} • {durMins(a.start, a.end)}m · {a.stage||"Waiting"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={()=>setStage(a.id, a.stage==="Waiting" ? "InRoom" : "Waiting")} className="px-2 py-1 rounded bg-white border text-xs">{a.stage==="Waiting" ? "Start" : "Back"}</button>
                  <button onClick={()=>nudgeTime(a.id, -5)} className="px-2 py-1 rounded bg-white border text-xs">-5m</button>
                  <button onClick={()=>nudgeTime(a.id, 5)} className="px-2 py-1 rounded bg-white border text-xs">+5m</button>
                </div>
              </div>
            ))}
            {byRoom[room].length === 0 && <div className="text-sm opacity-70">No appointments</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Mobile menu ------------------------------ */
function MobileMenu({ onCheck, checked, onStage, stage, onMinus15, onPlus15, onComplete, onCancel, onEdit, onDup, onIcs, onShare, onDelete, onOpenPatient }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="p-2 rounded-lg border bg-white"><MoreHorizontal className="w-4 h-4"/></button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:6}}
            className="absolute right-0 mt-2 bg-white border rounded-xl shadow-lg text-sm overflow-hidden z-10">
            <button onClick={()=>{onOpenPatient?.(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Open Patient</button>
            <button onClick={()=>{onCheck(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">{checked ? "Undo Check-in" : "Check-in"}</button>
            <button onClick={()=>{onStage(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">{stage==="Waiting" ? "Start Visit" : "Back to Waiting"}</button>
            <button onClick={()=>{onMinus15(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">-15m</button>
            <button onClick={()=>{onPlus15(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">+15m</button>
            <button onClick={()=>{onComplete(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Complete</button>
            <button onClick={()=>{onCancel(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Cancel</button>
            <button onClick={()=>{onEdit(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Edit</button>
            <button onClick={()=>{onDup(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Duplicate</button>
            <button onClick={()=>{onIcs(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Export .ics</button>
            <button onClick={()=>{onShare(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">Share</button>
            <button onClick={()=>{onDelete(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50 text-rose-600">Delete</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------- Advanced Add/Edit Form -------------------------- */
function AdvancedForm({ initial, all, allDoctors, allRooms, onSave, onWait, onCancel, onSuggest }) {
  const [form, setForm] = useState(() => initial || {
    title: "", patient: "", mediId:"", doctor:"", location:"", room:"", start:"", end:"", status:"Pending", stage:"Waiting", triage:"Medium", urgent:false, notes:"", checkedIn:false
  });
  const [warn, setWarn] = useState("");
  const [minutes, setMinutes] = useState(()=> (form.start && form.end) ? durMins(form.start, form.end) : 15);

  // auto end by minutes
  useEffect(() => {
    if (form.start) setForm(s=>({ ...s, end: addMinutes(form.start, minutes) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minutes, form.start]);

  // basic validations + conflict info
  useEffect(() => {
    if (form.start && form.end && fmtDT(form.end) <= fmtDT(form.start)) setWarn("End time must be after start time");
    else if (form.start && form.end && hasConflict(form, (all||[]).filter(a=>a.id!==form.id))) setWarn("This overlaps with another appointment");
    else setWarn("");
  }, [form, all]);

  // helpers
  const roundTo5 = () => {
    const d = new Date();
    const m = d.getMinutes();
    const roundedMin = m + (5 - (m % 5 || 5));
    const st = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), roundedMin);
    const iso = new Date(st.getTime()).toISOString().slice(0,16);
    setForm(s=>({ ...s, start: iso, end: addMinutes(iso, minutes) }));
  };
  const startIn5 = () => {
    const st = new Date(Date.now()+5*60000).toISOString().slice(0,16);
    setForm(s=>({ ...s, start: st, end: addMinutes(st, minutes) }));
  };
  const suggestSlot = () => {
    const { start, end } = onSuggest?.(form.doctor || null, form.room || null, minutes) || {};
    if (start && end) setForm(s=>({ ...s, start, end }));
  };

  const triageColor = {
    Low: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Medium: "bg-amber-100 text-amber-700 border-amber-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Critical: "bg-rose-100 text-rose-700 border-rose-300",
  };

  const canSave = form.title && form.patient && form.start && form.end;

  return (
    <div className="space-y-4">
      {/* Row 1: Title + Patient + MediID */}
      <div className="grid md:grid-cols-3 gap-2">
        <input className="p-2 border rounded" placeholder="Appointment Title *" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
        <input className="p-2 border rounded" placeholder="Patient *" value={form.patient} onChange={e => setForm(s => ({ ...s, patient: e.target.value }))} />
        <input className="p-2 border rounded" placeholder="Medi ID (optional)" value={form.mediId} onChange={e => setForm(s => ({ ...s, mediId: e.target.value }))} />
      </div>

      {/* Row 2: Doctor + Room */}
      <div className="grid md:grid-cols-3 gap-2">
        <input list="doctorList" className="p-2 border rounded" placeholder="Doctor" value={form.doctor} onChange={e => setForm(s => ({ ...s, doctor: e.target.value }))} />
        <datalist id="doctorList">{allDoctors.map(d=><option key={d} value={d} />)}</datalist>

        <input list="roomList" className="p-2 border rounded" placeholder="Room / Location" value={form.room || form.location} onChange={e => setForm(s => ({ ...s, room: e.target.value, location: e.target.value }))} />
        <datalist id="roomList">{allRooms.map(r=><option key={r} value={r} />)}</datalist>

        <select className={`p-2 border rounded font-medium ${triageColor[form.triage]||""}`} value={form.triage} onChange={e => setForm(s => ({ ...s, triage: e.target.value }))}>
          {triages.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Row 3: Datetime + duration + urgent */}
      <div className="grid md:grid-cols-3 gap-2">
        <div className="flex gap-2">
          <input type="datetime-local" className="p-2 border rounded flex-1" value={form.start} onChange={e => setForm(s => ({ ...s, start: e.target.value }))} />
          <input type="datetime-local" className="p-2 border rounded flex-1" value={form.end} onChange={e => {
            const v = e.target.value;
            setForm(s => ({ ...s, end: v }));
            const m = s.start ? durMins(s.start, v) : minutes;
            if (m>0 && m<=240) setMinutes(m);
          }} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">Duration</span>
          <input type="number" min={5} max={240} step={5} className="p-2 border rounded w-24 text-center" value={minutes} onChange={(e)=> setMinutes(Math.min(240, Math.max(5, +e.target.value||15)))} />
          <div className="flex gap-1">
            {[10,15,20,30,45,60].map(m=>(
              <button key={m} onClick={()=>setMinutes(m)} className={`px-2 py-1 rounded border text-xs ${minutes===m ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"}`}>{m}m</button>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 p-2 border rounded">
          <input type="checkbox" checked={form.urgent} onChange={e => setForm(s => ({ ...s, urgent: e.target.checked }))} />
          Urgent
        </label>
      </div>

      {/* Smart helpers */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={startIn5} className="px-3 py-1.5 rounded bg-white border text-xs flex items-center gap-2"><Sparkles className="w-3 h-3"/> Start in 5m</button>
        <button onClick={roundTo5} className="px-3 py-1.5 rounded bg-white border text-xs">Round start to 5m</button>
        <button onClick={suggestSlot} className="px-3 py-1.5 rounded bg-white border text-xs">Suggest next free slot</button>
        <button onClick={()=>downloadICS(`appointment_preview.ics`, icsFor({ ...form, id: form.id || Date.now() }))} className="px-3 py-1.5 rounded bg-white border text-xs flex items-center gap-2"><FileDown className="w-3 h-3"/> Preview .ics</button>
        <span className="text-xs opacity-70">Duration: {form.start && form.end ? `${durMins(form.start, form.end)} min` : "—"}</span>
      </div>

      {/* Notes */}
      <textarea className="w-full p-2 border rounded" placeholder="Notes" rows={3} value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} />

      {/* Warning / conflict */}
      {warn && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">{warn}</div>}

      {/* Actions */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex gap-2 text-xs">
          <button onClick={()=> setForm(s=>{ const st = s.start || new Date().toISOString().slice(0,16); return ({...s, start: st, end: addMinutes(st, 10)}); })} className="px-2 py-1 rounded bg-slate-100">10m</button>
          <button onClick={()=> setForm(s=>{ const st = s.start || new Date().toISOString().slice(0,16); return ({...s, start: st, end: addMinutes(st, 15)}); })} className="px-2 py-1 rounded bg-slate-100">15m</button>
          <button onClick={()=> setForm(s=>{ const st = s.start || new Date().toISOString().slice(0,16); return ({...s, start: st, end: addMinutes(st, 20)}); })} className="px-2 py-1 rounded bg-slate-100">20m</button>
          <button onClick={()=> setForm(s=>{ const st = s.start || new Date().toISOString().slice(0,16); return ({...s, start: st, end: addMinutes(st, 30)}); })} className="px-2 py-1 rounded bg-slate-100">30m</button>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="px-3 py-2 rounded bg-gray-100">Cancel</button>
          <button onClick={()=> onWait(form)} className="px-3 py-2 rounded bg-white border">Add to Waitlist</button>
          <button onClick={()=> onSave(form)} disabled={!canSave} className="px-3 py-2 rounded bg-green-600 text-white flex items-center gap-2 disabled:opacity-60">
            <CheckCircle2 className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
