// src/pages/Emergency.jsx
import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  PhoneCall,
  Shield,
  MapPin,
  Loader2,
  CheckCircle2,
  X,
  WifiOff,
  Wifi,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OfflineSMS from "../features/emergency/OfflineSMS";

export default function Emergency() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("sosHistory")) || []
  );
  const [vibrateSupported, setVibrateSupported] = useState(false);

  useEffect(() => {
    // Detect online/offline
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vibrate support
    setVibrateSupported("vibrate" in navigator);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Save SOS request to history (max 5)
  const saveToHistory = (data) => {
    const newHistory = [data, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("sosHistory", JSON.stringify(newHistory));
  };

  // Main SOS handler
  const handleSOS = async (useLiveLocation) => {
    try {
      setSending(true);
      setSent(false);
      setModalOpen(false);

      let latitude, longitude;

      if (useLiveLocation) {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } else {
        latitude = manualLocation.lat;
        longitude = manualLocation.lng;
      }

      const sosData = {
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
        status: isOnline ? "Sent Online" : "Saved Offline",
      };

      if (isOnline) {
        // Online POST
        await fetch("/api/emergency/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sosData),
        });
      } else {
        // Offline fallback → SMS
        window.location.href = `sms:?body=🚨 EMERGENCY! Location: https://maps.google.com/?q=${latitude},${longitude}`;
      }

      saveToHistory(sosData);

      // Feedback
      setSending(false);
      setSent(true);
      vibrateSupported && navigator.vibrate([200, 100, 200]);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error("SOS failed:", err);
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 sm:p-10 relative overflow-hidden">
      {/* Animated Background Glows */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-60 h-60 bg-red-300 rounded-full blur-3xl opacity-20 pointer-events-none"
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, -20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-10 right-10 w-72 h-72 bg-red-400 rounded-full blur-3xl opacity-15 pointer-events-none"
      />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-4xl font-extrabold text-red-700 dark:text-red-400 flex items-center justify-center gap-2">
            <AlertTriangle className="text-red-600 animate-pulse" size={32} />
            Emergency Help
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
            If you are in <span className="font-semibold text-red-600">immediate danger</span>, press SOS below.
            Choose live location or custom location.
          </p>
          <div className="flex items-center justify-center mt-2 gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Wifi size={16} /> Online
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 text-sm">
                <WifiOff size={16} /> Offline Mode
              </span>
            )}
          </div>
        </motion.div>

        {/* SOS Button */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-red-200 dark:border-red-800 p-8 rounded-2xl shadow-2xl text-center relative overflow-hidden"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">
            Immediate SOS
          </h3>

          <div className="flex flex-col items-center gap-6">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setModalOpen(true)}
              disabled={sending}
              className={`relative w-40 h-40 flex items-center justify-center rounded-full font-bold text-2xl uppercase tracking-wide ${
                sending ? "bg-gray-400" : "bg-red-600 hover:bg-red-700"
              } text-white shadow-2xl transition`}
            >
              {sending ? (
                <Loader2 className="animate-spin w-10 h-10" />
              ) : sent ? (
                <CheckCircle2 className="w-12 h-12 text-green-400 animate-bounce" />
              ) : (
                "SOS"
              )}
              {!sending && !sent && (
                <span className="absolute inset-0 rounded-full border-4 border-red-400 animate-ping"></span>
              )}
            </motion.button>

            {!sending && !sent && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Press SOS to trigger instant emergency response.
              </p>
            )}
            {sending && <p className="text-sm text-gray-600 dark:text-gray-400">Sending location…</p>}
            {sent && <p className="text-sm text-green-600 dark:text-green-400 font-semibold">SOS triggered ✅</p>}
          </div>
        </motion.div>

        {/* Modal for Location Selection */}
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-md relative"
              >
                <button
                  onClick={() => setModalOpen(false)}
                  className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
                <h4 className="text-lg font-semibold mb-4">Choose Location Mode</h4>
                <div className="space-y-4">
                  <button
                    onClick={() => handleSOS(true)}
                    className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    📍 Use Live Location
                  </button>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Enter Latitude"
                      value={manualLocation.lat}
                      onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })}
                      className="border rounded p-2 w-full"
                    />
                    <input
                      type="text"
                      placeholder="Enter Longitude"
                      value={manualLocation.lng}
                      onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })}
                      className="border rounded p-2 w-full"
                    />
                    <button
                      onClick={() => handleSOS(false)}
                      disabled={!manualLocation.lat || !manualLocation.lng}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      🗺 Use Custom Location
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline Fallback */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-md"
        >
          <OfflineSMS />
        </motion.div>

        {/* SOS History */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-8 bg-white/80 dark:bg-gray-800/70 p-5 rounded-xl shadow-md"
          >
            <h4 className="flex items-center gap-2 font-semibold mb-3">
              <History size={18} /> Last SOS Requests
            </h4>
            <ul className="space-y-2 text-sm">
              {history.map((h, i) => (
                <li
                  key={i}
                  className="flex justify-between border-b pb-1 text-gray-600 dark:text-gray-300"
                >
                  <span>
                    {new Date(h.timestamp).toLocaleTimeString()} - {h.status}
                  </span>
                  <a
                    href={`https://maps.google.com/?q=${h.lat},${h.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View Map
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Additional Emergency Options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-10 grid gap-6 sm:grid-cols-2"
        >
          {[
            {
              icon: PhoneCall,
              title: "Direct Helpline",
              desc: "Instantly dial 112 or your nearest emergency number.",
              color: "text-blue-500",
              action: () => (window.location.href = "tel:112"),
            },
            {
              icon: Shield,
              title: "Safety Tips",
              desc: "Stay calm, secure your surroundings, and follow steps.",
              color: "text-green-500",
            },
            {
              icon: MapPin,
              title: "Location Share",
              desc: "Share your location manually to responders.",
              color: "text-purple-500",
              action: () => navigator.share && navigator.share({ title: "My Location", url: window.location.href }),
            },
            {
              icon: AlertTriangle,
              title: "Critical Alerts",
              desc: "Get notified of nearby incidents or hazards.",
              color: "text-orange-500",
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              onClick={card.action}
              className="bg-white/90 dark:bg-gray-800/90 p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col gap-2"
            >
              <div className="flex items-center gap-3">
                <card.icon className={`${card.color}`} size={24} />
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">{card.title}</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
