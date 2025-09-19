import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, LogIn, Shield } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth(); // only normal + google login
  const location = useLocation();
  const navigate = useNavigate();

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({ email: "", password: "", role: "patient" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login({ ...form, redirectTo });
    setLoading(false);
  };

  // ✅ Dummy Google login
  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      navigate("/dashboard", { replace: true });
    }, 1200); // fake delay
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-white to-sky-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 relative"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Shield className="mx-auto text-sky-600 mb-3" size={40} />
          <h2 className="text-3xl font-bold text-sky-700">Welcome Back</h2>
          <p className="text-gray-500 text-sm mt-1">
            Login to <span className="font-semibold">MediLink360</span>
          </p>
        </div>

        {/* Role Dropdown */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Role
          </label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="hospital">Admin</option>
          </select>
        </div>

        {/* Normal Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
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
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-sky-400"
            />
          </div>

          {/* Forgot Password + Register */}
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-sky-600 hover:underline">
              Forgot Password?
            </Link>
            <Link
              to="/register"
              state={{ role: form.role }}
              className="text-sky-600 hover:underline font-semibold"
            >
              ➕ Register Here
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 shadow-lg transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} /> Login
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-gray-500 text-sm">OR</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* Dummy Google Login */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 border rounded-lg hover:bg-gray-50 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          {loading ? "Connecting..." : `Continue with Google`}
        </button>
      </motion.div>
    </div>
  );
}
