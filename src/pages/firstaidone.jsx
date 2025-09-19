import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FirstAidKit,
  Phone,
  AlertTriangle,
  Activity,
  Droplet,
  HeartPulse,
  Info,
  Bandage,
} from "lucide-react";

export default function FirstAid() {
  const [open, setOpen] = useState(null);

  const tips = [
    {
      title: "CPR (Cardiopulmonary Resuscitation)",
      icon: <HeartPulse className="w-6 h-6 text-red-600" />,
      content:
        "If the person is unresponsive and not breathing, call emergency services immediately. Perform chest compressions at a rate of 100-120 per minute, pressing hard and fast in the center of the chest.",
    },
    {
      title: "Severe Bleeding",
      icon: <Droplet className="w-6 h-6 text-rose-600" />,
      content:
        "Apply firm pressure with a clean cloth to stop bleeding. If bleeding continues, apply additional cloths without removing the original. Keep the injured part elevated if possible.",
    },
    {
      title: "Burns",
      icon: <Activity className="w-6 h-6 text-orange-600" />,
      content:
        "Cool the burn under running water for 10-20 minutes. Do not apply ice, butter, or toothpaste. Cover loosely with a sterile gauze or clean cloth.",
    },
    {
      title: "Fractures & Sprains",
      icon: <Bandage className="w-6 h-6 text-sky-600" />,
      content:
        "Immobilize the injured area. Apply a cold pack wrapped in cloth to reduce swelling. Seek medical help as soon as possible.",
    },
    {
      title: "Choking",
      icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
      content:
        "If the person cannot breathe, cough, or speak, perform abdominal thrusts (Heimlich maneuver). For infants, give 5 back blows followed by 5 chest thrusts.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-pink-50 
                    text-gray-900 flex flex-col">
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
            <div className="absolute inset-0 blur-3xl bg-red-400/40 
                            rounded-full animate-pulse" />
            <FirstAidKit className="w-20 h-20 sm:w-24 sm:h-24 relative 
                                     text-red-600 drop-shadow-lg" />
          </motion.div>
        </div>

        <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-extrabold 
                       tracking-tight leading-tight bg-gradient-to-r 
                       from-red-600 to-pink-500 bg-clip-text text-transparent">
          First Aid Guide
        </h2>

        <p className="mt-5 text-gray-700 max-w-2xl mx-auto 
                      text-[clamp(0.95rem,2vw,1.15rem)] leading-relaxed">
          Learn the{" "}
          <span className="font-semibold text-red-600">
            life-saving basics
          </span>{" "}
          to respond quickly in emergencies. These steps can help stabilize
          someone until professional help arrives.
        </p>
      </motion.div>

      {/* Emergency Call Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
        className="flex justify-center mt-10"
      >
        <a
          href="tel:112"
          className="flex items-center gap-3 bg-gradient-to-r 
                     from-red-600 to-pink-600 text-white font-semibold 
                     px-6 py-3 rounded-full shadow-lg hover:scale-105 
                     transition-transform"
        >
          <Phone className="w-5 h-5" />
          Call Emergency (112)
        </a>
      </motion.div>

      {/* First Aid Tips Section */}
      <div className="mx-auto mt-14 w-full max-w-4xl px-4 sm:px-8">
        {tips.map((tip, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="mb-6"
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              className="w-full flex items-center justify-between 
                         bg-white/80 backdrop-blur-lg border border-red-100 
                         rounded-2xl shadow-md p-5 hover:shadow-lg 
                         transition-all"
            >
              <div className="flex items-center gap-3 text-left">
                {tip.icon}
                <span className="font-semibold text-gray-900">
                  {tip.title}
                </span>
              </div>
              <motion.span
                animate={{ rotate: open === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="text-gray-500"
              >
                ▼
              </motion.span>
            </button>

            <AnimatePresence>
              {open === index && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4 }}
                  className="overflow-hidden px-5 pb-4 mt-2 text-gray-700 
                             text-sm leading-relaxed"
                >
                  {tip.content}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="mt-10 sm:mt-14 mx-4 sm:mx-10 lg:mx-20 flex items-start gap-4 
                   bg-gradient-to-r from-amber-50/80 to-yellow-100/90 
                   border border-yellow-200/70 
                   rounded-2xl shadow-lg p-5 sm:p-6 md:p-7"
      >
        <Info className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600 shrink-0" />
        <p className="text-[clamp(0.85rem,2vw,1rem)] text-gray-700 leading-relaxed">
          <span className="font-semibold">Disclaimer:</span> This guide is for{" "}
          <span className="italic">basic emergency response</span> only. It is
          not a replacement for professional medical training or care. Always
          seek professional help when available.
        </p>
      </motion.div>

      <div className="h-10 sm:h-16" /> {/* Bottom spacing */}
    </div>
  );
}
