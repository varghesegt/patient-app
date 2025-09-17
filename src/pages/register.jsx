import React, { useState, useEffect } from "react";
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
  Baby,
  UserSquare,
} from "lucide-react";

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();

  const initialRole = location.state?.role || "patient";
  const [role, setRole] = useState(initialRole);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    // patient
    registeringFor: "self", // self | family
    relation: "",
    gender: "",
    dob: "",
    bloodGroup: "",
    chronicConditions: "",
    allergies: "",
    // doctor
    specialization: "",
    licenseId: "",
    // hospital
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
    alert(`🎉 Registered successfully as ${role}!`);
    navigate("/login", { state: { role } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-sky-50 to-sky-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-sky-700">Create Account ✨</h2>
          <p className="text-gray-600 text-sm mt-2">
            Register as{" "}
            <span className="font-semibold capitalize">{role}</span> in{" "}
            <span className="font-semibold">MediLink360</span>
          </p>
        </div>

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="hospital">Hospital Admin</option>
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
              placeholder="Full Name"
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
              placeholder="Email Address"
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
              placeholder="Password"
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
              placeholder="Confirm Password"
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
                    Registering For
                  </label>
                  <select
                    name="registeringFor"
                    value={form.registeringFor}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
                  >
                    <option value="self">Myself</option>
                    <option value="family">Family Member</option>
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
                      placeholder="Relation (e.g., Father, Mother, Child)"
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
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male ♂</option>
                    <option value="female">Female ♀</option>
                    <option value="other">Other</option>
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
                    Blood Group
                  </label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
                    required
                  >
                    <option value="">Select Blood Group</option>
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

                {/* Chronic Conditions */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Chronic Conditions
  </label>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {[
      "Diabetes",
      "Hypertension",
      "Asthma",
      "COPD",
      "Heart Disease",
      "Kidney Disease",
      "Liver Disease",
      "Cancer",
      "Thyroid Disorder",
      "Arthritis",
    ].map((condition) => (
      <label
        key={condition}
        className="flex items-center gap-2 p-2 border rounded-lg hover:bg-sky-50 cursor-pointer"
      >
        <input
          type="checkbox"
          name="chronicConditions"
          value={condition}
          checked={form.chronicConditions
            ?.split(",")
            .includes(condition)}
          onChange={(e) => {
            let selected = form.chronicConditions
              ? form.chronicConditions.split(",")
              : [];
            if (e.target.checked) {
              selected.push(condition);
            } else {
              selected = selected.filter((c) => c !== condition);
            }
            setForm({ ...form, chronicConditions: selected.join(",") });
          }}
          className="accent-sky-600"
        />
        <span className="text-sm">{condition}</span>
      </label>
    ))}
  </div>
  {/* Custom Input */}
  <input
    type="text"
    placeholder="Other condition..."
    className="mt-2 w-full border rounded-lg p-2 focus:ring-2 focus:ring-sky-400"
    onBlur={(e) => {
      if (e.target.value.trim()) {
        const selected = form.chronicConditions
          ? form.chronicConditions.split(",")
          : [];
        selected.push(e.target.value.trim());
        setForm({
          ...form,
          chronicConditions: selected.join(","),
        });
        e.target.value = "";
      }
    }}
  />
</div>

{/* Allergies */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Known Allergies
  </label>
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
    {[
      "Penicillin",
      "Sulfa Drugs",
      "Aspirin",
      "NSAIDs",
      "Latex",
      "Insect Bites",
      "Dust/Pollen",
      "Peanuts",
      "Tree Nuts",
      "Seafood",
      "Eggs",
      "Milk",
    ].map((allergy) => (
      <label
        key={allergy}
        className="flex items-center gap-2 p-2 border rounded-lg hover:bg-rose-50 cursor-pointer"
      >
        <input
          type="checkbox"
          name="allergies"
          value={allergy}
          checked={form.allergies?.split(",").includes(allergy)}
          onChange={(e) => {
            let selected = form.allergies
              ? form.allergies.split(",")
              : [];
            if (e.target.checked) {
              selected.push(allergy);
            } else {
              selected = selected.filter((c) => c !== allergy);
            }
            setForm({ ...form, allergies: selected.join(",") });
          }}
          className="accent-rose-600"
        />
        <span className="text-sm">{allergy}</span>
      </label>
    ))}
  </div>
  {/* Custom Input */}
  <input
    type="text"
    placeholder="Other allergy..."
    className="mt-2 w-full border rounded-lg p-2 focus:ring-2 focus:ring-rose-400"
    onBlur={(e) => {
      if (e.target.value.trim()) {
        const selected = form.allergies
          ? form.allergies.split(",")
          : [];
        selected.push(e.target.value.trim());
        setForm({
          ...form,
          allergies: selected.join(","),
        });
        e.target.value = "";
      }
    }}
  />
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
                    placeholder="Specialization"
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
                    placeholder="Medical License ID"
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
                    placeholder="Hospital Name"
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
                    placeholder="Hospital Code / Reg No."
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
            Register
          </button>
        </form>

        {/* Login Link */}
        <p className="text-sm text-center text-gray-600 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            state={{ role }}
            className="text-sky-600 font-medium hover:underline"
          >
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
