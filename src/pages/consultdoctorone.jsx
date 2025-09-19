import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  User,
  Calendar,
  Clock,
  MessageSquare,
  Phone,
  Info,
  Brain,
  HeartPulse,
  Baby,
  Eye,
  Bone,
  Smile,
} from "lucide-react";

export default function ConsultDoctor() {
  const [form, setForm] = useState({
    name: "",
    symptoms: "",
    date: "",
    time: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Consultation request submitted! A doctor will contact you soon.");
  };

  const specialties = [
    { icon: <HeartPulse className="w-7 h-7 text-red-500" />, title: "Cardiology" },
    { icon: <Brain className="w-7 h-7 text-purple-600" />, title: "Neurology" },
    { icon: <Baby className="w-7 h-7 text-pink-500" />, title: "Pediatrics" },
    { icon: <Eye className="w-7 h-7 text-sky-500" />, title: "Ophthalmology" },
    { icon: <Bone className="w-7 h-7 text-amber-600" />, title: "Orthopedics" },
    { icon: <Smile className="w-7 h-7 text-green-500" />, title: "Dentistry" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 text-gray-900 flex flex-col">
      {/* Page Heading */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center px-6 pt-12 sm:pt-20"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 blur-3xl bg-indigo-400/40 rounded-full animate-pulse" />
            <Stethoscope className="w-20 h-20 sm:w-24 sm:h-24 relative text-indigo-600 drop-shadow-lg" />
          </motion.div>
        </div>

        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold tracking-tight leading-tight bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          Consult a Doctor
        </h2>

        <p className="mt-5 text-gray-700 max-w-2xl mx-auto text-[clamp(0.95rem,2vw,1.15rem)] leading-relaxed">
          Connect with{" "}
          <span className="font-semibold text-indigo-600">certified doctors</span>{" "}
          online for expert medical advice, anytime, anywhere.
        </p>
      </motion.div>

      {/* Consultation Form */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full mt-12 sm:mt-16 lg:mt-20 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-indigo-100/70 p-6 sm:p-10 md:p-12 mx-auto max-w-4xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 via-transparent to-sky-50/20 pointer-events-none rounded-3xl" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          {/* Name */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            <User className="w-5 h-5 text-indigo-600" />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your Name"
              className="w-full bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          {/* Symptoms */}
          <div className="flex items-start gap-3 border-b border-gray-200 pb-3">
            <MessageSquare className="w-5 h-5 text-indigo-600 mt-1" />
            <textarea
              name="symptoms"
              value={form.symptoms}
              onChange={handleChange}
              placeholder="Describe your symptoms"
              className="w-full bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 resize-none"
              rows={3}
              required
            />
          </div>

          {/* Date */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full bg-transparent focus:outline-none text-gray-800"
              required
            />
          </div>

          {/* Time */}
          <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <input
              type="time"
              name="time"
              value={form.time}
              onChange={handleChange}
              className="w-full bg-transparent focus:outline-none text-gray-800"
              required
            />
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold py-3 rounded-xl shadow-lg"
          >
            Submit Consultation Request
          </motion.button>
        </form>
      </motion.div>

      {/* Specialties Section */}
      <div className="mx-auto mt-16 w-full max-w-5xl px-4 sm:px-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
          Available Specializations
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
          {specialties.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-gray-100 py-5 hover:shadow-lg transition-all"
            >
              {s.icon}
              <span className="text-sm font-medium text-gray-700">{s.title}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Emergency Call */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        className="flex justify-center mt-14"
      >
        <a
          href="tel:112"
          className="flex items-center gap-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Phone className="w-5 h-5" />
          Emergency Call (112)
        </a>
      </motion.div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="mt-12 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 bg-gradient-to-r from-amber-50/80 to-yellow-100/90 border border-yellow-200/70 rounded-2xl shadow-lg p-5 sm:p-6 md:p-7"
      >
        <Info className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600 shrink-0" />
        <p className="text-[clamp(0.85rem,2vw,1rem)] text-gray-700 leading-relaxed">
          <span className="font-semibold">Disclaimer:</span> Online consultation
          provides initial guidance and does not replace a physical examination.
          For urgent cases, please visit a hospital immediately.
        </p>
      </motion.div>

      <div className="h-10 sm:h-16" /> {/* Bottom spacing */}
    </div>
  );
}
