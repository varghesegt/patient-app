import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, guestLogin } = useAuth();
  const location = useLocation();
  const initialRole = location.state?.role || "patient";

  const [form, setForm] = useState({
    email: "",
    password: "",
    role: initialRole,
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use context login
      login(form); // updates context and redirects to /dashboard
    } catch (err) {
      alert("Login failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      // Simulate Google login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      guestLogin(); // Can also set a real Google user here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-sky-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8"
      >
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-sky-700">Welcome Back 👋</h2>
          <p className="text-gray-600 text-sm mt-2">
            Login to continue to <span className="font-semibold">MediLink360</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
            >
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="hospital">Hospital Admin</option>
            </select>
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-2 text-gray-500 text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 bg-sky-600 text-white py-2.5 rounded-lg hover:bg-sky-700 shadow-md transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            <LogIn size={18} /> {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 py-2.5 rounded-lg hover:bg-gray-50 transition mt-4"
        >
          <ShieldCheck size={18} className="text-red-500" />
          {loading ? "Logging in..." : "Continue with Google"}
        </button>

        <p className="text-sm text-center text-gray-600 mt-6">
          Don’t have an account?{" "}
          <Link
            to="/register"
            state={{ role: form.role }}
            className="text-sky-600 font-medium hover:underline"
          >
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
