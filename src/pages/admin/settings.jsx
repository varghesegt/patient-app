// src/pages/admin/settings.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, ShieldPlus, Activity, Ambulance, FileSpreadsheet, Building2, Bed, Users2,
  Download, Upload, Save, Plus, Trash2, Search, RefreshCcw, Clock, Bell, PlugZap,
  ChevronRight, ChevronLeft, CheckCircle2, X, AlertTriangle, Phone, Mail, Link2, KeyRound
} from "lucide-react";

/* ----------------------------- LocalStorage ----------------------------- */
const LS = {
  SETTINGS: "dd_admin_settings_v1",
  AUDIT: "dd_audit_log_v1",
};
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

/* --------------------------------- Seed --------------------------------- */
const seed = {
  general: {
    orgName: "DoctorDesk Hospital",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
    address: "OPD Campus, Wing-B",
    phone: "+91 98765 00000",
    email: "admin@doctor.desk",
    currency: "INR",
    locale: "en-IN",
  },
  emergency: {
    edCapacity: 18,
    diversion: false,
    ambulancePartners: [
      { id: "amb1", name: "City EMS", phone: "+91 90000 11111" },
      { id: "amb2", name: "QuickAid", phone: "+91 90000 22222" },
    ],
    triage: [
      { level: "Critical", color: "#dc2626", targetMins: 0, description: "Immediate. Code event or unstable vitals." },
      { level: "High", color: "#fb923c", targetMins: 10, description: "Severe pain, chest pain, stroke symptoms." },
      { level: "Medium", color: "#fbbf24", targetMins: 30, description: "Requires urgent but not immediate attention." },
      { level: "Low", color: "#10b981", targetMins: 60, description: "Minor injuries, routine complaints." },
    ],
    codes: [
      { code: "Code Blue", team: "Resuscitation Team", location: "Whole Facility", autoPage: true },
      { code: "Code Red", team: "Fire Response", location: "Whole Facility", autoPage: true },
      { code: "Code Yellow", team: "Disaster", location: "Command Center", autoPage: false },
    ],
    escalation: [
      { step: 1, withinMin: 5, role: "ED Charge Nurse", contact: "+91 95555 11111" },
      { step: 2, withinMin: 10, role: "ED Duty Doctor", contact: "+91 95555 22222" },
      { step: 3, withinMin: 20, role: "Medical Admin On-call", contact: "+91 95555 33333" },
    ],
    checklists: [
      { id: "cl1", name: "Stroke Activation", items: ["Record onset time", "CT within 20m", "Notify Neurology"] },
      { id: "cl2", name: "Acute Coronary", items: ["ECG within 10m", "Aspirin unless contraindicated", "Cath lab alert"] },
    ],
  },
  rooms: {
    wards: [
      { id: "w1", name: "General Ward A", type: "General", beds: 20, occupied: 12, rate: 2500 },
      { id: "w2", name: "Cardiac HDU", type: "HDU", beds: 8, occupied: 6, rate: 6500 },
      { id: "w3", name: "ICU-1", type: "ICU", beds: 10, occupied: 9, rate: 12000 },
      { id: "w4", name: "Private Deluxe", type: "Private", beds: 6, occupied: 2, rate: 9000 },
    ],
    roomTypes: ["General", "Private", "Deluxe", "HDU", "ICU"],
    admissionReasons: ["Surgery", "Observation", "Medical", "Maternity", "Pediatrics"],
    autoAssign: {
      rules: [
        { reason: "Observation", prefer: "General", fallback: "Private" },
        { reason: "Surgery", prefer: "HDU", fallback: "ICU" },
        { reason: "Medical", prefer: "General", fallback: "Private" },
      ],
      lockWhenOccupancyAbovePct: 90,
    },
  },
  oncall: {
    departments: [
      { id: "d1", dept: "Cardiology", person: "Dr. Saniya Ruth", phone: "+91 94444 10001", start: "08:00", end: "20:00" },
      { id: "d2", dept: "Neurology", person: "Dr. Rao", phone: "+91 94444 10002", start: "08:00", end: "20:00" },
      { id: "d3", dept: "Anesthesia", person: "Dr. Iyer", phone: "+91 94444 10003", start: "08:00", end: "08:00" },
    ],
    codeTeams: [
      { code: "Code Blue", members: ["Anesthesia", "ICU Nurse", "ER Physician"] },
      { code: "Code Red", members: ["Security", "Facilities", "Fire Marshall"] },
    ],
  },
  notifications: {
    channels: { email: true, sms: true, push: true },
    quietHours: { start: "22:00", end: "06:00" },
    routing: [
      { severity: "Critical", to: ["ED Duty Doctor", "On-call Admin"], via: ["sms","push"] },
      { severity: "High", to: ["ED Charge Nurse"], via: ["push"] },
      { severity: "Normal", to: ["Department Heads"], via: ["email"] },
    ],
  },
  integrations: {
    fhir: { enabled: false, baseUrl: "", token: "" },
    hl7: { enabled: false, endpoint: "" },
    webhooks: [{ id: "wh1", event: "appointment.created", url: "https://example.tld/hooks/appt", secret: "xxxx" }],
  },
};

const seedAudit = [
  { at: Date.now()-3600_000, who: "admin", action: "Initialized settings" },
];

/* -------------------------------- Helpers ------------------------------- */
const currency = (n, code="INR", loc="en-IN") => new Intl.NumberFormat(loc, { style:"currency", currency:code, maximumFractionDigits:0 }).format(n);
const toCSV = (rows) => {
  const head = ["name","type","beds","occupied","rate"];
  return [head.join(","), ...rows.map(r=> head.map(h=>`"${String(r[h]??"").replace(/"/g,'""')}"`).join(","))].join("\n");
};
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length<2) return { head:[], rows:[] };
  const head = lines[0].match(/("([^"]|"")*"|[^,]+)/g)?.map(h=>h.replace(/^"|"$/g,"").replace(/""/g,'"')) || [];
  const rows = lines.slice(1).map(line => (line.match(/("([^"]|"")*"|[^,]+)/g)||[]).map(c=>c.replace(/^"|"$/g,"").replace(/""/g,'"')));
  return { head, rows };
};

/* --------------------------------- Page --------------------------------- */
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(()=> load(LS.SETTINGS, seed));
  const [audit, setAudit] = useState(()=> load(LS.AUDIT, seedAudit));
  const [tab, setTab] = useState("General");
  const [toast, setToast] = useState(null);
  const fileRef = useRef(null);

  useEffect(()=> save(LS.SETTINGS, settings), [settings]);
  useEffect(()=> save(LS.AUDIT, audit), [audit]);

  const log = (who, action) => setAudit(a=>[{ at: Date.now(), who, action }, ...a].slice(0,80));
  const showToast = (t) => { setToast(t); setTimeout(()=>setToast(null), 2000); };

  /* ------------------------------ Actions ------------------------------ */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(settings,null,2)], { type:"application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `admin_settings_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };
  const importJSON = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const next = JSON.parse(text);
      setSettings(next);
      log("admin", "Imported settings JSON");
      showToast("Imported");
    } catch {
      showToast("Invalid JSON");
    }
  };

  const exportRoomsCSV = () => {
    const csv = toCSV(settings.rooms.wards);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "wards_rooms.csv";
    a.click(); URL.revokeObjectURL(a.href);
  };
  const importRoomsCSV = async (file) => {
    if (!file) return;
    const text = await file.text();
    const { head, rows } = parseCSV(text);
    if (!head.length) return showToast("Empty/invalid CSV");
    const idx = (k)=> head.findIndex(h=>h.toLowerCase()===k.toLowerCase());
    const wards = rows.map(cols=>({
      id: "w"+(Date.now()+Math.random()),
      name: cols[idx("name")]||"Unnamed",
      type: cols[idx("type")]||"General",
      beds: Number(cols[idx("beds")]||0),
      occupied: Number(cols[idx("occupied")]||0),
      rate: Number(cols[idx("rate")]||0),
    }));
    setSettings(s=>({...s, rooms:{ ...s.rooms, wards:[...wards, ...s.rooms.wards] }}));
    log("admin", "Imported rooms CSV");
    showToast("Rooms imported");
  };

  const occupancyPct = (w) => w.beds ? Math.round((w.occupied/w.beds)*100) : 0;
  const totalBeds = useMemo(()=> settings.rooms.wards.reduce((a,w)=>a+w.beds,0), [settings.rooms.wards]);
  const totalOccupied = useMemo(()=> settings.rooms.wards.reduce((a,w)=>a+w.occupied,0), [settings.rooms.wards]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 dark:from-zinc-900 dark:to-zinc-950 text-gray-900 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-white/80 dark:bg-zinc-900/70 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Settings className="text-sky-600" />
            <div>
              <h1 className="text-2xl font-extrabold">Admin Settings</h1>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Operations · Emergency · Rooms · On-Call · Integrations</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={exportJSON} className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm flex items-center gap-2"><Download size={16}/> Export JSON</button>
            <div className="relative">
              <input ref={fileRef} type="file" accept=".json" className="hidden"
                     onChange={(e)=>{const f=e.target.files?.[0]; if(f) importJSON(f); e.target.value="";}}/>
              <button onClick={()=>fileRef.current?.click()} className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-sm flex items-center gap-2"><Upload size={16}/> Import JSON</button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <nav className="max-w-7xl mx-auto px-4 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {["General","Emergency","Rooms & Admissions","On-Call & Escalation","Notifications","Integrations","Backup & Audit"].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-3 py-1.5 rounded-full text-sm border whitespace-nowrap ${tab===t?"bg-sky-600 text-white border-sky-600":"bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800"}`}>
                {t}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4 space-y-6">
        {tab==="General" && <GeneralPanel settings={settings} setSettings={setSettings} onSave={()=>{log("admin","Updated general"); showToast("Saved");}}/>}
        {tab==="Emergency" && <EmergencyPanel settings={settings} setSettings={setSettings} onChange={(msg)=>{log("admin",msg); showToast("Saved");}}/>}
        {tab==="Rooms & Admissions" && (
          <RoomsPanel
            settings={settings} setSettings={setSettings}
            onChange={(msg)=>{log("admin",msg); showToast("Saved");}}
            exportRoomsCSV={exportRoomsCSV}
            importRoomsCSV={importRoomsCSV}
            totals={{ totalBeds, totalOccupied }}
          />
        )}
        {tab==="On-Call & Escalation" && <OnCallPanel settings={settings} setSettings={setSettings} onChange={(m)=>{log("admin",m); showToast("Saved");}}/>}
        {tab==="Notifications" && <NotificationsPanel settings={settings} setSettings={setSettings} onChange={(m)=>{log("admin",m); showToast("Saved");}}/>}
        {tab==="Integrations" && <IntegrationsPanel settings={settings} setSettings={setSettings} onChange={(m)=>{log("admin",m); showToast("Saved");}}/>}
        {tab==="Backup & Audit" && <BackupAuditPanel audit={audit} clearAudit={()=>{ if(confirm("Clear audit log?")) setAudit([]); }} settings={settings}
                                                    exportJSON={exportJSON} importJSON={()=>fileRef.current?.click()} />}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y: 20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}
            className="fixed right-4 bottom-4 bg-gray-900 text-white px-4 py-2 rounded shadow max-w-[80vw]">
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------- Panels -------------------------------- */

function GeneralPanel({ settings, setSettings, onSave }) {
  const s = settings.general;
  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4">
      <header className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Building2/><h2 className="font-semibold">General</h2></div>
        <button onClick={onSave} className="px-3 py-2 rounded bg-emerald-600 text-white text-sm flex items-center gap-2"><Save size={16}/> Save</button>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Input label="Organisation Name" value={s.orgName} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, orgName:v}}))}/>
        <Input label="Timezone" value={s.timezone} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, timezone:v}}))}/>
        <Input label="Hospital Phone" value={s.phone} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, phone:v}}))}/>
        <Input label="Admin Email" value={s.email} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, email:v}}))}/>
        <Input label="Address" value={s.address} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, address:v}}))}/>
        <Input label="Currency Code" value={s.currency} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, currency:v}}))}/>
        <Input label="Locale" value={s.locale} onChange={(v)=>setSettings(p=>({...p, general:{...p.general, locale:v}}))}/>
      </div>
    </motion.section>
  );
}

function EmergencyPanel({ settings, setSettings, onChange }) {
  const e = settings.emergency;
  const [newChecklist, setNewChecklist] = useState("");

  const addPartner = () => {
    const name = prompt("Partner name?");
    if (!name) return;
    setSettings(s=>({...s, emergency:{...s.emergency, ambulancePartners:[...s.emergency.ambulancePartners, { id:"amb"+Date.now(), name, phone:"" }]}}));
    onChange("Added ambulance partner");
  };

  const addTriage = () => {
    setSettings(s=>({...s, emergency:{...s.emergency, triage:[...s.emergency.triage, { level:"New", color:"#64748b", targetMins:30, description:"" }]}}));
    onChange("Added triage level");
  };

  const addCode = () => {
    setSettings(s=>({...s, emergency:{...s.emergency, codes:[...s.emergency.codes, { code:"New Code", team:"", location:"", autoPage:false }]}}));
    onChange("Added code");
  };

  const addChecklist = () => {
    const v = newChecklist.trim(); if(!v) return;
    setSettings(s=>({...s, emergency:{...s.emergency, checklists:[...s.emergency.checklists, { id:"cl"+Date.now(), name:v, items:[] }]}}));
    setNewChecklist(""); onChange("Added checklist");
  };

  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4 space-y-6">
      <header className="flex items-center gap-2"><ShieldPlus/><h2 className="font-semibold">Emergency Department</h2></header>

      {/* Capacity / Diversion */}
      <div className="grid sm:grid-cols-2 gap-3">
        <NumberInput label="ED Capacity (patients)" value={e.edCapacity} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, edCapacity: +v||0}}))}/>
        <Toggle label="Diversion Mode (Ambulances redirect)" checked={e.diversion} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, diversion:v}}))}/>
      </div>

      {/* Ambulance partners */}
      <Block title="Ambulance Partners" icon={<Ambulance/>} actions={<button onClick={addPartner} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>}>
        <div className="grid md:grid-cols-2 gap-2">
          {e.ambulancePartners.map(p=>(
            <div key={p.id} className="border rounded-lg p-2 dark:border-zinc-800">
              <Input label="Name" value={p.name} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, ambulancePartners:s.emergency.ambulancePartners.map(x=>x.id===p.id?{...x, name:v}:x)}}))}/>
              <Input label="Phone" value={p.phone} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, ambulancePartners:s.emergency.ambulancePartners.map(x=>x.id===p.id?{...x, phone:v}:x)}}))}/>
              <div className="flex justify-end">
                <button onClick={()=>setSettings(s=>({...s, emergency:{...s.emergency, ambulancePartners:s.emergency.ambulancePartners.filter(x=>x.id!==p.id)}}))} className="mt-2 px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Block>

      {/* Triage levels */}
      <Block title="Triage Levels" icon={<Activity/>} actions={<button onClick={addTriage} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>}>
        <div className="space-y-2">
          {e.triage.map((t, i)=>(
            <div key={i} className="grid md:grid-cols-4 gap-2 items-center border rounded-lg p-2 dark:border-zinc-800">
              <Input label="Level" value={t.level} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, triage:s.emergency.triage.map((x,ix)=>ix===i?{...x, level:v}:x)}}))}/>
              <Input label="Color" type="color" value={t.color} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, triage:s.emergency.triage.map((x,ix)=>ix===i?{...x, color:v}:x)}}))}/>
              <NumberInput label="Target (mins)" value={t.targetMins} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, triage:s.emergency.triage.map((x,ix)=>ix===i?{...x, targetMins:+v||0}:x)}}))}/>
              <Input label="Description" value={t.description} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, triage:s.emergency.triage.map((x,ix)=>ix===i?{...x, description:v}:x)}}))}/>
            </div>
          ))}
        </div>
      </Block>

      {/* Codes */}
      <Block title="Facility Codes" icon={<AlertTriangle/>} actions={<button onClick={addCode} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>}>
        <div className="space-y-2">
          {e.codes.map((c, i)=>(
            <div key={i} className="grid md:grid-cols-4 gap-2 items-center border rounded-lg p-2 dark:border-zinc-800">
              <Input label="Code" value={c.code} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, codes:s.emergency.codes.map((x,ix)=>ix===i?{...x, code:v}:x)}}))}/>
              <Input label="Team" value={c.team} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, codes:s.emergency.codes.map((x,ix)=>ix===i?{...x, team:v}:x)}}))}/>
              <Input label="Location" value={c.location} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, codes:s.emergency.codes.map((x,ix)=>ix===i?{...x, location:v}:x)}}))}/>
              <Toggle label="Auto Page" checked={!!c.autoPage} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, codes:s.emergency.codes.map((x,ix)=>ix===i?{...x, autoPage:v}:x)}}))}/>
            </div>
          ))}
        </div>
      </Block>

      {/* Checklists */}
      <Block title="Emergency Checklists" icon={<FileSpreadsheet/>} actions={
        <div className="flex items-center gap-2">
          <input value={newChecklist} onChange={(e)=>setNewChecklist(e.target.value)} placeholder="Checklist name…" className="px-2 py-1 border rounded text-sm dark:border-zinc-800"/>
          <button onClick={addChecklist} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>
        </div>
      }>
        <div className="space-y-2">
          {e.checklists.map(cl=>(
            <div key={cl.id} className="border rounded-lg p-2 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <Input label="Name" value={cl.name} onChange={(v)=>setSettings(s=>({...s, emergency:{...s.emergency, checklists:s.emergency.checklists.map(x=>x.id===cl.id?{...x, name:v}:x)}}))}/>
                <button onClick={()=>setSettings(s=>({...s, emergency:{...s.emergency, checklists:s.emergency.checklists.filter(x=>x.id!==cl.id)}}))} className="h-8 mt-5 px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Remove</button>
              </div>
              <TagEditor label="Items" value={cl.items} onChange={(items)=>setSettings(s=>({...s, emergency:{...s.emergency, checklists:s.emergency.checklists.map(x=>x.id===cl.id?{...x, items}:x)}}))}/>
            </div>
          ))}
        </div>
      </Block>
    </motion.section>
  );
}

function RoomsPanel({ settings, setSettings, onChange, exportRoomsCSV, importRoomsCSV, totals }) {
  const fileRef = useRef(null);
  const wards = settings.rooms.wards;
  const [query, setQuery] = useState("");

  const filtered = useMemo(()=>{
    const s = query.trim().toLowerCase();
    if (!s) return wards;
    return wards.filter(w => [w.name, w.type].join(" ").toLowerCase().includes(s));
  }, [wards, query]);

  const addWard = () => {
    setSettings(s=>({...s, rooms:{...s.rooms, wards:[{ id:"w"+Date.now(), name:"New Ward", type:"General", beds:0, occupied:0, rate:0 }, ...s.rooms.wards]}}));
    onChange("Added ward");
  };
  const removeWard = (id) => {
    setSettings(s=>({...s, rooms:{...s.rooms, wards:s.rooms.wards.filter(w=>w.id!==id)}}));
    onChange("Removed ward");
  };

  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Bed/><h2 className="font-semibold">Rooms & Admissions</h2></div>
        <div className="flex items-center gap-2">
          <button onClick={addWard} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add Ward</button>
          <button onClick={exportRoomsCSV} className="px-2 py-1 rounded border text-xs"><Download size={14}/> Export CSV</button>
          <div className="relative">
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f) importRoomsCSV(f); e.target.value="";}}/>
            <button onClick={()=>fileRef.current?.click()} className="px-2 py-1 rounded border text-xs"><Upload size={14}/> Import CSV</button>
          </div>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-3">
        <StatCard label="Total Beds" value={totals.totalBeds}/>
        <StatCard label="Occupied" value={totals.totalOccupied}/>
        <StatCard label="Occupancy" value={`${totals.totalBeds?Math.round((totals.totalOccupied/totals.totalBeds)*100):0}%`}/>
      </div>

      {/* Search & room types */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2">
          <Search size={16} className="text-gray-500" />
          <input placeholder="Search ward / type…" value={query} onChange={(e)=>setQuery(e.target.value)} className="bg-transparent outline-none text-sm"/>
        </div>
        <TagEditor label="Room Types" value={settings.rooms.roomTypes} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, roomTypes:v}}))}/>
        <TagEditor label="Admission Reasons" value={settings.rooms.admissionReasons} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, admissionReasons:v}}))}/>
      </div>

      {/* Auto-assign rules */}
      <Block title="Auto-Assign Rules" icon={<Users2/>}>
        <div className="space-y-2">
          {settings.rooms.autoAssign.rules.map((r, i)=>(
            <div key={i} className="grid md:grid-cols-4 gap-2 items-center border rounded-lg p-2 dark:border-zinc-800">
              <Select label="Reason" value={r.reason} options={settings.rooms.admissionReasons} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, autoAssign:{...s.rooms.autoAssign, rules:s.rooms.autoAssign.rules.map((x,ix)=>ix===i?{...x, reason:v}:x)}}}))}/>
              <Select label="Prefer" value={r.prefer} options={settings.rooms.roomTypes} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, autoAssign:{...s.rooms.autoAssign, rules:s.rooms.autoAssign.rules.map((x,ix)=>ix===i?{...x, prefer:v}:x)}}}))}/>
              <Select label="Fallback" value={r.fallback} options={settings.rooms.roomTypes} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, autoAssign:{...s.rooms.autoAssign, rules:s.rooms.autoAssign.rules.map((x,ix)=>ix===i?{...x, fallback:v}:x)}}}))}/>
              <div className="flex justify-end">
                <button onClick={()=>setSettings(s=>({...s, rooms:{...s.rooms, autoAssign:{...s.rooms.autoAssign, rules:s.rooms.autoAssign.rules.filter((_,ix)=>ix!==i)}}}))} className="px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Remove</button>
              </div>
            </div>
          ))}
          <button onClick={()=>setSettings(s=>({...s, rooms:{...s.rooms, autoAssign:{...s.rooms.autoAssign, rules:[...s.rooms.autoAssign.rules, { reason:"Observation", prefer:"General", fallback:"Private"}]}}}))} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add Rule</button>
          <NumberInput label="Lock Admissions above occupancy (%)" value={settings.rooms.autoAssign.lockWhenOccupancyAbovePct}
                       onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, autoAssign:{...s.rooms.autoAssign, lockWhenOccupancyAbovePct:+v||0}}}))}/>
        </div>
      </Block>

      {/* Wards table/cards */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-sky-50 dark:bg-zinc-800/60">
            <tr>
              <th className="px-3 py-2 text-left">Ward</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Beds</th>
              <th className="px-3 py-2">Occupied</th>
              <th className="px-3 py-2">Rate</th>
              <th className="px-3 py-2">Occupancy</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-zinc-800">
            {filtered.map(w=>(
              <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                <td className="px-3 py-2">
                  <Input value={w.name} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, wards:s.rooms.wards.map(x=>x.id===w.id?{...x, name:v}:x)}}))}/>
                </td>
                <td className="px-3 py-2">
                  <Select value={w.type} options={settings.rooms.roomTypes} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, wards:s.rooms.wards.map(x=>x.id===w.id?{...x, type:v}:x)}}))}/>
                </td>
                <td className="px-3 py-2"><NumberInput value={w.beds} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, wards:s.rooms.wards.map(x=>x.id===w.id?{...x, beds:+v||0}:x)}}))}/></td>
                <td className="px-3 py-2"><NumberInput value={w.occupied} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, wards:s.rooms.wards.map(x=>x.id===w.id?{...x, occupied:Math.min(+v||0, (x.beds||0))}:x)}}))}/></td>
                <td className="px-3 py-2"><NumberInput value={w.rate} onChange={(v)=>setSettings(s=>({...s, rooms:{...s.rooms, wards:s.rooms.wards.map(x=>x.id===w.id?{...x, rate:+v||0}:x)}}))}/></td>
                <td className="px-3 py-2 text-center">{w.beds?Math.round((w.occupied/w.beds)*100):0}%</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={()=>removeWard(w.id)} className="px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">No wards match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

function OnCallPanel({ settings, setSettings, onChange }) {
  const oc = settings.oncall;
  const addRoster = () => {
    setSettings(s=>({...s, oncall:{...s.oncall, departments:[...s.oncall.departments, { id:"d"+Date.now(), dept:"New Dept", person:"", phone:"", start:"08:00", end:"20:00" }]}}));
    onChange("Added on-call entry");
  };
  const addCodeTeam = () => {
    setSettings(s=>({...s, oncall:{...s.oncall, codeTeams:[...s.oncall.codeTeams, { code:"Code X", members:[] }]}}));
    onChange("Added code team");
  };
  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4 space-y-4">
      <header className="flex items-center gap-2"><Clock/><h2 className="font-semibold">On-Call & Escalation</h2></header>

      <Block title="On-Call Roster" icon={<Users2/>} actions={<button onClick={addRoster} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>}>
        <div className="space-y-2">
          {oc.departments.map(r=>(
            <div key={r.id} className="grid md:grid-cols-6 gap-2 items-center border rounded-lg p-2 dark:border-zinc-800">
              <Input label="Dept" value={r.dept} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, departments:s.oncall.departments.map(x=>x.id===r.id?{...x, dept:v}:x)}}))}/>
              <Input label="Person" value={r.person} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, departments:s.oncall.departments.map(x=>x.id===r.id?{...x, person:v}:x)}}))}/>
              <Input label="Phone" value={r.phone} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, departments:s.oncall.departments.map(x=>x.id===r.id?{...x, phone:v}:x)}}))}/>
              <Input label="Start" type="time" value={r.start} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, departments:s.oncall.departments.map(x=>x.id===r.id?{...x, start:v}:x)}}))}/>
              <Input label="End" type="time" value={r.end} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, departments:s.oncall.departments.map(x=>x.id===r.id?{...x, end:v}:x)}}))}/>
              <div className="flex justify-end">
                <button onClick={()=>setSettings(s=>({...s, oncall:{...s.oncall, departments:s.oncall.departments.filter(x=>x.id!==r.id)}}))} className="px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="Code Teams" icon={<AlertTriangle/>} actions={<button onClick={addCodeTeam} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>}>
        <div className="space-y-2">
          {oc.codeTeams.map((t, i)=>(
            <div key={i} className="border rounded-lg p-2 dark:border-zinc-800">
              <Input label="Code" value={t.code} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, codeTeams:s.oncall.codeTeams.map((x,ix)=>ix===i?{...x, code:v}:x)}}))}/>
              <TagEditor label="Members (roles)" value={t.members} onChange={(v)=>setSettings(s=>({...s, oncall:{...s.oncall, codeTeams:s.oncall.codeTeams.map((x,ix)=>ix===i?{...x, members:v}:x)}}))}/>
            </div>
          ))}
        </div>
      </Block>
    </motion.section>
  );
}

function NotificationsPanel({ settings, setSettings, onChange }) {
  const n = settings.notifications;
  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4 space-y-4">
      <header className="flex items-center gap-2"><Bell/><h2 className="font-semibold">Notifications</h2></header>

      <div className="grid sm:grid-cols-3 gap-3">
        <Toggle label="Email" checked={n.channels.email} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, channels:{...s.notifications.channels, email:v}}}))}/>
        <Toggle label="SMS" checked={n.channels.sms} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, channels:{...s.notifications.channels, sms:v}}}))}/>
        <Toggle label="Push" checked={n.channels.push} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, channels:{...s.notifications.channels, push:v}}}))}/>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Quiet Hours Start" type="time" value={n.quietHours.start} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, quietHours:{...s.notifications.quietHours, start:v}}}))}/>
        <Input label="Quiet Hours End" type="time" value={n.quietHours.end} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, quietHours:{...s.notifications.quietHours, end:v}}}))}/>
      </div>

      <Block title="Routing Rules" icon={<PlugZap/>}>
        <div className="space-y-2">
          {n.routing.map((r, i)=>(
            <div key={i} className="grid md:grid-cols-3 gap-2 items-center border rounded-lg p-2 dark:border-zinc-800">
              <Select label="Severity" value={r.severity} options={["Critical","High","Normal"]} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, routing:s.notifications.routing.map((x,ix)=>ix===i?{...x, severity:v}:x)}}))}/>
              <TagEditor label="Recipients (roles)" value={r.to} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, routing:s.notifications.routing.map((x,ix)=>ix===i?{...x, to:v}:x)}}))}/>
              <TagEditor label="Via (email/sms/push)" value={r.via} onChange={(v)=>setSettings(s=>({...s, notifications:{...s.notifications, routing:s.notifications.routing.map((x,ix)=>ix===i?{...x, via:v}:x)}}))}/>
            </div>
          ))}
          <button onClick={()=>setSettings(s=>({...s, notifications:{...s.notifications, routing:[...s.notifications.routing, { severity:"Normal", to:[], via:["email"]}]}}))} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add Rule</button>
        </div>
      </Block>
    </motion.section>
  );
}

function IntegrationsPanel({ settings, setSettings, onChange }) {
  const i = settings.integrations;
  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4 space-y-4">
      <header className="flex items-center gap-2"><PlugZap/><h2 className="font-semibold">Integrations</h2></header>

      <Block title="FHIR" icon={<Link2/>}>
        <div className="grid sm:grid-cols-3 gap-3">
          <Toggle label="Enabled" checked={i.fhir.enabled} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, fhir:{...s.integrations.fhir, enabled:v}}}))}/>
          <Input label="Base URL" value={i.fhir.baseUrl} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, fhir:{...s.integrations.fhir, baseUrl:v}}}))}/>
          <Input label="Token" value={i.fhir.token} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, fhir:{...s.integrations.fhir, token:v}}}))} />
        </div>
      </Block>

      <Block title="HL7" icon={<KeyRound/>}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Toggle label="Enabled" checked={i.hl7.enabled} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, hl7:{...s.integrations.hl7, enabled:v}}}))}/>
          <Input label="Endpoint" value={i.hl7.endpoint} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, hl7:{...s.integrations.hl7, endpoint:v}}}))}/>
        </div>
      </Block>

      <Block title="Webhooks" icon={<PlugZap/>} actions={<button onClick={()=>setSettings(s=>({...s, integrations:{...s.integrations, webhooks:[...s.integrations.webhooks, { id:"wh"+Date.now(), event:"", url:"", secret:"" }]}}))} className="px-2 py-1 rounded border text-xs"><Plus size={14}/> Add</button>}>
        <div className="space-y-2">
          {i.webhooks.map(w=>(
            <div key={w.id} className="grid md:grid-cols-4 gap-2 items-center border rounded-lg p-2 dark:border-zinc-800">
              <Input label="Event" value={w.event} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, webhooks:s.integrations.webhooks.map(x=>x.id===w.id?{...x, event:v}:x)}}))}/>
              <Input label="URL" value={w.url} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, webhooks:s.integrations.webhooks.map(x=>x.id===w.id?{...x, url:v}:x)}}))}/>
              <Input label="Secret" value={w.secret} onChange={(v)=>setSettings(s=>({...s, integrations:{...s.integrations, webhooks:s.integrations.webhooks.map(x=>x.id===w.id?{...x, secret:v}:x)}}))}/>
              <div className="flex justify-end">
                <button onClick={()=>setSettings(s=>({...s, integrations:{...s.integrations, webhooks:s.integrations.webhooks.filter(x=>x.id!==w.id)}}))} className="px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Block>
    </motion.section>
  );
}

function BackupAuditPanel({ audit, clearAudit, settings, exportJSON, importJSON }) {
  return (
    <motion.section initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow p-4 space-y-4">
      <header className="flex items-center gap-2"><FileSpreadsheet/><h2 className="font-semibold">Backup & Audit</h2></header>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border rounded-lg p-3 dark:border-zinc-800">
          <div className="font-medium mb-2">Backup</div>
          <p className="text-sm opacity-80 mb-2">Export or import full Admin Settings JSON.</p>
          <div className="flex items-center gap-2">
            <button onClick={exportJSON} className="px-3 py-2 rounded bg-sky-600 text-white text-sm"><Download size={16}/> Export JSON</button>
            <button onClick={importJSON} className="px-3 py-2 rounded bg-white dark:bg-zinc-900 border text-sm"><Upload size={16}/> Import JSON</button>
          </div>
        </div>

        <div className="border rounded-lg p-3 dark:border-zinc-800">
          <div className="font-medium mb-2">Audit Log</div>
          <div className="max-h-[260px] overflow-y-auto text-sm divide-y dark:divide-zinc-800">
            {audit.length===0 ? <div className="py-6 text-center opacity-70">No audit entries.</div> : audit.map((a,i)=>(
              <div key={i} className="py-2 flex items-center justify-between">
                <div>
                  <div className="font-medium">{a.action}</div>
                  <div className="text-xs opacity-70">{new Date(a.at).toLocaleString()} · {a.who}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-end">
            <button onClick={clearAudit} className="px-2 py-1 rounded bg-rose-600 text-white text-xs"><Trash2 size={14}/> Clear Log</button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

/* ----------------------------- UI Primitives ---------------------------- */
function Input({ label, value, onChange, type="text" }) {
  return (
    <div>
      {label && <label className="text-xs font-medium">{label}</label>}
      <input type={type} value={value ?? ""} onChange={(e)=>onChange(e.target.value)}
        className="mt-1 w-full p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"/>
    </div>
  );
}
function NumberInput({ label, value, onChange }) {
  return (
    <div>
      {label && <label className="text-xs font-medium">{label}</label>}
      <input type="number" value={value ?? 0} onChange={(e)=>onChange(e.target.value)}
        className="mt-1 w-full p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm"/>
    </div>
  );
}
function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 select-none">
      <span className="text-sm">{label}</span>
      <button onClick={()=>onChange(!checked)} className={`w-10 h-6 rounded-full ${checked?"bg-emerald-600":"bg-slate-300"} relative`}>
        <span className={`absolute top-0.5 ${checked?"left-5":"left-0.5"} w-5 h-5 rounded-full bg-white transition-all`}/>
      </button>
    </label>
  );
}
function Select({ label, value, options=[], onChange }) {
  return (
    <div>
      {label && <label className="text-xs font-medium">{label}</label>}
      <select value={value} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm">
        {options.map(o=><option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
function TagEditor({ label, value=[], onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v=input.trim(); if(!v) return; onChange(Array.from(new Set([...(value||[]), v]))); setInput(""); };
  return (
    <div className="w-full">
      {label && <label className="text-xs font-medium">{label}</label>}
      <div className="mt-1 flex flex-wrap gap-2">
        {(value||[]).map(t=>(
          <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-xs flex items-center gap-1">
            {t}
            <button onClick={()=>onChange(value.filter(x=>x!==t))} className="opacity-70 hover:opacity-100"><X size={12}/></button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input value={input} onChange={(e)=>setInput(e.target.value)} className="p-2 rounded border dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm flex-1" placeholder={`Add ${label?.toLowerCase?.()||"item"}`}/>
        <button onClick={add} className="px-3 py-2 rounded bg-white dark:bg-zinc-900 border dark:border-zinc-800 text-sm">Add</button>
      </div>
    </div>
  );
}
function Block({ title, icon, actions, children }) {
  return (
    <div className="border rounded-2xl dark:border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold">{icon}{title}</div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {children}
    </div>
  );
}
function StatCard({ label, value }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-3">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
