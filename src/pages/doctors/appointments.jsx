// src
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
  Copy,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

/* ------------------------- localStorage helpers ------------------------- */
const LS = { APPTS: "dd_appts_v4" }; // bump version when shape changes
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

/* ------------------------------ dummy data ------------------------------ */
const seed = [
  {
    id: 1,
    title: "Cardiac Follow-up",
    patient: "Anna Brown",
    location: "OPD-2",
    start: "2025-10-08T10:30:00",
    end: "2025-10-08T11:00:00",
    status: "Confirmed",
    urgent: true,
    notes: "Bring old ECG.",
    checkedIn: false,
  },
  {
    id: 2,
    title: "General Checkup",
    patient: "Mark Lee",
    location: "OPD-1",
    start: "2025-10-08T12:00:00",
    end: "2025-10-08T12:20:00",
    status: "Pending",
    urgent: false,
    notes: "",
    checkedIn: false,
  },
];

/* ------------------------------- utils ---------------------------------- */
const fmtDT = (s) => new Date(s);
const durMins = (a, b) => Math.max(0, Math.round((fmtDT(b) - fmtDT(a)) / 60000));
const isSameDay = (a, b = new Date()) =>
  fmtDT(a).toDateString() === fmtDT(b).toDateString();
const withinNextDays = (iso, days) => {
  const d = fmtDT(iso).getTime();
  const now = Date.now();
  const until = now + days * 86400000;
  return d >= now && d <= until;
};
const byStart = (a, b) => fmtDT(a.start) - fmtDT(b.start);
const statuses = ["Pending", "Confirmed", "Completed", "Cancelled"];

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
    return Math.max(s1, s2) < Math.min(e1, e2); // overlap
  });
}

/* ------------------------------- CSV export ----------------------------- */
function exportCSV(appts) {
  const header = ["Title", "Patient", "Location", "Start", "End", "Status", "Urgent", "Notes", "CheckedIn"];
  const rows = appts.map((e) => [
    e.title,
    e.patient,
    e.location || "",
    e.start,
    e.end,
    e.status,
    e.urgent ? "Yes" : "No",
    (e.notes || "").replace(/\n/g, " "),
    e.checkedIn ? "Yes" : "No",
  ]);
  const csv = [header, ...rows]
    .map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `appointments_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ------------------------------- ICS export ----------------------------- */
function icsFor(appt) {
  const dt = (s) => new Date(s).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const esc = (t) => String(t || "").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DoctorDesk//Appointments//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${appt.id || Date.now()}@doctor.desk`,
    `DTSTAMP:${dt(new Date().toISOString())}`,
    `DTSTART:${dt(appt.start)}`,
    `DTEND:${dt(appt.end)}`,
    `SUMMARY:${esc(appt.title)} (${esc(appt.patient)})`,
    appt.location ? `LOCATION:${esc(appt.location)}` : "",
    appt.notes ? `DESCRIPTION:${esc(appt.notes)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
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

/* --------------------------------- Page --------------------------------- */
export default function AppointmentsPage() {
  const [appts, setAppts] = useState(() => load(LS.APPTS, seed));
  const [query, setQuery] = useState("");
  const [debQ, setDebQ] = useState("");
  const [filter, setFilter] = useState({
    status: "All",
    urgent: "All",
    range: "All", // All | Today | Next7 | Custom
    from: "",
    to: "",
  });
  const [view, setView] = useState("List"); // List | Today | Insights
  const [toast, setToast] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [openId, setOpenId] = useState(null); // expand card notes on mobile
  const [bulk, setBulk] = useState(new Set());
  const fileRef = useRef(null);

  /* debounced search + persistence */
  useEffect(() => {
    const id = setTimeout(() => setDebQ(query.trim()), 250);
    return () => clearTimeout(id);
  }, [query]);
  useEffect(() => save(LS.APPTS, appts), [appts]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const openForm = (appt) => { setEditAppt(appt || null); setFormOpen(true); };
  const upsertAppt = (data) => {
    // conflict guard
    const list = appts.filter((x) => x.id !== (data.id ?? -1));
    if (hasConflict(data, list)) {
      showToast("⚠️ Time conflict with another appointment");
    }
    if (data.id) {
      setAppts((prev) => prev.map((x) => (x.id === data.id ? data : x)));
      showToast("Appointment updated");
    } else {
      setAppts((prev) => [{ ...data, id: Date.now() }, ...prev]);
      showToast("Appointment added");
    }
    setFormOpen(false);
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
    setAppts((p) => p.map((a) => a.id === id ? { ...a, status } : a));
    showToast(`Marked ${status}`);
  };
  const toggleCheckIn = (id) => {
    setAppts((p) => p.map((a) => a.id === id ? { ...a, checkedIn: !a.checkedIn } : a));
  };

  /* ---------------------- derived filtered list ---------------------- */
  const filtered = useMemo(() => {
    let list = [...appts];
    // status
    if (filter.status !== "All") list = list.filter((a) => a.status === filter.status);
    // urgency
    if (filter.urgent !== "All") list = list.filter((a) => a.urgent === (filter.urgent === "Urgent"));
    // range
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
    // search
    if (debQ) {
      const ql = debQ.toLowerCase();
      list = list.filter((a) =>
        [a.title, a.patient, a.location, a.notes].some((s) =>
          (s || "").toLowerCase().includes(ql)
        )
      );
    }
    return list.sort(byStart);
  }, [appts, filter, debQ]);

  /* stats */
  const upcoming = filtered.filter((a) => fmtDT(a.start) > new Date()).length;
  const urgentCount = filtered.filter((a) => a.urgent).length;
  const byStatus = statuses.reduce((acc, s) => (acc[s] = filtered.filter(a => a.status === s).length, acc), {});

  /* bulk helpers */
  const toggleBulk = (id) => setBulk((b) => {
    const nb = new Set(b);
    nb.has(id) ? nb.delete(id) : nb.add(id);
    return nb;
  });
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
      const get = (key, def="") => {
        const i = idx(key);
        return i >= 0 ? cols[i] : def;
      };
      return {
        id: Date.now() + Math.random(),
        title: get("title"),
        patient: get("patient"),
        location: get("location"),
        start: get("start"),
        end: get("end"),
        status: get("status") || "Pending",
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
When: ${new Date(a.start).toLocaleString()} - ${new Date(a.end).toLocaleString()}
Where: ${a.location || "—"}
Status: ${a.status}${a.urgent ? " • URGENT" : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: a.title, text });
      else {
        await navigator.clipboard.writeText(text);
        showToast("Copied details");
      }
    } catch {}
  };

  /* render badges */
  const StatusBadge = ({ s }) => (
    <span className={
      "px-2 py-1 rounded text-xs " +
      (s === "Pending" ? "bg-amber-100 text-amber-700" :
       s === "Confirmed" ? "bg-indigo-100 text-indigo-700" :
       s === "Completed" ? "bg-emerald-100 text-emerald-700" :
       "bg-rose-100 text-rose-700")
    }>{s}</span>
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
          <button
            onClick={() => exportCSV(filtered)}
            className="hidden sm:flex px-3 py-2 bg-indigo-600 text-white rounded-lg items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              ref={fileRef}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f, "merge"); e.target.value = ""; }}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="hidden sm:flex px-3 py-2 bg-white border rounded-lg items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Import
            </button>
          </div>
          <button
            onClick={() => openForm()}
            className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>
      </header>

      {/* View Tabs (mobile scroll) */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {["List", "Today", "Insights"].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-full text-sm border ${view===v ? "bg-indigo-600 text-white border-indigo-600" : "bg-white"}`}
            >
              {v}
            </button>
          ))}
          {/* Quick ranges */}
          {["All", "Today", "Next7"].map(r => (
            <button
              key={r}
              onClick={() => setFilter((f)=>({ ...f, range: r }))}
              className={`px-3 py-1.5 rounded-full text-sm border ${filter.range===r ? "bg-gray-900 text-white border-gray-900" : "bg-white"}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="max-w-6xl mx-auto p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
          <div className="text-xs sm:text-sm opacity-70">Total (filtered)</div>
          <div className="text-xl sm:text-2xl font-bold">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
          <div className="text-xs sm:text-sm opacity-70">Upcoming</div>
          <div className="text-xl sm:text-2xl font-bold">{upcoming}</div>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow">
          <div className="text-xs sm:text-sm opacity-70">Urgent</div>
          <div className="text-xl sm:text-2xl font-bold text-rose-600">{urgentCount}</div>
        </div>
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow hidden sm:block">
          <div className="text-sm opacity-70">Time now</div>
          <div className="font-medium">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Filters row */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white shadow flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title, patient, note…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); setDebQ(""); }}
                className="text-xs opacity-70"
              >
                Clear
              </button>
            )}
          </div>

          <select
            className="p-2 rounded-lg bg-white shadow"
            value={filter.status}
            onChange={(e) => setFilter((s) => ({ ...s, status: e.target.value }))}
          >
            {["All", ...statuses].map(s => <option key={s}>{s}</option>)}
          </select>

          <select
            className="p-2 rounded-lg bg-white shadow"
            value={filter.urgent}
            onChange={(e) => setFilter((s) => ({ ...s, urgent: e.target.value }))}
          >
            {["All", "Urgent", "Normal"].map(s => <option key={s}>{s}</option>)}
          </select>

          {/* Custom date */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white shadow">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              className="text-sm"
              value={filter.range}
              onChange={(e)=>setFilter((f)=>({ ...f, range: e.target.value }))}
            >
              {["All","Today","Next7","Custom"].map(s => <option key={s}>{s}</option>)}
            </select>
            {filter.range === "Custom" && (
              <div className="flex items-center gap-2">
                <input type="date" className="p-1 border rounded text-sm" value={filter.from} onChange={(e)=>setFilter((f)=>({...f, from:e.target.value}))}/>
                <span className="text-xs opacity-60">to</span>
                <input type="date" className="p-1 border rounded text-sm" value={filter.to} onChange={(e)=>setFilter((f)=>({...f, to:e.target.value}))}/>
              </div>
            )}
          </div>
        </div>

        {/* Bulk actions */}
        {bulk.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 p-2 rounded-lg flex flex-wrap gap-2 items-center">
            <div className="text-sm">Selected: {bulk.size}</div>
            <button
              onClick={() => bulkAction((a)=>({ ...a, status:"Completed" }), "Marked completed")}
              className="text-xs px-2 py-1 bg-emerald-600 text-white rounded"
            >Complete</button>
            <button
              onClick={() => bulkAction((a)=>({ ...a, status:"Cancelled" }), "Marked cancelled")}
              className="text-xs px-2 py-1 bg-rose-600 text-white rounded"
            >Cancel</button>
            <button
              onClick={() => bulkAction(()=>null, "Deleted")}
              className="text-xs px-2 py-1 bg-gray-800 text-white rounded"
            >Delete</button>
            <button
              onClick={() => {
                const icsAll = [...appts].filter(a => bulk.has(a.id)).map(icsFor).join("\n");
                downloadICS(`appointments_bulk_${bulk.size}.ics`, icsAll);
              }}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded"
            >Export .ics</button>
          </div>
        )}
      </div>

      {/* Views */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {view === "Today" && <TodayTimeline appts={filtered.filter(a => isSameDay(a.start)).sort(byStart)} onOpen={setOpenId} />}
        {view === "Insights" && <InsightsPanel filtered={filtered} byStatus={byStatus} />}

        {view === "List" && (
          filtered.length === 0 ? (
            <div className="p-6 text-center opacity-60 bg-white rounded-lg shadow">No appointments found</div>
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => {
                const conflict = hasConflict(a, filtered, a.id);
                const now = Date.now();
                const isPast = fmtDT(a.end).getTime() < now;
                return (
                  <div key={a.id} className="p-3 sm:p-4 rounded-xl shadow bg-white">
                    <div className="flex items-start sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          aria-label="Select appointment"
                          checked={bulk.has(a.id)}
                          onChange={() => toggleBulk(a.id)}
                          className="mt-1 sm:mt-0"
                        />
                        <div>
                          <div className="font-semibold text-base sm:text-lg flex items-center gap-2">
                            {a.title}
                            {a.urgent && (
                              <span className="px-2 py-0.5 bg-rose-600/10 text-rose-600 rounded text-[10px] sm:text-xs flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Urgent
                              </span>
                            )}
                            {conflict && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] sm:text-xs">
                                Conflict
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm opacity-70 flex flex-wrap gap-x-2 gap-y-0.5">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3"/>{new Date(a.start).toLocaleString()} — {new Date(a.end).toLocaleString()} • {durMins(a.start, a.end)}m</span>
                            {a.location && <span>• {a.location}</span>}
                            <span>• {relTime(a.start)}</span>
                          </div>
                          <div className="mt-1 sm:mt-2 flex items-center gap-2">
                            <StatusBadge s={a.status} />
                            {a.checkedIn && <span className="px-2 py-0.5 rounded text-xs bg-emerald-50 text-emerald-700">Checked-in</span>}
                          </div>
                        </div>
                      </div>
                      {/* right actions (desktop) */}
                      <div className="hidden sm:flex gap-2 items-center shrink-0">
                        <button onClick={() => toggleCheckIn(a.id)} className="px-3 py-1 rounded bg-slate-100 text-slate-700 text-xs">
                          {a.checkedIn ? "Undo Check-in" : "Check-in"}
                        </button>
                        {a.status !== "Completed" && (
                          <button onClick={() => setStatus(a.id, "Completed")} className="px-3 py-1 rounded bg-emerald-100 text-emerald-700 text-xs">
                            Complete
                          </button>
                        )}
                        {a.status !== "Cancelled" && (
                          <button onClick={() => setStatus(a.id, "Cancelled")} className="px-3 py-1 rounded bg-rose-100 text-rose-700 text-xs">
                            Cancel
                          </button>
                        )}
                        <button onClick={() => openForm(a)} className="px-3 py-1 rounded bg-green-100 text-green-700 text-xs">Edit</button>
                        <button onClick={() => duplicateAppt(a)} className="px-3 py-1 rounded bg-white border text-xs">Duplicate</button>
                        <button onClick={() => { downloadICS(`appointment_${a.id}.ics`, icsFor(a)); }} className="px-3 py-1 rounded bg-indigo-600 text-white text-xs">.ics</button>
                        <button onClick={() => shareAppt(a)} className="px-3 py-1 rounded bg-white border text-xs flex items-center gap-1"><Share2 className="w-3 h-3" />Share</button>
                        <button onClick={() => deleteAppt(a.id)} className="px-3 py-1 rounded bg-slate-800 text-white text-xs">Delete</button>
                      </div>
                      {/* mobile overflow menu */}
                      <div className="sm:hidden">
                        <MobileMenu
                          onCheck={() => toggleCheckIn(a.id)}
                          checked={a.checkedIn}
                          onComplete={() => setStatus(a.id, "Completed")}
                          onCancel={() => setStatus(a.id, "Cancelled")}
                          onEdit={() => openForm(a)}
                          onDup={() => duplicateAppt(a)}
                          onIcs={() => downloadICS(`appointment_${a.id}.ics`, icsFor(a))}
                          onShare={() => shareAppt(a)}
                          onDelete={() => deleteAppt(a.id)}
                        />
                      </div>
                    </div>

                    {/* Notes (collapsible on mobile) */}
                    {(a.notes || conflict || isPast) && (
                      <div className="mt-2 sm:mt-3">
                        <button
                          className="sm:hidden text-xs flex items-center gap-1 opacity-70"
                          onClick={()=> setOpenId(openId===a.id ? null : a.id)}
                        >
                          {openId===a.id ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
                          Details
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

      {/* Bottom mobile bar */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="bg-white border shadow-lg rounded-2xl flex items-center justify-between px-3 py-2">
          <button onClick={()=>openForm()} className="px-3 py-2 bg-green-600 text-white rounded-xl flex items-center gap-2"><Plus className="w-4 h-4"/>New</button>
          <button onClick={()=>exportCSV(filtered)} className="px-3 py-2 bg-indigo-600 text-white rounded-xl flex items-center gap-2"><Download className="w-4 h-4"/>CSV</button>
          <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 bg-white border rounded-xl flex items-center gap-2"><Upload className="w-4 h-4"/>Import</button>
        </div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md shadow-lg relative"
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            >
              <button className="absolute top-3 right-3" onClick={() => setFormOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h2 className="text-lg font-semibold mb-3">{editAppt ? "Edit" : "Add"} Appointment</h2>
              <FormFields
                initial={editAppt}
                all={appts}
                onCancel={() => setFormOpen(false)}
                onSave={upsertAppt}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow max-w-[80vw]"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print tweaks */}
      <style>{`@media print {
        header, .fixed, .sticky { display:none !important; }
        .shadow { box-shadow:none !important; }
        body { background:white; }
      }`}</style>
    </div>
  );
}

/* ------------------------------ Today timeline ------------------------------ */
function TodayTimeline({ appts }) {
  // simple vertical timeline using CSS only, sorted by time
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
                <div className="absolute -left-0.5 top-1 w-2 h-2 rounded-full bg-indigo-600" />
                <div className="text-xs opacity-70">{new Date(a.start).toLocaleTimeString([], { hour: "2-digit", minute:"2-digit" })} • {durMins(a.start, a.end)}m</div>
                <div className="font-medium">{a.title} — <span className="opacity-80">{a.patient}</span></div>
                <div className="text-xs opacity-70">{a.location || "—"}</div>
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
  const pct = (n) => Math.round((n/total)*100);

  const Bar = ({ value, label }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span><span>{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded">
        <div className="h-2 rounded" style={{ width: `${Math.min(100, pct(value))}%` }} />
      </div>
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
        <div className="font-semibold mb-3">Urgency</div>
        <Bar value={urgent} label={`Urgent (${pct(urgent)}%)`} />
        <div className="mt-3 text-xs opacity-70">Total considered: {filtered.length}</div>
      </div>
      <style>{`.bg-white .h-2.rounded { background: linear-gradient(90deg, rgba(99,102,241,.9), rgba(16,185,129,.9)); }`}</style>
    </div>
  );
}

/* ------------------------------ Mobile menu ------------------------------ */
function MobileMenu({ onCheck, checked, onComplete, onCancel, onEdit, onDup, onIcs, onShare, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={()=>setOpen(o=>!o)} className="p-2 rounded-lg border bg-white"><MoreHorizontal className="w-4 h-4"/></button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{opacity:0, y:6}} animate={{opacity:1, y:0}} exit={{opacity:0, y:6}}
            className="absolute right-0 mt-2 bg-white border rounded-xl shadow-lg text-sm overflow-hidden z-10"
          >
            <button onClick={()=>{onCheck(); setOpen(false);}} className="block px-3 py-2 w-full text-left hover:bg-gray-50">{checked ? "Undo Check-in" : "Check-in"}</button>
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

/* -------------------------- Form Fields Component -------------------------- */
function FormFields({ initial, all, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || {
    title: "", patient: "", location: "", start: "", end: "", status: "Pending", urgent: false, notes: "", checkedIn:false
  });

  const [warn, setWarn] = useState("");

  useEffect(() => {
    if (form.start && form.end && fmtDT(form.end) <= fmtDT(form.start)) {
      setWarn("End time must be after start time");
    } else if (form.start && form.end && hasConflict(form, (all||[]).filter(a=>a.id!==form.id))) {
      setWarn("This overlaps with another appointment");
    } else {
      setWarn("");
    }
  }, [form, all]);

  const saveClick = () => onSave(form);

  return (
    <div className="space-y-3">
      <input className="w-full p-2 border rounded" placeholder="Title" value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} />
      <input className="w-full p-2 border rounded" placeholder="Patient" value={form.patient} onChange={e => setForm(s => ({ ...s, patient: e.target.value }))} />
      <input className="w-full p-2 border rounded" placeholder="Location" value={form.location} onChange={e => setForm(s => ({ ...s, location: e.target.value }))} />
      <div className="grid grid-cols-2 gap-2">
        <input type="datetime-local" className="p-2 border rounded" value={form.start} onChange={e => setForm(s => ({ ...s, start: e.target.value }))} />
        <input type="datetime-local" className="p-2 border rounded" value={form.end} onChange={e => setForm(s => ({ ...s, end: e.target.value }))} />
      </div>
      <div className="text-xs opacity-70">
        {form.start && form.end ? `Duration: ${durMins(form.start, form.end)} min` : "Pick start & end"}
      </div>
      <select className="w-full p-2 border rounded" value={form.status} onChange={e => setForm(s => ({ ...s, status: e.target.value }))}>
        {["Pending", "Confirmed", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
      </select>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.urgent} onChange={e => setForm(s => ({ ...s, urgent: e.target.checked }))} />
        Mark as urgent
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.checkedIn} onChange={e => setForm(s => ({ ...s, checkedIn: e.target.checked }))} />
        Checked-in
      </label>
      <textarea className="w-full p-2 border rounded" placeholder="Notes" rows={3} value={form.notes} onChange={e => setForm(s => ({ ...s, notes: e.target.value }))} />
      {warn && <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">{warn}</div>}
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-3 py-2 rounded bg-gray-100">Cancel</button>
        <button
          onClick={saveClick}
          disabled={!form.title || !form.patient || !form.start || !form.end}
          className="px-3 py-2 rounded bg-green-600 text-white flex items-center gap-2 disabled:opacity-60"
        >
          <CheckCircle2 className="w-4 h-4" /> Save
        </button>
      </div>
    </div>
  );
}
