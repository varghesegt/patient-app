import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, WifiOff, Clock, MapPin, RefreshCw } from "lucide-react";

export default function OfflineSMS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [message, setMessage] = useState("");
  const [pendingMessages, setPendingMessages] = useState(
    JSON.parse(localStorage.getItem("offlineSMS") || "[]")
  );
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Listen for network status changes
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    // Try sending stored messages when back online
    if (isOnline && pendingMessages.length > 0) {
      pendingMessages.forEach((msg) => sendMessage(msg, true));
    }

    return () => {
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [isOnline]);

  // Get GPS location
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

  // Send message handler
  const sendMessage = (msg, isRetry = false) => {
    if (!isOnline) {
      // Save locally if offline
      const newPending = [...pendingMessages, msg];
      setPendingMessages(newPending);
      localStorage.setItem("offlineSMS", JSON.stringify(newPending));
      alert("📴 Offline. Message stored locally for auto-send.");
      return;
    }

    // Simulate SMS API call
    setTimeout(() => {
      alert(`📩 SMS Sent:\n${msg.text}`);
      if (!isRetry) {
        // Remove from pending if it was new
        const updated = pendingMessages.filter((m) => m.id !== msg.id);
        setPendingMessages(updated);
        localStorage.setItem("offlineSMS", JSON.stringify(updated));
      }
    }, 1000);
  };

  const handleSend = () => {
    const msg = {
      id: Date.now(),
      text: `${message || "🚨 Emergency SOS!"}\n🕒 ${new Date().toLocaleString()} ${
        location ? `📍 ${location.lat}, ${location.lon}` : ""
      }`,
    };
    sendMessage(msg);
    setMessage("");
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-5 bg-white/80 dark:bg-gray-800/70 border rounded-2xl shadow-lg"
    >
      <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
        <WifiOff className="text-red-500" size={18} /> Offline SMS Fallback
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Works in poor network areas. Messages will auto-send once back online.
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
        className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition 
        ${isOnline ? "bg-sky-600 hover:bg-sky-700" : "bg-gray-400 cursor-not-allowed"}`}
      >
        <Send size={16} />
        {isOnline ? "Send Now" : "Save Offline"}
      </button>

      {/* Pending messages */}
      {pendingMessages.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
            Pending Messages ({pendingMessages.length})
          </h4>
          <ul className="space-y-2 text-xs">
            {pendingMessages.map((m) => (
              <li
                key={m.id}
                className="p-2 rounded bg-gray-100 dark:bg-gray-700 flex justify-between items-center"
              >
                <div className="flex flex-col">
                  <span>{m.text.slice(0, 50)}...</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock size={10} /> {new Date(m.id).toLocaleTimeString()}
                  </span>
                </div>
                <button
                  onClick={() => sendMessage(m, true)}
                  className="ml-2 p-1 text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
