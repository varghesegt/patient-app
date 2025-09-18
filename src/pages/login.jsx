import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, guestLogin } = useAuth();
  const location = useLocation();
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

  const handleGuest = async () => {
    setLoading(true);
    await guestLogin();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full mb-3 p-2 border rounded"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full mb-3 p-2 border rounded"
        />
        <select name="role" value={form.role} onChange={handleChange} className="w-full mb-3 p-2 border rounded">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
          <option value="hospital">Hospital Admin</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <button
          type="button"
          onClick={handleGuest}
          disabled={loading}
          className="w-full mt-2 py-2 border rounded hover:bg-gray-50"
        >
          Continue as Guest
        </button>
      </form>
    </div>
  );
}
