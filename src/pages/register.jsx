// src/pages/Register.jsx
import React, { useState, useEffect, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Stethoscope,
  Building2,
  UserCircle,
  HeartPulse,
  Calendar,
  UserSquare,
  Languages,
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    title: "Create Account",
    subtitle: "Register as",
    in: "in MediLink360",
    selectRole: "Select Role",
    patient: "Patient",
    doctor: "Doctor",
    hospital: "Hospital Admin",
    name: "Full Name",
    email: "Email Address",
    password: "Password",
    confirmPassword: "Confirm Password",
    registeringFor: "Registering For",
    self: "Myself",
    family: "Family Member",
    relation: "Relation (e.g., Father, Mother, Child)",
    gender: "Gender",
    male: "Male ♂",
    female: "Female ♀",
    other: "Other",
    dob: "Date of Birth",
    bloodGroup: "Blood Group",
    chronic: "Chronic Conditions",
    otherCondition: "Other condition...",
    allergies: "Known Allergies",
    otherAllergy: "Other allergy...",
    specialization: "Specialization",
    license: "Medical License ID",
    hospitalName: "Hospital Name",
    hospitalCode: "Hospital Code / Reg No.",
    register: "Register",
    already: "Already have an account?",
    login: "Login here",
  },
  hi: {
    title: "खाता बनाएं",
    subtitle: "पंजीकरण करें",
    in: "में MediLink360",
    selectRole: "भूमिका चुनें",
    patient: "रोगी",
    doctor: "डॉक्टर",
    hospital: "अस्पताल व्यवस्थापक",
    name: "पूरा नाम",
    email: "ईमेल पता",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    registeringFor: "किसके लिए पंजीकरण कर रहे हैं",
    self: "स्वयं",
    family: "परिवार का सदस्य",
    relation: "संबंध (जैसे पिता, माता, बच्चा)",
    gender: "लिंग",
    male: "पुरुष ♂",
    female: "महिला ♀",
    other: "अन्य",
    dob: "जन्म तिथि",
    bloodGroup: "रक्त समूह",
    chronic: "दीर्घकालिक रोग",
    otherCondition: "अन्य रोग...",
    allergies: "ज्ञात एलर्जी",
    otherAllergy: "अन्य एलर्जी...",
    specialization: "विशेषज्ञता",
    license: "मेडिकल लाइसेंस आईडी",
    hospitalName: "अस्पताल का नाम",
    hospitalCode: "अस्पताल कोड / रजिस्ट्रेशन संख्या",
    register: "पंजीकरण करें",
    already: "पहले से खाता है?",
    login: "यहाँ लॉगिन करें",
  },
  ta: {
    title: "கணக்கு உருவாக்கவும்",
    subtitle: "பதிவு செய்யவும்",
    in: "MediLink360 இல்",
    selectRole: "பங்கு தேர்வு",
    patient: "நோயாளர்",
    doctor: "மருத்துவர்",
    hospital: "மருத்துவமனை நிர்வாகி",
    name: "முழுப் பெயர்",
    email: "மின்னஞ்சல் முகவரி",
    password: "கடவுச்சொல்",
    confirmPassword: "கடவுச்சொல்லை உறுதிப்படுத்தவும்",
    registeringFor: "யாருக்காக பதிவு செய்கிறீர்கள்",
    self: "நான்",
    family: "குடும்ப உறுப்பினர்",
    relation: "உறவு (உதா: தந்தை, தாய், குழந்தை)",
    gender: "பாலினம்",
    male: "ஆண் ♂",
    female: "பெண் ♀",
    other: "மற்றவை",
    dob: "பிறந்த தேதி",
    bloodGroup: "இரத்த வகை",
    chronic: "நீண்டநாள் நோய்கள்",
    otherCondition: "மற்ற நோய்...",
    allergies: "அறியப்பட்ட ஒவ்வாமைகள்",
    otherAllergy: "மற்ற ஒவ்வாமை...",
    specialization: "சிறப்பியல்",
    license: "மருத்துவ உரிமம் ஐடி",
    hospitalName: "மருத்துவமனை பெயர்",
    hospitalCode: "மருத்துவமனை குறியீடு / பதிவு எண்",
    register: "பதிவு",
    already: "ஏற்கனவே கணக்கு உள்ளதா?",
    login: "இங்கே உள்நுழைக",
  },
};

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang, setLang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  const initialRole = location.state?.role || "patient";
  const [role, setRole] = useState(initialRole);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    registeringFor: "self",
    relation: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    chronicConditions: "",
    allergies: "",
    specialization: "",
    licenseId: "",
    hospitalName: "",
    hospitalCode: "",
  });

  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }
    alert(`🎉 ${t.register} ${role}!`);
    navigate("/login", { state: { role } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-sky-700">
            {t.title}
          </h2>
          <p className="text-gray-600 text-sm mt-2">
            {t.subtitle}{" "}
            <span className="font-semibold capitalize">{role}</span> {t.in}
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.selectRole}
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
          >
            <option value="patient">{t.patient}</option>
            <option value="doctor">{t.doctor}</option>
            <option value="hospital">{t.hospital}</option>
          </select>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="relative">
            <User className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              name="name"
              placeholder={t.name}
              value={form.name}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder={t.email}
              value={form.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              name="password"
              placeholder={t.password}
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="password"
              name="confirmPassword"
              placeholder={t.confirmPassword}
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          {/* Role Specific Fields */}
          <AnimatePresence mode="wait">
            {role === "patient" && (
              <motion.div
                key="patient"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                {/* Registering for */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.registeringFor}
                  </label>
                  <select
                    name="registeringFor"
                    value={form.registeringFor}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="self">{t.self}</option>
                    <option value="family">{t.family}</option>
                  </select>
                </div>

                {form.registeringFor === "family" && (
                  <div className="relative">
                    <UserSquare
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      name="relation"
                      placeholder={t.relation}
                      value={form.relation}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
                      required
                    />
                  </div>
                )}

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.gender}
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
                    required
                  >
                    <option value="">{t.gender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                    <option value="other">{t.other}</option>
                  </select>
                </div>

                {/* DOB */}
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="date"
                    name="dob"
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>

                {/* Blood Group */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.bloodGroup}
                  </label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
                    required
                  >
                    <option value="">{t.bloodGroup}</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </motion.div>
            )}

            {role === "doctor" && (
              <motion.div
                key="doctor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Stethoscope
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="specialization"
                    placeholder={t.specialization}
                    value={form.specialization}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>
                <div className="relative">
                  <UserCircle
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="licenseId"
                    placeholder={t.license}
                    value={form.licenseId}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>
              </motion.div>
            )}

            {role === "hospital" && (
              <motion.div
                key="hospital"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="space-y-4"
              >
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="hospitalName"
                    placeholder={t.hospitalName}
                    value={form.hospitalName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>
                <div className="relative">
                  <Building2
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="hospitalCode"
                    placeholder={t.hospitalCode}
                    value={form.hospitalCode}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 shadow-lg transition-all"
          >
            {t.register}
          </button>
        </form>

        {/* Login Link */}
        <p className="text-sm text-center text-gray-600 mt-6">
          {t.already}{" "}
          <Link
            to="/login"
            state={{ role }}
            className="text-sky-600 font-medium hover:underline"
          >
            {t.login}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
