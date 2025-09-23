import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, WifiOff, MapPin, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function OfflineSMS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(null); // "sending" | "success" | "error"
  const lastUnsent = useRef(null);

  // === Network status listener ===
  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    if (isOnline && lastUnsent.current) {
      sendMessage(lastUnsent.current);
      lastUnsent.current = null;
    }

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [isOnline]);

  // === Get GPS Location ===
  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(5),
          lon: pos.coords.longitude.toFixed(5),
        });
      },
      (err) => console.warn("Location denied:", err),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // === Simulated SMS sending (online) ===
  const sendMessage = (msg) => {
    if (!isOnline) {
      setStatus("error");
      lastUnsent.current = msg;
      return;
    }

    setStatus("sending");
    setTimeout(() => {
      setStatus("success");
    }, 1200); // simulate API delay
  };

  // === Send button handler ===
  const handleSend = () => {
    if (!message.trim() && !location) return;

    const text = `${message || "🚨 Emergency SOS!"}\n🕒 ${new Date().toLocaleString()} ${
      location ? `📍 ${location.lat}, ${location.lon}` : ""
    }`;

    const msg = { id: Date.now(), text };

    if (!isOnline) {
      // 📱 Open native SMS app when offline
      window.location.href = `sms:+1234567890?body=${encodeURIComponent(text)}`;
      setStatus("error"); // mark as offline send attempt
      return;
    }

    // 🌐 Online send
    sendMessage(msg);
    setMessage("");
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-5 bg-white/80 dark:bg-gray-800/70 border rounded-2xl shadow-lg relative"
    >
      <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <WifiOff className="text-red-500" size={18} /> Offline SMS (Instant)
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        If online, messages send instantly. If offline, your phone’s SMS app will open so you can still send.
      </p>

      {/* Input box */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your emergency message..."
        className="w-full mt-3 p-2 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm"
        rows={3}
      />

      {/* Location preview */}
      {location && (
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
          <MapPin size={14} className="text-purple-500" />
          <span>
            {location.lat}, {location.lon}
          </span>
        </div>
      )}

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={status === "sending"}
        className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
          isOnline
            ? "bg-sky-600 hover:bg-sky-700"
            : "bg-gray-500 hover:bg-gray-600"
        }`}
      >
        {status === "sending" ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {status === "sending"
          ? "Sending..."
          : isOnline
          ? "Send Now"
          : "Send via SMS App"}
      </button>

      {/* Status feedback */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 right-2 flex items-center gap-2 bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-lg"
          >
            <CheckCircle2 size={14} /> Sent successfully
          </motion.div>
        )}

        {status === "error" && !isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 right-2 flex items-center gap-2 bg-yellow-600 text-white text-xs px-3 py-1 rounded-full shadow-lg"
          >
            <AlertTriangle size={14} /> Opened SMS app
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
