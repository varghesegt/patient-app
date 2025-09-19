import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FirstAidPage() {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState("");

  const tips = [
    {
      title: "🫀 CPR Basics",
      category: "Life-Saving",
      desc: "Check responsiveness, call emergency services, and begin chest compressions. Push hard and fast at 100–120 per minute.",
      extra: "If trained, provide rescue breaths (30:2 ratio). Continue until help arrives.",
    },
    {
      title: "🩸 Controlling Bleeding",
      category: "Trauma",
      desc: "Apply firm pressure with a cloth. Do not remove soaked layers.",
      extra: "Elevate injured part. Use a tourniquet only if bleeding is severe and unstoppable.",
    },
    {
      title: "🔥 Burns",
      category: "Trauma",
      desc: "Cool under running water for at least 10 minutes. Remove tight items nearby.",
      extra: "Do not apply ice, butter, or oils. Cover loosely with a clean cloth.",
    },
    {
      title: "🦴 Fractures & Sprains",
      category: "Trauma",
      desc: "Immobilize with a splint/sling. Avoid unnecessary movement.",
      extra: "Apply ice packs for swelling. Seek medical help immediately.",
    },
    {
      title: "💊 First Aid Kit Essentials",
      category: "Everyday Essentials",
      desc: "Keep bandages, gauze, wipes, gloves, scissors, and thermometer ready.",
      extra: "Add pain relievers, burn ointment, tweezers, and emergency contacts.",
    },
    {
      title: "🥵 Heatstroke",
      category: "Everyday Essentials",
      desc: "Move person to a cool area and hydrate immediately.",
      extra: "Cool body with wet cloths. Call emergency services if fainting or confusion occurs.",
    },
    {
      title: "🤧 Allergic Reactions",
      category: "Life-Saving",
      desc: "Look for hives, swelling, or breathing difficulty.",
      extra: "Use epinephrine auto-injector if available. Call emergency services right away.",
    },
  ];

  // Filtered tips
  const filteredTips = tips.filter(
    (tip) =>
      tip.title.toLowerCase().includes(search.toLowerCase()) ||
      tip.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-100 py-16 px-6 relative">
      {/* Header */}
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl sm:text-5xl font-extrabold text-center text-sky-700 mb-4"
      >
        🩺 Advanced First Aid Guide
      </motion.h1>
      <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
        A detailed, interactive reference to help you act quickly during emergencies.
        Use the search below to find tips by keyword or category.
      </p>

      {/* Search Bar */}
      <div className="max-w-lg mx-auto mb-10">
        <input
          type="text"
          placeholder="🔍 Search CPR, Burns, Fractures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-sky-200 focus:ring-2 focus:ring-sky-400 shadow-sm"
        />
      </div>

      {/* Tips Grid */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {filteredTips.map((tip, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.03 }}
            onClick={() => setOpen(open === i ? null : i)}
            className="bg-white rounded-2xl shadow-lg p-6 border border-sky-100 flex flex-col gap-3 cursor-pointer transition duration-300 hover:shadow-2xl"
          >
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sky-100 text-sky-700 w-fit">
              {tip.category}
            </span>
            <h2 className="font-bold text-lg text-sky-800">{tip.title}</h2>
            <p className="text-gray-700">{tip.desc}</p>

            {/* Expandable section */}
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-gray-600"
                >
                  {tip.extra}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Quick Action Checklist */}
      <div className="mt-20 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-sky-200 rounded-2xl shadow-lg p-8"
        >
          <h3 className="text-2xl font-bold text-sky-700 mb-4 text-center">
            ✅ Quick Emergency Checklist
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3 text-gray-700 text-lg">
            <li>📞 Call emergency number immediately (112 in India)</li>
            <li>🫀 Start CPR if no pulse/breathing</li>
            <li>🩸 Control severe bleeding with firm pressure</li>
            <li>🔥 Cool burns with running water</li>
            <li>🦴 Immobilize fractures/sprains</li>
            <li>💊 Check for allergic reaction & use epinephrine if available</li>
          </ul>
        </motion.div>
      </div>

      {/* Dedicated Ambulance CTA Section */}
      <div className="mt-16 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-lg"
        >
          <h3 className="text-3xl font-extrabold mb-2">🚑 Need an Ambulance?</h3>
          <p className="mb-4 text-lg">
            For urgent medical transport, dial{" "}
            <span className="font-bold underline">112 (India)</span> immediately.
          </p>
          <a
            href="tel:108"
            className="inline-block bg-white text-red-600 font-bold px-6 py-3 rounded-xl shadow-md hover:bg-red-50 transition"
          >
            📞 Call 112 Now
          </a>
        </motion.div>
      </div>

      {/* Emergency Footer */}
      <div className="mt-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-md"
        >
          <h3 className="text-2xl font-bold text-red-600 mb-2">
            🚨 Emergency Hotline
          </h3>
          <p className="text-gray-700">
            If someone is in immediate danger, call{" "}
            <span className="font-bold">112 (India)</span> or your local emergency
            number right away.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
