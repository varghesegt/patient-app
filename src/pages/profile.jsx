import React, { useState, useContext } from "react";
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
  User,
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

/* 🌍 Translations */
const STRINGS = {
  en: {
    tabs: { overview: "Overview", medical: "Medical History", reports: "Reports" },
    contactInfo: "Contact Info",
    bmi: "BMI",
    lastCheckup: "Last Checkup",
    bloodGroup: "Blood Group",
    conditions: "Conditions",
    allergies: "Allergies",
    prescriptions: "Prescriptions",
    labReports: "Lab Reports",
    addPlaceholder: {
      condition: "Add condition",
      allergy: "Add allergy",
      prescription: "Add prescription",
    },
    edit: "Edit",
    save: "Save",
    patientID: "Patient ID: #MEDI12345",
    age: "Age",
    gender: "Gender",
  },
  hi: {
    tabs: { overview: "सारांश", medical: "चिकित्सीय इतिहास", reports: "रिपोर्ट्स" },
    contactInfo: "संपर्क जानकारी",
    bmi: "बीएमआई",
    lastCheckup: "अंतिम जाँच",
    bloodGroup: "रक्त समूह",
    conditions: "बीमारियाँ",
    allergies: "एलर्जी",
    prescriptions: "प्रिस्क्रिप्शन्स",
    labReports: "लैब रिपोर्ट्स",
    addPlaceholder: {
      condition: "स्थिति जोड़ें",
      allergy: "एलर्जी जोड़ें",
      prescription: "प्रिस्क्रिप्शन जोड़ें",
    },
    edit: "संपादित करें",
    save: "सहेजें",
    patientID: "रोगी आईडी: #MEDI12345",
    age: "आयु",
    gender: "लिंग",
  },
  ta: {
    tabs: { overview: "மேலோட்டம்", medical: "மருத்துவ வரலாறு", reports: "அறிக்கைகள்" },
    contactInfo: "தொடர்பு தகவல்",
    bmi: "பிமி",
    lastCheckup: "கடைசி பரிசோதனை",
    bloodGroup: "இரத்த வகை",
    conditions: "நிலைகள்",
    allergies: "மூலக்கூறுகள்",
    prescriptions: "மருந்துகள்",
    labReports: "லேபாரட்டரி அறிக்கைகள்",
    addPlaceholder: {
      condition: "நிலை சேர்க்கவும்",
      allergy: "மூலக்கூறு சேர்க்கவும்",
      prescription: "மருந்து சேர்க்கவும்",
    },
    edit: "மாற்று",
    save: "சேமி",
    patientID: "நோயாளி ஐடி: #MEDI12345",
    age: "வயது",
    gender: "பாலினம்",
  },
};


export default function PatientProfile() {
  const { lang } = useContext(LanguageContext);
  const t = STRINGS[lang] || STRINGS.en;

  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({
    name: "Varghese GT",
    age: 32,
    gender: "Male",
    phone: "+91 98765 43210",
    email: "varghese.gt@example.com",
    bloodGroup: "O+",
    conditions: ["Hypertension"],
    allergies: ["Penicillin"],
    prescriptions: ["Atorvastatin 10mg", "Metformin 500mg"],
    labReports: ["Blood Test - Aug 2025", "ECG - Jul 2025"],
    lastCheckup: "2025-08-21",
    bmi: 24.5,
    avatar: null,
  });

  const [inputs, setInputs] = useState({ condition: "", allergy: "", prescription: "" });

  const handleAdd = (field) => {
    if (inputs[field].trim() !== "") {
      setProfile({ ...profile, [field + "s"]: [...profile[field + "s"], inputs[field]] });
      setInputs({ ...inputs, [field]: "" });
    }
  };

  const handleRemove = (field, idx) => {
    setProfile({
      ...profile,
      [field + "s"]: profile[field + "s"].filter((_, i) => i !== idx),
    });
  };

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfile({ ...profile, avatar: reader.result });
    reader.readAsDataURL(file);
  };

  const saveProfile = () => {
    setEditMode(false);
    setToast(`${t.save} ✅`);
    setTimeout(() => setToast(null), 2500);
  };

  const cardVariant = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="relative min-h-screen bg-gray-50 max-w-5xl mx-auto p-4 sm:p-6">
      {/* ✅ Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50"
          >
            <CheckCircle2 size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={
                profile.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.name
                )}&background=E5F4FF&color=0ea5e9&size=128`
              }
              alt="Profile"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-gray-200 shadow"
            />
            {editMode && (
              <label className="absolute bottom-0 right-0 bg-sky-500 p-1.5 rounded-full cursor-pointer hover:bg-sky-600 shadow">
                <Camera size={16} className="text-white" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
          <div>
            {editMode ? (
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleChange}
                className="text-xl sm:text-2xl font-bold border-b border-gray-300 p-1 outline-none focus:border-sky-400 w-full bg-transparent"
              />
            ) : (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name}</h2>
            )}
            <p className="text-gray-500 text-sm">{t.patientID}</p>
            <div className="flex gap-3 mt-1 text-xs sm:text-sm text-gray-600">
              <span><User size={14} className="inline text-sky-500" /> {t.age}: {profile.age}</span>
              <span>{t.gender}: {profile.gender}</span>
            </div>
          </div>
        </div>

        <button
          onClick={editMode ? saveProfile : () => setEditMode(true)}
          className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-md hover:bg-sky-600 shadow-md transition"
        >
          {editMode ? <Save size={18} /> : <Edit2 size={18} />}
          {editMode ? t.save : t.edit}
        </button>
      </div>

      {/* ✅ Tabs (desktop) */}
      <div className="hidden sm:flex gap-6 border-b border-gray-200 pb-2 mb-4">
        {["overview", "medical", "reports"].map((tKey) => (
          <button
            key={tKey}
            onClick={() => setTab(tKey)}
            className={`relative pb-1 text-sm font-medium ${
              tab === tKey ? "text-sky-600" : "text-gray-500 hover:text-sky-500"
            }`}
          >
            {t.tabs[tKey]}
            {tab === tKey && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded"
              />
            )}
          </button>
        ))}
      </div>

      {/* ✅ Mobile bottom tabs */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow flex justify-around py-2 z-40">
        {["overview", "medical", "reports"].map((tKey) => (
          <button
            key={tKey}
            onClick={() => setTab(tKey)}
            className={`flex-1 text-xs ${tab === tKey ? "text-sky-600 font-semibold" : "text-gray-500"}`}
          >
            {t.tabs[tKey]}
          </button>
        ))}
      </div>

      {/* ✅ Tab Content */}
      <AnimatePresence mode="wait">
        {/* Overview */}
        {tab === "overview" && (
          <motion.div
            key="overview"
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 sm:pb-0"
          >
            {/* Contact */}
            <div className="bg-white p-4 rounded-xl shadow-md border space-y-2">
              <h3 className="font-semibold text-gray-700">{t.contactInfo}</h3>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-sky-500" />
                {editMode ? (
                  <input type="text" name="phone" value={profile.phone} onChange={handleChange}
                    className="border p-1 rounded w-full text-sm" />
                ) : (
                  <span className="text-gray-700 text-sm">{profile.phone}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-sky-500" />
                {editMode ? (
                  <input type="email" name="email" value={profile.email} onChange={handleChange}
                    className="border p-1 rounded w-full text-sm" />
                ) : (
                  <span className="text-gray-700 text-sm">{profile.email}</span>
                )}
              </div>
            </div>

            {/* BMI, Checkup, Blood Group */}
            <div className="grid grid-cols-3 gap-3 sm:col-span-1">
              <div className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center">
                <Activity className="text-sky-500" size={18} />
                <p className="text-xs text-gray-500">{t.bmi}</p>
                <p className="font-semibold text-gray-800">{profile.bmi}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center">
                <Calendar className="text-sky-500" size={18} />
                <p className="text-xs text-gray-500">{t.lastCheckup}</p>
                <p className="font-semibold text-gray-800">{profile.lastCheckup}</p>
              </div>
              <div className="bg-white p-3 rounded-xl shadow-md flex flex-col items-center">
                <Droplet className="text-red-500" size={18} />
                <p className="text-xs text-gray-500">{t.bloodGroup}</p>
                <p className="font-semibold text-gray-800">{profile.bloodGroup}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Medical */}
        {tab === "medical" && (
          <motion.div
            key="medical"
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="space-y-4 pb-20 sm:pb-0"
          >
            {["conditions", "allergies", "prescriptions"].map((field) => (
              <div key={field} className="bg-white p-4 rounded-xl shadow-md border">
                <h4 className="font-semibold mb-2 flex items-center gap-2 capitalize text-sky-600">
                  {field === "conditions" && <Stethoscope size={16} />}
                  {field === "allergies" && <Droplet size={16} className="text-red-500" />}
                  {field === "prescriptions" && <Pill size={16} className="text-green-600" />}
                  {t[field]}
                </h4>
                <ul className="space-y-1">
                  {profile[field].map((item, i) => (
                    <li key={i} className="flex justify-between items-center bg-gray-50 px-3 py-1.5 rounded-lg">
                      <span className="text-gray-700">{item}</span>
                      {editMode && (
                        <button onClick={() => handleRemove(field.slice(0, -1), i)}
                          className="text-red-500 hover:text-red-700">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {editMode && (
                  <div className="flex mt-2 gap-2">
                    <input type="text" value={inputs[field.slice(0, -1)]}
                      onChange={(e) => setInputs({ ...inputs, [field.slice(0, -1)]: e.target.value })}
                      placeholder={t.addPlaceholder[field.slice(0, -1)]}
                      className="border p-1 rounded w-full text-sm" />
                    <button onClick={() => handleAdd(field.slice(0, -1))}
                      className="bg-sky-500 text-white px-2 rounded hover:bg-sky-600">
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Reports */}
        {tab === "reports" && (
          <motion.div
            key="reports"
            variants={cardVariant}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20 sm:pb-0"
          >
            {profile.labReports.map((report, i) => (
              <div key={i}
                className="bg-white p-4 rounded-xl shadow-md border flex justify-between items-center hover:shadow-lg transition">
                <div className="flex items-center gap-2">
                  <FileBarChart size={18} className="text-purple-500" />
                  <span className="text-gray-800">{report}</span>
                </div>
                {editMode && (
                  <button onClick={() => setProfile({ ...profile, labReports: profile.labReports.filter((_, idx) => idx !== i) })}
                    className="text-red-500 hover:text-red-700">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Floating Edit/Save Button on Mobile */}
      <div className="sm:hidden fixed bottom-16 right-4">
        <button
          onClick={editMode ? saveProfile : () => setEditMode(true)}
          className="bg-sky-500 text-white p-4 rounded-full shadow-lg hover:bg-sky-600"
        >
          {editMode ? <Save size={22} /> : <Edit2 size={22} />}
        </button>
      </div>
    </div>
  );
}
