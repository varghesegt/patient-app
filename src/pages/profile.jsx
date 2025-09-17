import React, { useState } from "react";
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
  FileText,
  Stethoscope,
  Pill,
  FileBarChart,
} from "lucide-react";

export default function PatientProfile() {
  const [editMode, setEditMode] = useState(false);
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState({
    name: "John Doe",
    age: 32,
    gender: "Male",
    phone: "+91 98765 43210",
    email: "john.doe@example.com",
    bloodGroup: "O+",
    conditions: ["Hypertension"],
    allergies: ["Penicillin"],
    prescriptions: ["Atorvastatin 10mg", "Metformin 500mg"],
    labReports: ["Blood Test - Aug 2025", "ECG - Jul 2025"],
    lastCheckup: "2025-08-21",
    bmi: 24.5,
    avatar: null,
  });

  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");
  const [newPrescription, setNewPrescription] = useState("");

  const handleChange = (e) =>
    setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = () => {
    setEditMode(false);
    setToast("Profile updated successfully ✅");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 relative">
      {/* ✅ Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 size={18} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <img
              src={
                profile.avatar ||
                "https://ui-avatars.com/api/?name=John+Doe&background=0ea5e9&color=fff&size=128"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-sky-200 transition group-hover:scale-105"
            />
            {editMode && (
              <label className="absolute bottom-0 right-0 bg-sky-600 p-2 rounded-full cursor-pointer hover:bg-sky-700 transition">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
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
                className="text-3xl font-bold border-b p-2"
              />
            ) : (
              <h2 className="text-3xl font-bold tracking-tight">
                {profile.name}
              </h2>
            )}
            <p className="text-gray-500 mt-1">Patient ID: #MEDI12345</p>
          </div>
        </div>
        <button
          onClick={editMode ? saveProfile : () => setEditMode(true)}
          className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-xl hover:bg-sky-700 transition"
        >
          {editMode ? <Save size={18} /> : <Edit2 size={18} />}
          {editMode ? "Save" : "Edit"}
        </button>
      </div>

      {/* Tabs */}
      <div className="relative flex gap-8 border-b mb-6">
        {["overview", "medical", "reports"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2 font-medium transition ${
              tab === t ? "text-sky-600" : "text-gray-500"
            }`}
          >
            {t === "overview"
              ? "Overview"
              : t === "medical"
              ? "Medical History"
              : "Reports & Prescriptions"}
            {tab === t && (
              <motion.div
                layoutId="underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-600"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-md space-y-3">
              <h3 className="font-semibold text-lg mb-2">Contact</h3>
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-sky-600" />
                {editMode ? (
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    className="border rounded p-1 w-full"
                  />
                ) : (
                  <p>{profile.phone}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-sky-600" />
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="border rounded p-1 w-full"
                  />
                ) : (
                  <p>{profile.email}</p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-sky-50 dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
              <Activity className="text-sky-600 mb-2" size={28} />
              <p className="font-medium">BMI</p>
              <p className="text-lg font-bold">{profile.bmi}</p>
            </div>
            <div className="bg-sky-50 dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center">
              <Calendar className="text-sky-600 mb-2" size={28} />
              <p className="font-medium">Last Checkup</p>
              <p className="text-lg font-bold">{profile.lastCheckup}</p>
            </div>
            <div className="bg-sky-50 dark:bg-gray-800 p-6 rounded-xl shadow-md flex flex-col items-center justify-center md:col-span-3">
              <Droplet className="text-sky-600 mb-2" size={28} />
              <p className="font-medium">Blood Group</p>
              <p className="text-lg font-bold">{profile.bloodGroup}</p>
            </div>
          </motion.div>
        )}

        {tab === "medical" && (
          <motion.div
            key="medical"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Conditions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Stethoscope size={18} /> Conditions
              </h4>
              <ul className="space-y-2">
                {profile.conditions.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
                  >
                    <span>{c}</span>
                    {editMode && (
                      <button
                        onClick={() =>
                          setProfile({
                            ...profile,
                            conditions: profile.conditions.filter(
                              (_, idx) => idx !== i
                            ),
                          })
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {editMode && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value)}
                    placeholder="Add condition"
                    className="border rounded p-2 flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newCondition.trim() !== "") {
                        setProfile({
                          ...profile,
                          conditions: [...profile.conditions, newCondition],
                        });
                        setNewCondition("");
                      }
                    }}
                    className="bg-sky-600 text-white px-3 py-2 rounded-lg hover:bg-sky-700 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Allergies */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileText size={18} /> Allergies
              </h4>
              <ul className="space-y-2">
                {profile.allergies.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
                  >
                    <span>{a}</span>
                    {editMode && (
                      <button
                        onClick={() =>
                          setProfile({
                            ...profile,
                            allergies: profile.allergies.filter(
                              (_, idx) => idx !== i
                            ),
                          })
                        }
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {editMode && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder="Add allergy"
                    className="border rounded p-2 flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAllergy.trim() !== "") {
                        setProfile({
                          ...profile,
                          allergies: [...profile.allergies, newAllergy],
                        });
                        setNewAllergy("");
                      }
                    }}
                    className="bg-sky-600 text-white px-3 py-2 rounded-lg hover:bg-sky-700 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {tab === "reports" && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Prescriptions */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Pill size={18} /> Prescriptions
              </h4>
              <ul className="space-y-2">
                {profile.prescriptions.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
                  >
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              {editMode && (
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={newPrescription}
                    onChange={(e) => setNewPrescription(e.target.value)}
                    placeholder="Add prescription"
                    className="border rounded p-2 flex-grow"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPrescription.trim() !== "") {
                        setProfile({
                          ...profile,
                          prescriptions: [
                            ...profile.prescriptions,
                            newPrescription,
                          ],
                        });
                        setNewPrescription("");
                      }
                    }}
                    className="bg-sky-600 text-white px-3 py-2 rounded-lg hover:bg-sky-700 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Lab Reports */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <FileBarChart size={18} /> Lab Reports
              </h4>
              <ul className="space-y-2">
                {profile.labReports.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg"
                  >
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
