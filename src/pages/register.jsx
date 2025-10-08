import React, { useState, useEffect, useContext, useMemo } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Stethoscope,
  Building2,
  UserCircle,
  Calendar,
  UserSquare,
  UploadCloud,
  FileBadge2,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  
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
    allergies: "Known Allergies",
    specialization: "Specialization",
    license: "Medical License ID",
    hospitalName: "Hospital Name",
    hospitalCode: "Hospital Code / Reg No.",
    height: "Height (cm)",
    weight: "Weight (kg)",
    phone: "Phone Number",
    address: "Address",
    emergencyContact: "Emergency Contact",
    relationShort: "Relation",
    uploadId: "Government ID / Insurance Card (PDF/JPG/PNG)",
    uploadHistory: "Medical Records (PDF/JPG/PNG)",
    uploadLicense: "Doctor License / Registration Proof (PDF/JPG/PNG)",
    uploadHospitalDocs: "Hospital Registration / Accreditation (PDF/JPG/PNG)",
    yearsExp: "Years of Experience",
    council: "Medical Council (e.g., MCI / NMC)",
    dept: "Department / Unit",
    beds: "Bed Capacity",
    emergencyDept: "24x7 Emergency Available",
    website: "Website (optional)",
    notes: "Notes (optional)",
    register: "Register",
    already: "Already have an account?",
    login: "Login here",
    pwdHint: "8+ chars, upper, number, symbol recommended",
    proofHint: "Max 10 MB each. We only store metadata in this demo.",
    consent: "I confirm the information is accurate and I agree to data processing.",
    reviewTitle: "Quick Review",
    edit: "Edit",
    submitNow: "Submit",
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
    registeringFor: "किसके लिए पंजीकरण",
    self: "स्वयं",
    family: "परिवार सदस्य",
    relation: "संबंध",
    gender: "लिंग",
    male: "पुरुष ♂",
    female: "महिला ♀",
    other: "अन्य",
    dob: "जन्म तिथि",
    bloodGroup: "रक्त समूह",
    chronic: "दीर्घकालिक रोग",
    allergies: "ज्ञात एलर्जी",
    specialization: "विशेषज्ञता",
    license: "मेडिकल लाइसेंस आईडी",
    hospitalName: "अस्पताल का नाम",
    hospitalCode: "अस्पताल कोड / रजिस्ट्रेशन",
    height: "लंबाई (सेमी)",
    weight: "वजन (किग्रा)",
    phone: "फ़ोन नंबर",
    address: "पता",
    emergencyContact: "आपातकालीन संपर्क",
    relationShort: "संबंध",
    uploadId: "सरकारी आईडी / बीमा कार्ड (PDF/JPG/PNG)",
    uploadHistory: "मेडिकल रिकॉर्ड (PDF/JPG/PNG)",
    uploadLicense: "डॉक्टर लाइसेंस / रजिस्ट्रेशन प्रमाण",
    uploadHospitalDocs: "अस्पताल रजिस्ट्रेशन / मान्यता",
    yearsExp: "अनुभव (वर्ष)",
    council: "मेडिकल काउंसिल",
    dept: "विभाग",
    beds: "बिस्तर क्षमता",
    emergencyDept: "24x7 इमरजेंसी उपलब्ध",
    website: "वेबसाइट (वैकल्पिक)",
    notes: "नोट्स (वैकल्पिक)",
    register: "पंजीकरण करें",
    already: "पहले से खाता है?",
    login: "यहाँ लॉगिन करें",
    pwdHint: "8+ अक्षर, बड़े अक्षर, संख्या, प्रतीक",
    proofHint: "प्रति फ़ाइल 10MB तक। यह डेमो केवल मेटाडेटा सहेजता है।",
    consent: "मैं पुष्टि करता/करती हूँ कि जानकारी सही है और डेटा प्रोसेसिंग से सहमत हूँ।",
    reviewTitle: "त्वरित समीक्षा",
    edit: "बदलें",
    submitNow: "सबमिट",
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
    email: "மின்னஞ்சல்",
    password: "கடவுச்சொல்",
    confirmPassword: "கடவுச்சொல் உறுதி",
    registeringFor: "யாருக்காக பதிவு",
    self: "நான்",
    family: "குடும்ப உறுப்பினர்",
    relation: "உறவு",
    gender: "பாலினம்",
    male: "ஆண் ♂",
    female: "பெண் ♀",
    other: "மற்றவை",
    dob: "பிறந்த தேதி",
    bloodGroup: "இரத்த வகை",
    chronic: "நீண்டநாள் நோய்கள்",
    allergies: "அறியப்பட்ட ஒவ்வாமைகள்",
    specialization: "சிறப்பியல்",
    license: "மருத்துவர் உரிமம் ஐடி",
    hospitalName: "மருத்துவமனை பெயர்",
    hospitalCode: "மருத்துவமனை குறியீடு / பதிவு",
    height: "உயரம் (செ.மீ)",
    weight: "எடை (கி.கி)",
    phone: "தொலைபேசி",
    address: "முகவரி",
    emergencyContact: "அவசர தொடர்பு",
    relationShort: "உறவு",
    uploadId: "அரசு ஐடி / காப்பீடு (PDF/JPG/PNG)",
    uploadHistory: "மருத்துவ பதிவுகள் (PDF/JPG/PNG)",
    uploadLicense: "மருத்துவர் உரிமம் / பதிவு சான்று",
    uploadHospitalDocs: "மருத்துவமனை பதிவு / அங்கீகாரம்",
    yearsExp: "அனுபவம் (ஆண்டுகள்)",
    council: "மெடிக்கல் கவுன்சில்",
    dept: "துறை",
    beds: "படுக்கைகள்",
    emergencyDept: "24x7 அவசரம்",
    website: "வலைத்தளம் (விருப்ப)",
    notes: "குறிப்புகள் (விருப்ப)",
    register: "பதிவு",
    already: "ஏற்கனவே கணக்கு?",
    login: "இங்கே உள்நுழைக",
    pwdHint: "8+ எழுத்துக்கள், பெரிய எழுத்து, எண், குறி",
    proofHint: "ஒவ்வொன்றும் 10MB வரை. டெமோவில் மெட்டாடேட்டா மட்டும்",
    consent: "தகவல் சரி என்று உறுதி செய்கிறேன் மற்றும் தரவு செயலாக்கத்திற்கு சம்மதம்",
    reviewTitle: "விரைவு மதிப்புரை",
    edit: "திருத்தம்",
    submitNow: "சமர்ப்பிக்க",
  },
};

const acceptTypes = ["application/pdf", "image/jpeg", "image/png"];
const maxSize = 10 * 1024 * 1024; // 10MB

function usePasswordStrength(password) {
  return useMemo(() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s; // 0..4
  }, [password]);
}

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  const initialRole = location.state?.role || "patient";
  const [role, setRole] = useState(initialRole);
  const [step, setStep] = useState(1); // 1: info, 2: review
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

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
    height: "",
    weight: "",
    phone: "",
    address: "",
    specialization: "",
    licenseId: "",
    yearsExp: "",
    council: "",
    dept: "",
    hospitalName: "",
    hospitalCode: "",
    beds: "",
    emergencyDept: false,
    website: "",
    notes: "",
    // files
    proofId: null,
    medicalHistory: null,
    regProof: null,
    hospitalDocs: null,
  });

  useEffect(() => setRole(initialRole), [initialRole]);

  useEffect(() => {
    // autosave draft
    try { localStorage.setItem("register:draft", JSON.stringify({ role, form })); } catch {}
  }, [role, form]);

  useEffect(() => {
    // restore draft
    try {
      const raw = localStorage.getItem("register:draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.role) setRole(parsed.role);
        if (parsed?.form) setForm({ ...form, ...parsed.form });
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const strength = usePasswordStrength(form.password);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const handleCheck = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.checked }));
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    const name = e.target.name;
    if (!file) return;
    if (!acceptTypes.includes(file.type) || file.size > maxSize) {
      setError(`${t.proofHint}`);
      return;
    }
    setError("");
    setForm((f) => ({ ...f, [name]: file }));
  };

  const validate = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) return false;
    if (form.password !== form.confirmPassword) return false;
    if (role === "patient") {
      if (!form.gender || !form.dob || !form.bloodGroup) return false;
      if (!form.proofId) return false; // require identity proof
    }
    if (role === "doctor") {
      if (!form.specialization || !form.licenseId) return false;
      if (!form.regProof) return false; // require license proof
    }
    if (role === "hospital") {
      if (!form.hospitalName || !form.hospitalCode) return false;
      if (!form.hospitalDocs) return false; // require accreditation/registration proof
    }
    if (!consent) return false;
    return true;
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!validate()) return setError("Please complete required fields and proofs.");
    setError("");
    setStep(2);
  };

  const handleSubmit = () => {
    if (!validate()) return setError("Please complete required fields and proofs.");
    // In real app: build FormData and POST to backend.
    console.log("Submitting payload", { role, form: { ...form, // do not log blobs in real apps
      proofId: form.proofId?.name, medicalHistory: form.medicalHistory?.name, regProof: form.regProof?.name, hospitalDocs: form.hospitalDocs?.name } });
    alert("🎉 Registered successfully (demo). Check console for payload.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4">
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-6 sm:p-8 relative">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-sky-700">{t.title}</h2>
          <p className="text-gray-600 text-sm mt-2">{t.subtitle} <span className="font-semibold capitalize">{role}</span> {t.in}</p>
        </div>

        {/* Role */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.selectRole}</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400">
            <option value="patient">{t.patient}</option>
            <option value="doctor">{t.doctor}</option>
            <option value="hospital">{t.hospital}</option>
          </select>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <div className={`h-2 flex-1 rounded-full ${step===1?"bg-sky-500":"bg-sky-200"}`} />
          <div className={`h-2 flex-1 rounded-full ${step===2?"bg-sky-500":"bg-sky-200"}`} />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="space-y-4"
              onSubmit={handleNext}>
              {/* Common */}
              <Field icon={<User size={18} />}>
                <input type="text" name="name" placeholder={t.name} value={form.name} onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
              </Field>
              <Field icon={<Mail size={18} />}>
                <input type="email" name="email" placeholder={t.email} value={form.email} onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
              </Field>
              <Field icon={<Lock size={18} />}>
                <input type="password" name="password" placeholder={t.password} value={form.password}
                  onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
              </Field>
              <PasswordMeter strength={strength} hint={t.pwdHint} />
              <Field icon={<Lock size={18} />}>
                <input type="password" name="confirmPassword" placeholder={t.confirmPassword} value={form.confirmPassword}
                  onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
              </Field>

              {/* Patient */}
              {role === "patient" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.registeringFor}</label>
                    <select name="registeringFor" value={form.registeringFor} onChange={handleChange}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400">
                      <option value="self">{t.self}</option>
                      <option value="family">{t.family}</option>
                    </select>
                  </div>
                  {form.registeringFor === "family" && (
                    <Field icon={<UserSquare size={18} /> }>
                      <input type="text" name="relation" placeholder={t.relationShort} value={form.relation}
                        onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
                    </Field>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.gender}</label>
                    <select name="gender" value={form.gender} onChange={handleChange}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400" required>
                      <option value="">{t.gender}</option>
                      <option value="male">{t.male}</option>
                      <option value="female">{t.female}</option>
                      <option value="other">{t.other}</option>
                    </select>
                  </div>
                  <Field icon={<Calendar size={18} /> }>
                    <input type="date" name="dob" value={form.dob} onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
                  </Field>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t.bloodGroup}</label>
                    <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400" required>
                      {""}
                      { ["", "A+","A-","B+","B-","O+","O-","AB+","AB-"].map(v => (
                        <option key={v} value={v}>{v || t.bloodGroup}</option>
                      )) }
                    </select>
                  </div>
                  <Field icon={<Phone size={18} /> }>
                    <input type="tel" name="phone" placeholder={t.phone} value={form.phone} onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  </Field>
                  <Field icon={<MapPin size={18} /> }>
                    <input type="text" name="address" placeholder={t.address} value={form.address} onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  </Field>
                  <input type="number" name="height" placeholder={t.height} value={form.height} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <input type="number" name="weight" placeholder={t.weight} value={form.weight} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <textarea name="chronicConditions" placeholder={t.chronic} value={form.chronicConditions} onChange={handleChange}
                    className="w-full sm:col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <textarea name="allergies" placeholder={t.allergies} value={form.allergies} onChange={handleChange}
                    className="w-full sm:col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <FileField label={t.uploadId} name="proofId" file={form.proofId} onChange={handleFile} />
                  <FileField label={t.uploadHistory} name="medicalHistory" file={form.medicalHistory} onChange={handleFile} optional />
                </motion.div>
              )}

              {/* Doctor */}
              {role === "doctor" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<Stethoscope size={18} /> }>
                    <input type="text" name="specialization" placeholder={t.specialization} value={form.specialization}
                      onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
                  </Field>
                  <Field icon={<UserCircle size={18} /> }>
                    <input type="text" name="licenseId" placeholder={t.license} value={form.licenseId}
                      onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
                  </Field>
                  <input type="number" name="yearsExp" placeholder={t.yearsExp} value={form.yearsExp} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <input type="text" name="council" placeholder={t.council} value={form.council} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <input type="text" name="dept" placeholder={t.dept} value={form.dept} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <FileField label={t.uploadLicense} name="regProof" file={form.regProof} onChange={handleFile} />
                </motion.div>
              )}

              {/* Hospital */}
              {role === "hospital" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<Building2 size={18} /> }>
                    <input type="text" name="hospitalName" placeholder={t.hospitalName} value={form.hospitalName}
                      onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
                  </Field>
                  <Field icon={<Building2 size={18} /> }>
                    <input type="text" name="hospitalCode" placeholder={t.hospitalCode} value={form.hospitalCode}
                      onChange={handleChange} className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" required />
                  </Field>
                  <input type="number" name="beds" placeholder={t.beds} value={form.beds} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400" />
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" name="emergencyDept" checked={form.emergencyDept} onChange={handleCheck} />
                    {t.emergencyDept}
                  </label>
                  <input type="url" name="website" placeholder={t.website} value={form.website} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400 sm:col-span-2" />
                  <textarea name="notes" placeholder={t.notes} value={form.notes} onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400 sm:col-span-2" />
                  <FileField label={t.uploadHospitalDocs} name="hospitalDocs" file={form.hospitalDocs} onChange={handleFile} />
                </motion.div>
              )}

              {/* Consent */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  {t.consent}
                </label>
                <p className="text-xs text-gray-500 mt-1">{t.proofHint}</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-sm">
                  <AlertTriangle size={16} /> {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="submit" className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700 shadow">
                  {t.reviewTitle}
                </button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
              <h3 className="text-lg font-semibold text-sky-800 mb-3 flex items-center gap-2"><ShieldCheck size={18}/> {t.reviewTitle}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {Object.entries({ Name: form.name, Email: form.email, Role: role, Phone: form.phone, Address: form.address }).map(([k,v]) => (
                  <div key={k} className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">{k}:</span> {String(v || "—")}</div>
                ))}
                {role === "patient" && (
                  <>
                    {Object.entries({ Gender: form.gender, DOB: form.dob, Blood: form.bloodGroup, Height: form.height, Weight: form.weight }).map(([k,v]) => (
                      <div key={k} className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">{k}:</span> {String(v || "—")}</div>
                    ))}
                    {Object.entries({ ID_Proof: form.proofId?.name, Med_Records: form.medicalHistory?.name }).map(([k,v]) => (
                      <div key={k} className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">{k}:</span> {String(v || "—")}</div>
                    ))}
                  </>
                )}
                {role === "doctor" && (
                  <>
                    {Object.entries({ Specialization: form.specialization, License: form.licenseId, Years: form.yearsExp, Council: form.council, Dept: form.dept }).map(([k,v]) => (
                      <div key={k} className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">{k}:</span> {String(v || "—")}</div>
                    ))}
                    <div className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">Proof:</span> {form.regProof?.name || "—"}</div>
                  </>
                )}
                {role === "hospital" && (
                  <>
                    {Object.entries({ Hospital: form.hospitalName, RegNo: form.hospitalCode, Beds: form.beds, Emergency: form.emergencyDept?"Yes":"No", Website: form.website }).map(([k,v]) => (
                      <div key={k} className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">{k}:</span> {String(v || "—")}</div>
                    ))}
                    <div className="p-3 rounded-lg border bg-gray-50"><span className="font-medium">Docs:</span> {form.hospitalDocs?.name || "—"}</div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-between mt-4">
                <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">{t.edit}</button>
                <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow flex items-center gap-2">
                  <CheckCircle2 size={18}/> {t.submitNow}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login */}
        <p className="text-sm text-center text-gray-600 mt-6">
          {t.already} {" "}
          <Link to="/login" state={{ role }} className="text-sky-600 font-medium hover:underline">
            {t.login}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

/* ---------- Small UI helpers ---------- */
function Field({ icon, children }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-2.5 text-gray-400">{icon}</div>
      {children}
    </div>
  );
}

function PasswordMeter({ strength, hint }) {
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-gray-200", "bg-rose-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-700"];
  return (
    <div>
      <div className="h-1 rounded bg-gray-200">
        <div className={`h-1 rounded ${colors[strength]}`} style={{ width: `${(strength/4)*100}%` }} />
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{labels[strength]}</span>
        <span>{hint}</span>
      </div>
    </div>
  );
}

function FileField({ label, name, file, onChange, optional }) {
  return (
    <div className="col-span-1 sm:col-span-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}{optional && " (optional)"}</label>
      <label className="flex items-center justify-between gap-3 w-full border rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-50">
        <div className="flex items-center gap-2 text-gray-700"><UploadCloud size={18}/> <span>{file?.name || "Choose file"}</span></div>
        <FileBadge2 size={18} className="text-gray-400"/>
        <input type="file" name={name} accept={acceptTypes.join(",")} className="hidden" onChange={onChange} />
      </label>
      <p className="text-xs text-gray-500 mt-1">Allowed: PDF/JPG/PNG • Max 10MB</p>
    </div>
  );
}
