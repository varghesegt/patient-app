import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  MapPin,
  User,
  HeartPulse,
  Stethoscope,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on mount
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-white to-sky-50 relative overflow-hidden">
      {/* Floating blobs */}
      <motion.div
        animate={{ y: [0, 20, 0], x: [0, 15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-40 h-40 bg-sky-300 rounded-full blur-3xl opacity-30"
      />
      <motion.div
        animate={{ y: [0, -25, 0], x: [0, -20, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-10 w-52 h-52 bg-sky-400 rounded-full blur-3xl opacity-20"
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 py-16 space-y-24">
        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-12 sm:p-16 text-center border border-sky-100"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
            Get Help Instantly
          </h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-12 text-lg sm:text-xl">
            Start your{" "}
            <span className="font-semibold text-sky-600">AI-powered triage</span>{" "}
            or press{" "}
            <span className="font-semibold text-red-500">SOS for emergency</span>
            . Supports <strong>voice input</strong> & multiple languages.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/symptoms">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full sm:w-auto px-8 py-3 rounded-3xl font-bold text-white 
                           bg-gradient-to-r from-sky-500 to-blue-600 
                           shadow-xl hover:shadow-sky-400/50 transition-all duration-300
                           flex items-center gap-3 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition" />
                <Activity size={20} /> Start Symptom Check
              </motion.button>
            </Link>
            <Link to="/emergency">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-full sm:w-auto px-8 py-3 rounded-3xl font-bold text-white 
                           bg-gradient-to-r from-red-500 to-rose-600 
                           shadow-xl hover:shadow-red-400/50 transition-all duration-300
                           flex items-center gap-3 overflow-hidden group"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition" />
                <AlertTriangle size={20} /> SOS / Emergency
              </motion.button>
            </Link>
          </div>
        </motion.section>

        {/* Quick Action Cards */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
        >
          {[
            {
              title: "My Profile",
              desc: "Manage health info, history, and saved hospitals.",
              icon: <User className="text-sky-500" />,
              link: "/profile",
            },
            {
              title: "Nearby Hospitals",
              desc: "Find closest hospitals with live availability.",
              icon: <MapPin className="text-green-500" />,
              link: "/hospital",
            },
            {
              title: "First Aid Guide",
              desc: "Step-by-step emergency instructions.",
              icon: <HeartPulse className="text-orange-500" />,
              link: "/firstaid",
            },
            {
              title: "Consult a Doctor",
              desc: "Instantly connect with verified doctors.",
              icon: <Stethoscope className="text-purple-500" />,
              link: "/consultdoctor",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10, scale: 1.05, rotate: 1 }}
              transition={{ type: "spring", stiffness: 250, damping: 20 }}
              className="relative bg-white/80 backdrop-blur-2xl p-8 rounded-3xl 
                         shadow-2xl hover:shadow-3xl border border-sky-100/40 
                         transition group cursor-pointer overflow-hidden"
            >
              {/* Gradient glow border */}
              <div className="absolute inset-0 bg-gradient-to-r from-sky-300 via-blue-200 to-sky-300 
                              opacity-0 group-hover:opacity-100 blur-2xl transition" />
              <Link to={card.link} className="relative block">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-sky-50 rounded-xl group-hover:scale-110 transition">
                    {card.icon}
                  </div>
                  <h3 className="font-bold text-xl text-gray-900">{card.title}</h3>
                </div>
                <p className="text-gray-600 text-sm sm:text-base">{card.desc}</p>
              </Link>
            </motion.div>
          ))}
        </motion.section>
      </main>
    </div>
  );
}
