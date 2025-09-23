import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Wifi,
  WifiOff,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Share2,
  ChevronDown,
} from "lucide-react";

const DEFAULT_RECIPIENT = "+911234567890";

const TEMPLATES = {
  accident: {
    title: "Accident — Need help",
    body: "🚨 Accident reported. Immediate assistance required.",
  },
  stroke: {
    title: "Suspected Stroke — Urgent",
    body: "🚨 Suspected stroke. FAST: Face droop / Arm weakness / Speech trouble / Time critical.",
  },
  cardiac: {
    title: "Cardiac Emergency",
    body: "🚨 Sudden chest pain / collapse — possible cardiac arrest. Please send help.",
  },
  fire: {
    title: "Fire — Evacuate",
    body: "🔥 Fire emergency. Evacuation and rescue needed immediately.",
  },
  other: {
    title: "Emergency",
    body: "🚨 Emergency — please respond immediately.",
  },
};

export default function OfflineSMS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selected, setSelected] = useState("accident");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("offlineSMS_history") || "[]")
  );
  const lastUnsent = useRef(null);
  const mounted = useRef(true);

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    if (isOnline && lastUnsent.current) {
      const msg = lastUnsent.current;
      lastUnsent.current = null;
      sendViaApi(msg).catch(() => {
        lastUnsent.current = msg;
      });
    }

    return () => {
      mounted.current = false;
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [isOnline]);

  // 🌍 Fetch GPS location
  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(5),
          lon: pos.coords.longitude.toFixed(5),
        });
      },
      () => setLocation(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // ✅ Build advanced message with maps link always included
  const buildMessageText = (customText) => {
    const template = TEMPLATES[selected];
    const base = customText?.trim().length ? customText.trim() : template.body;
    const time = new Date().toLocaleString();
    const locText = location
      ? `\n📍 Location: ${location.lat}, ${location.lon}\n🌐 Maps: https://maps.google.com/?q=${location.lat},${location.lon}`
      : "\n📍 Location not available";
    return `${template.title}\n\n${base}\n\n🕒 ${time}${locText}\n\n(Sent via Emergency App)`;
  };

  const pushHistory = (entry) => {
    const next = [entry, ...history].slice(0, 10);
    setHistory(next);
    localStorage.setItem("offlineSMS_history", JSON.stringify(next));
  };

  // ☁️ API send (simulate)
  const sendViaApi = async (msg) => {
    if (!isOnline) throw new Error("offline");
    setStatus("sending");
    await new Promise((res) => setTimeout(res, 800));
    if (!mounted.current) return;
    setStatus("success");
    pushHistory({ ...msg, sentVia: "API", time: Date.now() });
    setTimeout(() => setStatus(null), 1500);
    return true;
  };

  // 📱 Offline → SMS App with maps link
  const openNativeSmsApp = (msg) => {
    const encoded = encodeURIComponent(msg.text);
    const uri = `sms:${recipient}?body=${encoded}`;
    try {
      window.location.href = uri;
      setStatus("error");
      pushHistory({ ...msg, sentVia: "SMS App", time: Date.now() });
      if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    } catch {
      alert("Could not open SMS app. Please copy manually.");
    }
  };

  // 🚀 Main send
  const send = async (opts = { via: "auto" }) => {
    const txt = buildMessageText(message);
    const msg = { id: Date.now(), text: txt, recipient };

    if (isOnline && opts.via !== "sms-app") {
      try {
        await sendViaApi(msg);
        setMessage("");
        return;
      } catch (err) {
        lastUnsent.current = msg;
        if (isMobile) {
          openNativeSmsApp(msg);
        } else if (navigator.share) {
          try {
            await navigator.share({ text: msg.text });
            pushHistory({ ...msg, sentVia: "Share API", time: Date.now() });
            setStatus("success");
            setMessage("");
            return;
          } catch {}
        } else {
          openNativeSmsApp(msg);
        }
        return;
      }
    }

    if (!isOnline || opts.via === "sms-app" || isMobile) {
      openNativeSmsApp(msg);
      setMessage("");
      return;
    }

    try {
      await sendViaApi(msg);
      setMessage("");
    } catch {
      lastUnsent.current = msg;
      openNativeSmsApp(msg);
    }
  };

  const shareMessage = async () => {
    const txt = buildMessageText(message);
    if (!navigator.share) {
      alert("Share API not supported");
      return;
    }
    try {
      await navigator.share({ text: txt });
      pushHistory({ id: Date.now(), text: txt, sentVia: "Share API", time: Date.now() });
      setMessage("");
    } catch {}
  };

  const selectTemplate = (key) => {
    setSelected(key);
    setMessage((prev) => (prev.trim().length ? prev : TEMPLATES[key].body));
    setDropdownOpen(false);
  };

  const fmtTime = (ts) => new Date(ts).toLocaleString();

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-6 bg-white border rounded-2xl shadow-xl max-w-lg w-full mx-auto"
    >
      {/* Header */}
      <header className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          {isOnline ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
          Emergency Quick-Send
        </h3>
        <span className="text-xs font-medium text-gray-500">
          {isOnline ? "Online" : "Offline"}
        </span>
      </header>

      {/* Template Selector */}
      <div className="mt-5 relative">
        <button
          onClick={() => setDropdownOpen((s) => !s)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
        >
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-800">
              {TEMPLATES[selected].title}
            </div>
            <div className="text-xs text-gray-500">{TEMPLATES[selected].body}</div>
          </div>
          <ChevronDown size={18} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute z-20 left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto"
            >
              {Object.keys(TEMPLATES).map((k) => (
                <li key={k}>
                  <button
                    onClick={() => selectTemplate(k)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100"
                  >
                    <div className="text-sm font-medium">{TEMPLATES[k].title}</div>
                    <div className="text-xs text-gray-500">{TEMPLATES[k].body}</div>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Message Box */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={TEMPLATES[selected].body}
        className="w-full mt-3 p-3 rounded-lg border bg-gray-50 text-sm min-h-[110px] focus:ring-2 focus:ring-sky-400 outline-none"
      />

      {/* Location + Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={fetchLocation}
          className="flex items-center gap-1 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium hover:bg-sky-100 transition"
        >
          <MapPin size={16} />
          {location ? `${location.lat}, ${location.lon}` : "Get Location"}
        </button>

        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border bg-white text-xs"
          placeholder="Recipient (e.g. +911234567890)"
        />

        <button
          onClick={shareMessage}
          className="px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* Send Buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => send({ via: "auto" })}
          disabled={status === "sending"}
          className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold shadow ${
            isOnline ? "bg-sky-600 hover:bg-sky-700" : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {status === "sending" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {status === "sending" ? "Sending..." : isOnline ? "Send (API)" : "Send (SMS App)"}
        </button>

        <button
          onClick={() => send({ via: "sms-app" })}
          className="px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition"
        >
          <PhoneCall size={18} />
        </button>
      </div>

      {/* Status Messages */}
      <AnimatePresence>
        {status === "success" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 inline-flex items-center gap-2 text-xs bg-green-600 text-white px-3 py-1 rounded-full"
          >
            <CheckCircle2 size={14} /> Sent successfully
          </motion.div>
        )}
        {status === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 inline-flex items-center gap-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded-full"
          >
            <AlertTriangle size={14} /> Opened SMS app / Offline fallback
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent activity</h4>
          <ul className="space-y-2 text-xs">
            {history.map((h) => (
              <li
                key={h.id || h.time}
                className="p-3 rounded-lg bg-gray-50 border flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="text-[12px] text-gray-700 line-clamp-3">{h.text}</div>
                  <div className="text-[10px] text-gray-500 mt-1">
                    {fmtTime(h.time)} • {h.sentVia}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
