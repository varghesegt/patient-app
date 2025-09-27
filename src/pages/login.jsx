import React, { useState, useContext } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  Loader2,
  LogIn,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LanguageContext } from "../context/LanguageContext";

const LANGS = {
  en: {
    welcome: "Welcome Back",
    loginTo: "Login to MediLink360",
    selectRole: "Select Role",
    patient: "Patient",
    doctor: "Doctor",
    admin: "Admin",
    email: "Email Address",
    password: "Password",
    forgot: "Forgot Password?",
    register: "➕ Register Here",
    login: "Login",
    loggingIn: "Logging in...",
    or: "OR",
    google: "Continue with Google",
    connectingGoogle: "Connecting to Google...",
  },
  hi: {
    welcome: "वापस स्वागत है",
    loginTo: "MediLink360 में लॉगिन करें",
    selectRole: "भूमिका चुनें",
    patient: "मरीज़",
    doctor: "डॉक्टर",
    admin: "प्रशासक",
    email: "ईमेल पता",
    password: "पासवर्ड",
    forgot: "पासवर्ड भूल गए?",
    register: "➕ यहाँ रजिस्टर करें",
    login: "लॉगिन",
    loggingIn: "लॉगिन हो रहा है...",
    or: "या",
    google: "Google से जारी रखें",
    connectingGoogle: "Google से कनेक्ट हो रहा है...",
  },
  ta: {
    welcome: "மீண்டும் வரவேற்கிறோம்",
    loginTo: "MediLink360-இல் உள்நுழையவும்",
    selectRole: "பங்கு தேர்ந்தெடுக்கவும்",
    patient: "நோயாளி",
    doctor: "மருத்துவர்",
    admin: "நிர்வாகி",
    email: "மின்னஞ்சல் முகவரி",
    password: "கடவுச்சொல்",
    forgot: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?",
    register: "➕ இங்கே பதிவு செய்யவும்",
    login: "உள்நுழை",
    loggingIn: "உள்நுழைந்து கொண்டிருக்கிறது...",
    or: "அல்லது",
    google: "Google மூலம் தொடரவும்",
    connectingGoogle: "Google-இன் இணைப்பில்...",
  },
};

export default function Login() {
  const { login } = useAuth();
  const { lang } = useContext(LanguageContext);
  const t = LANGS[lang] || LANGS.en;

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", role: "patient" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const redirectByRole = (role) => {
    switch (role) {
      case "doctor":
        return "/doctordashboard";
      case "admin":
      case "hospital":
        return "/hospitaldashboard";
      default:
        return "/dashboard";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form);
      const redirectTo = location.state?.from?.pathname || redirectByRole(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const user = await login({
        email: "demo.google.user@gmail.com",
        name: "Demo Google User",
        role: form.role, 
        provider: "google",
      });
      const redirectTo = location.state?.from?.pathname || redirectByRole(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Google Login Error:", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <Shield className="mx-auto text-sky-600 mb-3 drop-shadow-lg" size={56} />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-sky-700 tracking-tight">
            {t.welcome}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{t.loginTo}</p>
        </div>

        {/* Role Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.selectRole}
          </label>
          <div className="relative">
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 appearance-none border rounded-lg focus:ring-2 focus:ring-sky-400 cursor-pointer"
            >
              <option value="patient">{t.patient}</option>
              <option value="doctor">{t.doctor}</option>
              <option value="admin">{t.admin}</option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder={t.email}
              value={form.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
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
              required
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Links */}
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-sky-600 hover:underline">
              {t.forgot}
            </Link>
            <Link
              to="/register"
              state={{ role: form.role }}
              className="text-sky-600 hover:underline font-semibold"
            >
              {t.register}
            </Link>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-sky-600 to-sky-700 text-white rounded-lg hover:shadow-xl transition"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> {t.loggingIn}
              </>
            ) : (
              <>
                <LogIn size={18} /> {t.login}
              </>
            )}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">{t.or}</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Google Login */}
        <motion.button
          onClick={handleGoogle}
          whileTap={{ scale: 0.97 }}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-lg bg-white hover:bg-gray-50 transition shadow-sm"
        >
          {googleLoading ? (
            <>
              <Loader2 className="animate-spin text-sky-600" size={18} />
              {t.connectingGoogle}
            </>
          ) : (
            <>
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-5 h-5"
              />
              {t.google}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
