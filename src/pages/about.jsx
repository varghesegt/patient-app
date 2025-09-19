import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  HeartPulse,
  Stethoscope,
  Globe,
  Phone,
  Info,
} from "lucide-react";

export default function About() {
  const stats = [
    { icon: <Users className="w-6 h-6 text-indigo-600" />, label: "Doctors", value: 120 },
    { icon: <HeartPulse className="w-6 h-6 text-red-500" />, label: "Specialties", value: 15 },
    { icon: <Stethoscope className="w-6 h-6 text-sky-500" />, label: "Consultations", value: "10K+" },
    { icon: <Globe className="w-6 h-6 text-green-500" />, label: "Cities Covered", value: 10 },
  ];

  const team = [
    {
      name: "Dr. Anjali Mehta",
      role: "Chief Medical Officer",
      image: "https://randomuser.me/api/portraits/women/44.jpg",
    },
    {
      name: "Dr. Rajesh Kumar",
      role: "Head of Neurology",
      image: "https://randomuser.me/api/portraits/men/46.jpg",
    },
    {
      name: "Dr. Priya Sharma",
      role: "Pediatrics Specialist",
      image: "https://randomuser.me/api/portraits/women/47.jpg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-sky-50 text-gray-900 flex flex-col">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center px-6 pt-16 sm:pt-24"
      >
        <h1 className="text-[clamp(2.5rem,6vw,4rem)] font-extrabold bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
          About Us
        </h1>
        <p className="mt-5 text-gray-700 max-w-3xl mx-auto text-lg sm:text-xl leading-relaxed">
          Our platform connects patients with verified doctors across India,
          providing safe, convenient, and efficient healthcare consultations.
        </p>
      </motion.div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto mt-16 px-4 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-white/70 backdrop-blur-lg border border-gray-200 rounded-2xl p-6 flex flex-col items-center shadow-lg hover:scale-105 transition-transform"
          >
            {s.icon}
            <p className="mt-3 text-xl font-bold">{s.value}</p>
            <p className="mt-1 text-gray-600 text-sm">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Mission Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="mt-20 max-w-4xl mx-auto px-4 text-center"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700">
          Our Mission
        </h2>
        <p className="mt-4 text-gray-700 sm:text-lg leading-relaxed">
          We aim to make healthcare accessible and reliable for everyone,
          leveraging technology to connect patients with top medical specialists,
          anytime, anywhere.
        </p>
      </motion.div>

      {/* Team Section */}
      <div className="mt-20 max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-indigo-700 text-center mb-10">
          Meet Our Experts
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {team.map((member, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg p-6 flex flex-col items-center hover:scale-105 transition-transform"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-indigo-100"
              />
              <h4 className="mt-4 font-semibold text-indigo-700">{member.name}</h4>
              <p className="mt-1 text-gray-600">{member.role}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="mt-20 flex justify-center"
      >
        <a
          href="tel:108"
          className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold px-8 py-4 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Phone className="w-5 h-5" />
          Contact Us
        </a>
      </motion.div>

      <div className="h-16"></div>

      {/* Disclaimer */}
      <div className="mt-16 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 bg-gradient-to-r from-amber-50 to-yellow-100 border border-yellow-200 rounded-2xl shadow-lg p-6">
        <Info className="w-7 h-7 text-yellow-600 shrink-0" />
        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
          <span className="font-semibold">Disclaimer:</span> This platform provides
          medical guidance and consultation online. For emergencies, always call
          108 or visit the nearest hospital.
        </p>
      </div>

      <div className="h-16"></div>
    </div>
  );
}
