import React, { useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Phone,
  MapPin,
  Stethoscope,
  Star,
} from "lucide-react";
import { LanguageContext } from "../../context/LanguageContext";

/* 🌍 Translations */
const STRINGS = {
  en: {
    recommendation: {
      CRITICAL: "⚠️ Seek immediate medical attention.",
      CAUTION: "⚠️ Monitor closely and consult a doctor soon.",
      SAFE: "✅ No immediate risk. Maintain regular checkups.",
    },
    callAmbulance: "Call Ambulance",
    shareLocation: "Share My Location",
    fetchingLocation: "Fetching Location...",
    locationError: "❌ Location not supported on this device.",
    locationDenied: "❌ Location access denied.",
    confidence: "Confidence",
    showReasons: "Show Reasons",
    hideReasons: "Hide Reasons",
    nearbyDoctors: "Nearby Doctors",
    bookNow: "Book Now",
  },
  hi: { /* add Hindi translation */ },
  ta: { /* add Tamil translation */ },
};

/** Dummy doctor list — replace with API later */
const DUMMY_DOCTORS = [
  {
    name: "Dr. Aarav Mehta",
    speciality: "General Physician",
    distance: "1.2 km",
    rating: 4.8,
    link: "#",
  },
  {
    name: "Dr. Priya Sharma",
    speciality: "Internal Medicine",
    distance: "2.0 km",
    rating: 4.6,
    link: "#",
  },
  {
    name: "Dr. Karthik R",
    speciality: "Family Medicine",
    distance: "3.1 km",
    rating: 4.5,
    link: "#",
  },
];

export default function ResultsCard({ result }) {
  const { lang } = useContext(LanguageContext);
  const t = STRINGS[lang] || STRINGS.en;

  if (!result) return null;

  const { score = 0, label = "SAFE", reasons = [] } = result;
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  /** --- Dynamic theme colors --- */
  const theme = (() => {
    switch (label) {
      case "CRITICAL":
        return {
          bg: "bg-red-50 border-red-300",
          text: "text-red-700",
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          gradient: "bg-gradient-to-r from-red-500 to-red-700",
          recommendation: t.recommendation.CRITICAL,
          severe: true,
        };
      case "CAUTION":
        return {
          bg: "bg-orange-50 border-orange-300",
          text: "text-orange-700",
          icon: <AlertTriangle className="w-6 h-6 text-orange-600" />,
          gradient: "bg-gradient-to-r from-orange-400 to-orange-600",
          recommendation: t.recommendation.CAUTION,
          severe: false,
        };
      default:
        return {
          bg: "bg-sky-50 border-sky-300",
          text: "text-sky-700",
          icon: <CheckCircle className="w-6 h-6 text-sky-600" />,
          gradient: "bg-gradient-to-r from-sky-400 to-sky-600",
          recommendation: t.recommendation.SAFE,
          severe: false,
        };
    }
  })();

  /** --- Location sharing --- */
  const shareLocation = () => {
    if (!navigator.geolocation) {
      setStatus(t.locationError);
      return;
    }
    setLoading(true);
    setStatus(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setStatus(
          `📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)} → [Open in Maps](${mapsUrl})`
        );
        setLoading(false);
      },
      () => {
        setStatus(t.locationDenied);
        setLoading(false);
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className={`p-6 rounded-2xl border shadow-md transition ${theme.bg}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          {theme.icon}
          <h3 className={`font-semibold text-lg ${theme.text}`}>{label}</h3>
        </div>

        {/* Score ring */}
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90">
            <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="5" fill="transparent" />
            <motion.circle
              cx="28"
              cy="28"
              r="24"
              stroke={theme.severe ? "#dc2626" : label === "CAUTION" ? "#ea580c" : "#0284c7"}
              strokeWidth="5"
              strokeLinecap="round"
              fill="transparent"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
            {score}%
          </div>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mt-5">
        <div className="text-xs text-gray-600 mb-1">{t.confidence}</div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1 }}
            className={`h-2 ${theme.gradient}`}
          />
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-5 p-4 rounded-lg bg-white/80 text-sm text-gray-800 shadow-inner flex items-start gap-2">
        <Info className="w-4 h-4 text-gray-500 mt-0.5" />
        <span>{theme.recommendation}</span>
      </div>

      {/* Emergency actions if severe */}
      {theme.severe && (
        <div className="mt-6 space-y-3">
          <button
            onClick={() => window.open("tel:102")}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-medium px-5 py-3 rounded-xl shadow-md transition"
          >
            <Phone className="w-5 h-5" /> {t.callAmbulance}
          </button>

          <button
            disabled={loading}
            onClick={shareLocation}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-5 py-3 rounded-xl shadow-md transition"
          >
            <MapPin className="w-5 h-5" />
            {loading ? t.fetchingLocation : t.shareLocation}
          </button>

          {status && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-gray-700 mt-2 whitespace-pre-line"
            >
              {status}
            </motion.p>
          )}
        </div>
      )}

      {/* Suggested doctors if not severe */}
      {!theme.severe && (
        <div className="mt-6">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-sky-600" /> {t.nearbyDoctors}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DUMMY_DOCTORS.map((doc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-white shadow flex flex-col sm:flex-row items-start sm:items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-800">{doc.name}</p>
                  <p className="text-xs text-gray-600">
                    {doc.speciality} • {doc.distance}
                  </p>
                  <div className="flex items-center text-yellow-500 text-xs mt-1">
                    <Star className="w-3 h-3" /> <span className="ml-1">{doc.rating}</span>
                  </div>
                </div>
                <a
                  href={doc.link}
                  className="mt-2 sm:mt-0 px-3 py-1.5 text-xs bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
                >
                  {t.bookNow}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable reasons */}
      {reasons.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" /> {t.hideReasons}
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" /> {t.showReasons}
              </>
            )}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-2 list-disc ml-6 text-sm text-gray-700"
              >
                {reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
