import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Activity,
  Save,
  Edit2,
  Phone,
  Mail,
  Droplet,
  Plus,
  Trash2,
  Camera,
  CheckCircle2,
  Stethoscope,
  Pill,
  FileBarChart,
  Download,
  HeartPulse,
  Thermometer,
  Gauge,
  Watch,
  Search,
  ChevronRight,
  Bell,
  UploadCloud,
  Upload,
  Shield,
  ClipboardList,
  CalendarClock,
  Lock,
  Unlock,
} from "lucide-react";

/** Minimal i18n (single language) */
const STRINGS = {
  en: {
    tabs: {
      overview: "Overview",
      medical: "Medical",
      vitals: "Vitals",
      visits: "Visits",
      reports: "Reports",
    },
    contactInfo: "Contact Info",
    bmi: "BMI",
    height: "Height (cm)",
    weight: "Weight (kg)",
    lastCheckup: "Last Checkup",
    bloodGroup: "Blood Group",
    conditions: "Conditions",
    allergies: "Allergies",
    prescriptions: "Prescriptions",
    medications: "Medications",
    addPlaceholder: {
      condition: "Add condition",
      allergy: "Add allergy",
      prescription: "Add prescription",
      medName: "Medicine (e.g., Metformin)",
      medDose: "Dose (e.g., 500mg)",
      medFreq: "Times (e.g., 08:00,20:00)",
      reportTitle: "Report title (e.g., CBC - Sep 2025)",
      reportUrl: "Report link (pdf/image)",
      visitDoctor: "Doctor / Dept.",
      visitNotes: "Notes / follow-up",
    },
    edit: "Edit",
    save: "Save",
    exportPdf: "Export PDF",
    exportJson: "Backup JSON",
    importJson: "Restore JSON",
    notifications: "Reminders",
    patientID: "Patient ID: #MEDI12345",
    vitalsNow: "Live vitals (simulated)",
    add: "Add",
    view: "View",
    upload: "Upload",
    emergencyContacts: "Emergency Contacts",
    lock: "Lock",
    unlock: "Unlock",
    visitsHdr: "Visits & Notes",
    addVisit: "Add visit",
    noData: "No data yet",
    searchReports: "Search reports...",
    coverage: "Coverage",
    balance: "Balance",
  },
};

// ---- hooks & tiny utils ----------------------------------------------------
const useLocal = (key, initial) => {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
};

const Sparkline = ({ points = [], width = 120, height = 36, colorClass = "text-sky-600" }) => {
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const norm = (v) => height - ((v - min) / (max - min || 1)) * (height - 6) - 3;
  const step = width / Math.max(points.length - 1, 1);
  const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${i * step},${norm(v)}`).join(" ");
  return (
    <svg width={width} height={height} className={`opacity-90 ${colorClass}`}>
      <path d={d} fill="none" strokeWidth="2" stroke="currentColor" />
    </svg>
  );
};

const within = (v, [lo, hi]) => v >= lo && v <= hi;
const tone = (ok) => (ok ? "text-emerald-600" : "text-rose-600");

// ---- component -------------------------------------------------------------
export default function PatientDashboard() {
  const t = STRINGS.en;

  const [tab, setTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [toast, setToast] = useState(null);
  const [locked, setLocked] = useLocal("pp.locked", false);
  const [audit, setAudit] = useLocal("pp.audit", []);

  const [profile, setProfile] = useLocal("pp.profile", {
    name: "Varghese GT",
    age: 21,
    gender: "Male",
    phone: "+91 1234567890",
    email: "varghese.gt@example.com",
    bloodGroup: "O+",
    heightCm: 176,
    weightKg: 72,
    bmi: 23.2,
    lastCheckup: "2025-08-21",
    conditions: ["Hypertension"],
    allergies: ["Penicillin"],
    prescriptions: ["Atorvastatin 10mg", "Metformin 500mg"],
    medications: [
      { name: "Metformin", dose: "500mg", freq: "08:00,20:00", takenToday: {} },
      { name: "Atorvastatin", dose: "10mg", freq: "22:00", takenToday: {} },
    ],
    labReports: [
      { title: "CBC - Aug 2025", url: "", date: "2025-08-22", fileDataUrl: "" },
      { title: "ECG - Jul 2025", url: "", date: "2025-07-10", fileDataUrl: "" },
    ],
    visits: [
      { date: "2025-06-05", doctor: "Dr. Rao (Cardiology)", notes: "Routine review; continue meds" },
    ],
    contacts: [{ name: "Parent", relation: "Father", phone: "+91 98xxxxxx01" }],
    avatar: null,
  });

  const log = (msg) =>
    setAudit((a) => [{ ts: new Date().toISOString(), msg }, ...a].slice(0, 80));
  const mask = (s) => (locked ? s.replace(/.(?=.{4})/g, "•") : s);

  // --- strings & inputs ---
  const [inputs, setInputs] = useState({ condition: "", allergy: "", prescription: "" });
  const [newMed, setNewMed] = useState({ name: "", dose: "", freq: "" });
  const [newVisit, setNewVisit] = useState({ date: "", doctor: "", notes: "" });
  const [newReport, setNewReport] = useState({ title: "", url: "", date: "", fileDataUrl: "" });
  const [reportQuery, setReportQuery] = useState("");

  // --- edit helpers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: name === "age" ? +value : value });
  };
  const addSimple = (field) => {
    const key = field.slice(0, -1);
    if (!inputs[key]?.trim()) return;
    setProfile({ ...profile, [field]: [...profile[field], inputs[key].trim()] });
    setInputs({ ...inputs, [key]: "" });
    log(`Added ${key}`);
  };
  const removeFrom = (field, idx) => {
    setProfile({ ...profile, [field]: profile[field].filter((_, i) => i !== idx) });
    log(`Removed from ${field}`);
  };

  const saveProfile = () => {
    setEditMode(false);
    setToast(`${t.save} ✅`);
    setTimeout(() => setToast(null), 2000);
    log("Profile saved");
  };

  // --- BMI auto ---
  useEffect(() => {
    if (!profile.heightCm || !profile.weightKg) return;
    const h = profile.heightCm / 100;
    const bmi = +(profile.weightKg / (h * h)).toFixed(1);
    if (bmi !== profile.bmi) setProfile((p) => ({ ...p, bmi }));
  }, [profile.heightCm, profile.weightKg]);

  // --- vitals (simulated) ---
  const [hr, setHr] = useState(78);
  const [spo2, setSpo2] = useState(98);
  const [bp, setBp] = useState({ sys: 118, dia: 76 });
  const [temp, setTemp] = useState(36.7);
  const [hrSeries, setHrSeries] = useState([75, 77, 79, 80, 78, 76, 77]);
  const [spo2Series, setSpo2Series] = useState([98, 99, 98, 97, 98, 99, 98]);

  useEffect(() => {
    const id = setInterval(() => {
      setHr((v) => Math.max(55, Math.min(130, Math.round(v + (Math.random() - 0.5) * 4))));
      setSpo2((v) => Math.max(90, Math.min(100, Math.round(v + (Math.random() - 0.5) * 1))));
      setBp((b) => ({
        sys: Math.max(90, Math.min(150, Math.round(b.sys + (Math.random() - 0.5) * 3))),
        dia: Math.max(50, Math.min(95, Math.round(b.dia + (Math.random() - 0.5) * 2))),
      }));
      setTemp((t) =>
        Math.max(35.5, Math.min(39.5, +(t + (Math.random() - 0.5) * 0.05).toFixed(2)))
      );
      setHrSeries((s) => [...s.slice(-24), hr]);
      setSpo2Series((s) => [...s.slice(-24), spo2]);
    }, 1500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const HR_OK = [60, 100];
  const SPO2_OK = [95, 100];
  const TEMP_OK = [36.1, 37.2];
  const BP_SYS_OK = [90, 130];
  const BP_DIA_OK = [60, 85];

  // --- notifications for meds ---
  const [notifOn, setNotifOn] = useLocal("pp.notif", false);
  const askNotif = async () => {
    if (!("Notification" in window)) return alert("Notifications not supported");
    const perm = await Notification.requestPermission();
    const ok = perm === "granted";
    setNotifOn(ok);
    log(ok ? "Notifications enabled" : "Notifications denied");
  };
  useEffect(() => {
    if (!notifOn) return;
    const id = setInterval(() => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const tstr = `${hh}:${mm}`;
      profile.medications?.forEach((m) => {
        const times = (m.freq || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (times.includes(tstr) && !m.takenToday?.[tstr]) {
          new Notification("Medication Reminder", { body: `${m.name} ${m.dose} at ${tstr}` });
          log(`Reminder fired for ${m.name} ${tstr}`);
        }
      });
    }, 60000);
    return () => clearInterval(id);
  }, [notifOn, profile.medications]);

  // --- print to PDF ---
  const printableRef = useRef(null);
  const exportPDF = () => {
    const css =
      "@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.no-print{display:none!important}.print-container{padding:16px}.card{break-inside:avoid}}";
    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) return;
    const doc = win.document;
    doc.write(
      `<!doctype html><html><head><title>Patient Dashboard</title><meta charset='utf-8'/><style>${css}</style></head><body class='print-container' style="font-family: system-ui, Inter, Roboto">${printableRef.current?.innerHTML || ""}</body></html>`
    );
    doc.close();
    win.focus();
    win.print();
    log("Exported PDF");
  };

  // --- JSON backup/restore (restored) ---
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ profile, audit }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient_dashboard_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    log("Backup JSON downloaded");
  };
  const uploadJSON = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (d.profile) setProfile(d.profile);
        if (d.audit) setAudit(d.audit);
        log("Profile restored from JSON");
      } catch {
        alert("Invalid JSON");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  };

  // --- reports filter ---
  const filteredReports = useMemo(() => {
    const q = reportQuery.toLowerCase();
    return profile.labReports.filter((r) =>
      (r.title + (r.date || "")).toLowerCase().includes(q)
    );
  }, [profile.labReports, reportQuery]);

  const addReport = () => {
    if (!newReport.title.trim()) return;
    setProfile({ ...profile, labReports: [...profile.labReports, newReport] });
    setNewReport({ title: "", url: "", date: "", fileDataUrl: "" });
    log("Report added");
  };
  const onReportFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setNewReport((nr) => ({ ...nr, fileDataUrl: reader.result }));
    if (f.type.startsWith("image/")) reader.readAsDataURL(f);
    else alert("Inline preview supports images. PDFs will open via your viewer after export.");
  };

  // --- small helpers ---
  const cardVariant = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={
                  profile.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profile.name
                  )}&background=E5F4FF&color=0ea5e9&size=128`
                }
                alt="avatar"
                className="w-10 h-10 rounded-full border"
              />
              {editMode && (
                <label className="absolute -bottom-1 -right-1 bg-sky-500 p-1 rounded-full cursor-pointer">
                  <Camera size={12} className="text-white" />
                  <input className="hidden" type="file" accept="image/*" onChange={onAvatar} />
                </label>
              )}
            </div>
            <div>
              <div className="font-semibold leading-tight">{profile.name}</div>
              <div className="text-xs text-gray-500">{t.patientID}</div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50"
            >
              <Download size={16} /> {t.exportPdf}
            </button>
            <button
              onClick={downloadJSON}
              className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50"
            >
              <UploadCloud size={16} /> {t.exportJson}
            </button>
            <label className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50 cursor-pointer">
              <Upload size={16} /> {t.importJson}
              <input type="file" accept="application/json" className="hidden" onChange={uploadJSON} />
            </label>
            <button
              onClick={() => setLocked(!locked)}
              className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50"
            >
              {locked ? <Lock size={16} /> : <Unlock size={16} />}
              {locked ? t.lock : t.unlock}
            </button>
            <button
              onClick={
                editMode
                  ? () => {
                      setEditMode(false);
                      saveProfile();
                    }
                  : () => setEditMode(true)
              }
              className="inline-flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600"
            >
              {editMode ? <Save size={16} /> : <Edit2 size={16} />}
              {editMode ? t.save : "Edit"}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 py-4">
        {/* Sidebar (desktop) */}
        <div className="hidden md:block bg-white rounded-xl border shadow-sm p-2 h-fit sticky top-16">
          {Object.keys(t.tabs).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 ${
                tab === key ? "bg-sky-50 text-sky-700 font-medium" : "hover:bg-gray-50 text-gray-700"
              }`}
            >
              {t.tabs[key]}
            </button>
          ))}
        </div>

        {/* Main panel */}
        <div ref={printableRef}>
          <AnimatePresence mode="wait">
            {/* OVERVIEW */}
            {tab === "overview" && (
              <motion.div
                key="overview"
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              >
                {/* Contact & metrics */}
                <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3 lg:col-span-2">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Watch size={16} className="text-sky-500" />
                    {t.contactInfo}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <Phone size={16} className="text-sky-500" />
                      {editMode ? (
                        <input
                          name="phone"
                          value={profile.phone}
                          onChange={handleChange}
                          className="border p-2 rounded w-full text-sm"
                        />
                      ) : (
                        <span className="text-sm">{mask(profile.phone)}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={16} className="text-sky-500" />
                      {editMode ? (
                        <input
                          name="email"
                          value={profile.email}
                          onChange={handleChange}
                          className="border p-2 rounded w-full text-sm"
                        />
                      ) : (
                        <span className="text-sm">{mask(profile.email)}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <Activity className="text-sky-500 mx-auto" size={18} />
                      <div className="text-xs text-gray-500">{t.bmi}</div>
                      <div className="text-xl font-semibold">{profile.bmi}</div>
                      <div
                        className={`text-[11px] ${
                          tone(profile.bmi >= 18.5 && profile.bmi < 25)
                        }`}
                      >
                        {profile.bmi < 18.5
                          ? "Under"
                          : profile.bmi < 25
                          ? "Normal"
                          : profile.bmi < 30
                          ? "Over"
                          : "Obese"}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <Calendar className="text-sky-500 mx-auto" size={18} />
                      <div className="text-xs text-gray-500">{t.lastCheckup}</div>
                      <div className="text-sm font-medium">{profile.lastCheckup}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <Droplet className="text-red-500 mx-auto" size={18} />
                      <div className="text-xs text-gray-500">{t.bloodGroup}</div>
                      <div className="text-sm font-medium">{profile.bloodGroup}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <Gauge className="text-indigo-500 mx-auto" size={18} />
                      <div className="text-xs text-gray-500">
                        {t.height} / {t.weight}
                      </div>
                      <div className="text-sm font-medium">
                        {profile.heightCm}cm • {profile.weightKg}kg
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input
                        type="number"
                        name="heightCm"
                        value={profile.heightCm}
                        onChange={handleChange}
                        className="border p-2 rounded text-sm"
                        placeholder={t.height}
                      />
                      <input
                        type="number"
                        name="weightKg"
                        value={profile.weightKg}
                        onChange={handleChange}
                        className="border p-2 rounded text-sm"
                        placeholder={t.weight}
                      />
                      <div className="col-span-2 flex items-center gap-2">
                        <button
                          onClick={askNotif}
                          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-2"
                        >
                          <Bell size={14} /> {t.notifications}
                        </button>
                        <button
                          onClick={() => setLocked(!locked)}
                          className="border px-3 py-2 rounded text-sm inline-flex items-center gap-2"
                        >
                          {locked ? <Lock size={14} /> : <Unlock size={14} />}
                          {locked ? t.lock : t.unlock}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Medications quick view */}
                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Pill size={16} className="text-green-600" /> {t.medications}
                  </h3>
                  <div className="mt-2 space-y-2">
                    {profile.medications?.length ? (
                      profile.medications.map((m, i) => {
                        const times = (m.freq || "")
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                          >
                            <div>
                              <p className="font-medium text-gray-800">
                                {m.name}{" "}
                                <span className="text-xs text-gray-500">
                                  • {m.dose} • {times.join(" ") || "--:--"}
                                </span>
                              </p>
                              <div className="flex gap-2 mt-1 flex-wrap">
                                {times.map((tstr) => (
                                  <button
                                    key={tstr}
                                    onClick={() => {
                                      const taken = !!m.takenToday?.[tstr];
                                      setProfile({
                                        ...profile,
                                        medications: profile.medications.map((x, idx) =>
                                          idx === i
                                            ? {
                                                ...x,
                                                takenToday: {
                                                  ...(x.takenToday || {}),
                                                  [tstr]: !taken,
                                                },
                                              }
                                            : x
                                        ),
                                      });
                                    }}
                                    className={`text-[11px] px-2 py-0.5 rounded border ${
                                      m.takenToday?.[tstr]
                                        ? "bg-green-100 border-green-300 text-green-700"
                                        : "bg-white hover:bg-gray-100"
                                    }`}
                                  >
                                    {tstr} {m.takenToday?.[tstr] ? "✓" : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={askNotif}
                                className="text-xs px-2 py-1 rounded border bg-white hover:bg-gray-100 inline-flex items-center gap-1"
                              >
                                <Bell size={14} /> {t.notifications}
                              </button>
                              {editMode && (
                                <button
                                  onClick={() => {
                                    setProfile({
                                      ...profile,
                                      medications: profile.medications.filter((_, idx) => idx !== i),
                                    });
                                    log("Medication removed");
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-500">{t.noData}</p>
                    )}
                  </div>

                  {editMode && (
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <input
                        className="border p-2 rounded text-sm"
                        placeholder={STRINGS.en.addPlaceholder.medName}
                        value={newMed.name}
                        onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                      />
                      <input
                        className="border p-2 rounded text-sm"
                        placeholder={STRINGS.en.addPlaceholder.medDose}
                        value={newMed.dose}
                        onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
                      />
                      <input
                        className="border p-2 rounded text-sm"
                        placeholder={STRINGS.en.addPlaceholder.medFreq}
                        value={newMed.freq}
                        onChange={(e) => setNewMed({ ...newMed, freq: e.target.value })}
                      />
                      <button
                        onClick={() => {
                          if (!newMed.name.trim()) return;
                          setProfile({
                            ...profile,
                            medications: [...(profile.medications || []), { ...newMed, takenToday: {} }],
                          });
                          setNewMed({ name: "", dose: "", freq: "" });
                          log("Medication added");
                        }}
                        className="bg-sky-500 text-white px-3 py-2 rounded-md hover:bg-sky-600 inline-flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> {t.add}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* MEDICAL */}
            {tab === "medical" && (
              <motion.div
                key="medical"
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                {["conditions", "allergies", "prescriptions"].map((field) => (
                  <div key={field} className="bg-white rounded-xl border shadow-sm p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2 capitalize text-sky-600">
                      {field === "conditions" && <Stethoscope size={16} />}{" "}
                      {field === "allergies" && <Droplet size={16} className="text-red-500" />}{" "}
                      {field === "prescriptions" && <Pill size={16} className="text-green-600" />}
                      {t[field]}
                    </h4>
                    <ul className="space-y-1">
                      {profile[field].map((item, i) => (
                        <li
                          key={i}
                          className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg"
                        >
                          <span className="text-gray-700">{item}</span>
                          {editMode && (
                            <button
                              onClick={() => removeFrom(field, i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                    {editMode && (
                      <div className="flex mt-2 gap-2">
                        <input
                          value={inputs[field.slice(0, -1)]}
                          onChange={(e) =>
                            setInputs({ ...inputs, [field.slice(0, -1)]: e.target.value })
                          }
                          placeholder={STRINGS.en.addPlaceholder[field.slice(0, -1)]}
                          className="border p-2 rounded w-full text-sm"
                        />
                        <button
                          onClick={() => addSimple(field)}
                          className="bg-sky-500 text-white px-3 rounded hover:bg-sky-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Emergency Contacts */}
                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <h4 className="font-semibold mb-2 text-rose-600 flex items-center gap-2">
                    <Shield size={16} /> {t.emergencyContacts}
                  </h4>
                  <div className="space-y-2">
                    {profile.contacts?.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                      >
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">
                            {c.name} <span className="text-xs text-gray-500">• {c.relation}</span>
                          </p>
                          <p className="text-xs text-gray-600">{mask(c.phone)}</p>
                        </div>
                        <div className="flex gap-2">
                          <a className="text-sky-600 text-xs border px-2 py-1 rounded" href={`tel:${c.phone}`}>
                            Call
                          </a>
                          <a className="text-sky-600 text-xs border px-2 py-1 rounded" href={`sms:${c.phone}`}>
                            SMS
                          </a>
                          {editMode && (
                            <button
                              onClick={() => removeFrom("contacts", i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* VITALS */}
            {tab === "vitals" && (
              <motion.div
                key="vitals"
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <HeartPulse size={18} className="text-rose-500" /> {t.vitalsNow}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <HeartPulse size={16} /> <span className="text-xs text-gray-500">bpm</span>
                      </div>
                      <div className={`text-2xl font-semibold ${tone(within(hr, HR_OK))}`}>{hr}</div>
                      <div className="text-xs text-gray-500">Resting 60–100</div>
                      <div className="mt-1">
                        <Sparkline points={hrSeries} colorClass="text-rose-500" />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <Droplet size={16} /> <span className="text-xs text-gray-500">SpO₂</span>
                      </div>
                      <div className={`text-2xl font-semibold ${tone(within(spo2, SPO2_OK))}`}>
                        {spo2}%
                      </div>
                      <div className="text-xs text-gray-500">Normal ≥ 95%</div>
                      <div className="mt-1">
                        <Sparkline points={spo2Series} />
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <Gauge size={16} /> <span className="text-xs text-gray-500">BP</span>
                      </div>
                      <div
                        className={`text-2xl font-semibold ${
                          tone(within(bp.sys, BP_SYS_OK) && within(bp.dia, BP_DIA_OK))
                        }`}
                      >
                        {bp.sys}/{bp.dia}
                      </div>
                      <div className="text-xs text-gray-500">mmHg</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <Thermometer size={16} /> <span className="text-xs text-gray-500">°C</span>
                      </div>
                      <div className={`text-2xl font-semibold ${tone(within(temp, TEMP_OK))}`}>
                        {temp.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">36.1–37.2 normal</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <ClipboardList size={16} /> Manual vitals entry
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <input
                      type="number"
                      value={hr}
                      onChange={(e) => setHr(+e.target.value)}
                      className="border p-2 rounded text-sm"
                      placeholder="HR"
                    />
                    <input
                      type="number"
                      value={spo2}
                      onChange={(e) => setSpo2(+e.target.value)}
                      className="border p-2 rounded text-sm"
                      placeholder="SpO2"
                    />
                    <input
                      type="number"
                      value={bp.sys}
                      onChange={(e) => setBp({ ...bp, sys: +e.target.value })}
                      className="border p-2 rounded text-sm"
                      placeholder="Sys"
                    />
                    <input
                      type="number"
                      value={bp.dia}
                      onChange={(e) => setBp({ ...bp, dia: +e.target.value })}
                      className="border p-2 rounded text-sm"
                      placeholder="Dia"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(+e.target.value)}
                      className="border p-2 rounded text-sm"
                      placeholder="°C"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* VISITS */}
            {tab === "visits" && (
              <motion.div
                key="visits"
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="bg-white rounded-xl border shadow-sm p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <CalendarClock size={16} /> {t.visitsHdr}
                  </h4>
                  <div className="space-y-2">
                    {profile.visits?.length ? (
                      profile.visits.map((v, i) => (
                        <div
                          key={i}
                          className="flex items-start justify-between bg-gray-50 px-3 py-2 rounded-lg"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {v.date} • {v.doctor}
                            </p>
                            <p className="text-xs text-gray-600 whitespace-pre-wrap">{v.notes}</p>
                          </div>
                          {editMode && (
                            <button
                              onClick={() => removeFrom("visits", i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">{t.noData}</p>
                    )}
                  </div>

                  {editMode && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3">
                      <input
                        type="date"
                        className="border p-2 rounded text-sm"
                        value={newVisit.date}
                        onChange={(e) => setNewVisit({ ...newVisit, date: e.target.value })}
                      />
                      <input
                        className="border p-2 rounded text-sm"
                        placeholder={STRINGS.en.addPlaceholder.visitDoctor}
                        value={newVisit.doctor}
                        onChange={(e) => setNewVisit({ ...newVisit, doctor: e.target.value })}
                      />
                      <input
                        className="border p-2 rounded text-sm md:col-span-2"
                        placeholder={STRINGS.en.addPlaceholder.visitNotes}
                        value={newVisit.notes}
                        onChange={(e) => setNewVisit({ ...newVisit, notes: e.target.value })}
                      />
                      <button
                        onClick={() => {
                          if (!newVisit.date || !newVisit.doctor) return;
                          setProfile({ ...profile, visits: [...profile.visits, newVisit] });
                          setNewVisit({ date: "", doctor: "", notes: "" });
                          log("Visit added");
                        }}
                        className="bg-sky-500 text-white px-3 py-2 rounded-md hover:bg-sky-600 inline-flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> {t.addVisit}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* REPORTS */}
            {tab === "reports" && (
              <motion.div
                key="reports"
                variants={cardVariant}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <div className="flex items-center gap-2 no-print">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2" size={16} />
                    <input
                      className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
                      placeholder={t.searchReports}
                      value={reportQuery}
                      onChange={(e) => setReportQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={exportPDF}
                    className="hidden sm:inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50 shadow"
                  >
                    <Download size={16} /> {t.exportPdf}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredReports.length ? (
                    filteredReports.map((r, i) => (
                      <div
                        key={i}
                        className="bg-white rounded-xl border shadow-sm p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <FileBarChart size={20} className="text-purple-500" />
                          <div>
                            <p className="font-medium text-gray-800">{r.title}</p>
                            <p className="text-xs text-gray-500">{r.date}</p>
                            {r.fileDataUrl && (
                              <img
                                src={r.fileDataUrl}
                                alt="preview"
                                className="mt-2 w-40 h-24 object-cover rounded border"
                              />
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {r.url ? (
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 text-sm hover:underline flex items-center gap-1"
                            >
                              {t.view} <ChevronRight size={14} />
                            </a>
                          ) : null}
                          {editMode && (
                            <button
                              onClick={() => removeFrom("labReports", i)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">{t.noData}</p>
                  )}
                </div>

                {editMode && (
                  <div className="bg-white rounded-xl border shadow-sm p-4">
                    <h4 className="font-semibold mb-2">Add Report</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                      <input
                        className="border p-2 rounded text-sm"
                        placeholder={STRINGS.en.addPlaceholder.reportTitle}
                        value={newReport.title}
                        onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                      />
                      <input
                        className="border p-2 rounded text-sm"
                        placeholder={STRINGS.en.addPlaceholder.reportUrl}
                        value={newReport.url}
                        onChange={(e) => setNewReport({ ...newReport, url: e.target.value })}
                      />
                      <input
                        type="date"
                        className="border p-2 rounded text-sm"
                        value={newReport.date}
                        onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
                      />
                      <label className="border p-2 rounded text-sm cursor-pointer flex items-center justify-center gap-2">
                        <Upload size={16} /> {t.upload}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          onChange={onReportFile}
                        />
                      </label>
                      <button
                        onClick={addReport}
                        className="md:col-span-4 bg-sky-500 text-white px-3 py-2 rounded-md hover:bg-sky-600 inline-flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> {t.add}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow flex justify-around py-2 z-40">
        {Object.keys(t.tabs).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 text-[11px] ${
              tab === key ? "text-sky-600 font-semibold" : "text-gray-500"
            }`}
          >
            {t.tabs[key]}
          </button>
        ))}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle2 size={18} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
