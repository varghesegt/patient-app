import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  WifiOff,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  Copy,
  Share2,
  ChevronDown,
} from "lucide-react";

/**
 * Advanced OfflineSMS component
 *
 * Features:
 * - Emergency type selector (templates)
 * - GPS auto-attach
 * - Instant send: online -> API (simulated), offline -> native SMS app (sms: URI)
 * - Copy/share fallback, vibrate/alert UX
 * - Small local history (no queueing)
 * - Auto-retry last message once online (keeps immediate-send behavior)
 *
 * Replace the `onlineSendApi` function with your real backend/Twilio API call.
 * Replace `DEFAULT_RECIPIENT` with your emergency number(s).
 */

const DEFAULT_RECIPIENT = "+911234567890"; // <-- replace with actual number(s) or allow user input

const TEMPLATES = {
  accident: {
    title: "Accident — Need help",
    body: "🚨 Accident reported. Immediate assistance required.",
  },
  stroke: {
    title: "Suspected Stroke — Urgent",
    body:
      "🚨 Suspected stroke (FAST: Face droop / Arm weakness / Speech / Time). Need urgent medical help.",
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
    body: "🚨 Emergency — please respond.",
  },
};

export default function OfflineSMS() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selected, setSelected] = useState("accident");
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState(null); // "sending" | "success" | "error"
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("offlineSMS_history") || "[]")
  );
  const lastUnsent = useRef(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const mounted = useRef(true);

  // detect mobile (used for behavior & sms: uri)
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const updateStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateStatus);
    window.addEventListener("offline", updateStatus);

    // auto-retry last unsent once back online
    if (isOnline && lastUnsent.current) {
      // attempt resend automatically only once
      const msg = lastUnsent.current;
      lastUnsent.current = null;
      sendViaApi(msg).catch(() => {
        // if still fails, keep in lastUnsent so user can retry
        lastUnsent.current = msg;
      });
    }

    return () => {
      mounted.current = false;
      window.removeEventListener("online", updateStatus);
      window.removeEventListener("offline", updateStatus);
    };
  }, [isOnline]);

  // fetch location once on mount and whenever user re-fetches
  const fetchLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude.toFixed(5),
          lon: pos.coords.longitude.toFixed(5),
        });
      },
      (err) => {
        console.warn("Location denied:", err);
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  // Build the final message text
  const buildMessageText = (customText) => {
    const template = TEMPLATES[selected];
    const base = customText && customText.trim().length ? customText.trim() : template.body;
    const time = new Date().toLocaleString();
    const locText = location ? `\n📍 Location: ${location.lat}, ${location.lon}` : "";
    return `${template.title}\n\n${base}\n\n🕒 ${time}${locText}\n\n(Automated via App)`;
  };

  // local history helper
  const pushHistory = (entry) => {
    const next = [entry, ...history].slice(0, 10); // keep last 10
    setHistory(next);
    localStorage.setItem("offlineSMS_history", JSON.stringify(next));
  };

  // Simulated API send - replace with real API call (e.g. fetch to backend which calls Twilio)
  const sendViaApi = async (msg) => {
    if (!isOnline) throw new Error("offline");
    setStatus("sending");
    // simulate network latency & success/fail
    await new Promise((res) => setTimeout(res, 900));
    // simulate success (replace with fetch POST)
    if (!mounted.current) return;
    setStatus("success");
    pushHistory({ ...msg, sentVia: "API", time: Date.now() });
    // clear success badge after a short delay
    setTimeout(() => setStatus(null), 1800);
    return true;
  };

  // Offline path: open native SMS app via sms: URI (works on mobile). On desktop this may not work; fallback to copy/share.
  const openNativeSmsApp = (msg) => {
    const encoded = encodeURIComponent(msg.text);
    // multiple recipients allowed by comma separation if necessary
    const uri = `sms:${recipient}?body=${encoded}`;
    // try open
    try {
      window.location.href = uri;
      setStatus("error"); // show yellow badge that user is in SMS app flow
      pushHistory({ ...msg, sentVia: "SMS App (user)", time: Date.now() });
      // vibrate a short pattern (if available)
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } catch (e) {
      // fallback: copy to clipboard and ask user to paste into their SMS app.
      fallbackCopy(msg);
    }
  };

  const fallbackCopy = async (msg) => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setStatus("error");
      pushHistory({ ...msg, sentVia: "Clipboard", time: Date.now() });
      alert("Message copied to clipboard. Paste it into your SMS app to send.");
    } catch (err) {
      alert("Could not copy message automatically. Please select and copy the text manually.");
    }
  };

  // main send function used by UI
  const send = async (opts = { via: "auto" }) => {
    // build message object
    const txt = buildMessageText(message);
    const msg = { id: Date.now(), text: txt, recipient };

    // If online prefer API
    if (isOnline && opts.via !== "sms-app") {
      try {
        await sendViaApi(msg);
        setMessage("");
        return;
      } catch (err) {
        // If API failed despite being online, fall back to native SMS app or copy
        console.warn("API send failed, falling back:", err);
        lastUnsent.current = msg;
        if (isMobile) {
          openNativeSmsApp(msg);
        } else if (navigator.share) {
          try {
            await navigator.share({ text: msg.text });
            pushHistory({ ...msg, sentVia: "Share API", time: Date.now() });
            setStatus("success");
            setMessage("");
            setTimeout(() => setStatus(null), 1500);
            return;
          } catch (sErr) {
            fallbackCopy(msg);
          }
        } else {
          fallbackCopy(msg);
        }
        return;
      }
    }

    // Offline / forced SMS app path
    if (!isOnline || opts.via === "sms-app" || isMobile) {
      openNativeSmsApp(msg);
      setMessage(""); // clear local input (user still has to send manually)
      return;
    }

    // As a final attempt, try API (shouldn't hit here)
    try {
      await sendViaApi(msg);
      setMessage("");
    } catch (err) {
      lastUnsent.current = msg;
      fallbackCopy(msg);
    }
  };

  // copy message to clipboard quickly
  const copyMessage = async () => {
    const txt = buildMessageText(message);
    try {
      await navigator.clipboard.writeText(txt);
      if (navigator.vibrate) navigator.vibrate(40);
      alert("Copied to clipboard");
    } catch {
      alert("Copy failed — please select and copy manually");
    }
  };

  // share via Web Share API (mobile/compatible browsers)
  const shareMessage = async () => {
    const txt = buildMessageText(message);
    if (!navigator.share) {
      alert("Share API not supported on this device");
      return;
    }
    try {
      await navigator.share({ text: txt });
      pushHistory({ id: Date.now(), text: txt, sentVia: "Share API", time: Date.now() });
      setMessage("");
    } catch (err) {
      // user canceled or failed
      console.warn("Share failed", err);
    }
  };

  // quick template select handler that populates message area
  const selectTemplate = (key) => {
    setSelected(key);
    setMessage((prev) => {
      // if user hasn't typed or message equals previous template, replace; else leave user text
      const currentTemplateText = TEMPLATES[key].body;
      return prev.trim().length ? prev : currentTemplateText;
    });
    setDropdownOpen(false);
  };

  // present friendly formatted time for history
  const fmtTime = (ts) => new Date(ts).toLocaleString();

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="p-5 bg-white/90 dark:bg-gray-800/80 border rounded-2xl shadow-xl max-w-xl mx-auto"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <WifiOff className={`text-${isOnline ? "green" : "red"}-500`} size={18} />
            Emergency Quick-Send
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            Choose type → attach location → Send instantly. Offline opens your phone's SMS app.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-300">{isOnline ? "Online" : "Offline"}</div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{recipient}</div>
        </div>
      </header>

      {/* template selector */}
      <div className="mt-4 relative">
        <button
          onClick={() => setDropdownOpen((s) => !s)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700"
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {TEMPLATES[selected].title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-300 mt-0.5">{TEMPLATES[selected].body}</div>
          </div>
          <ChevronDown size={18} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.ul
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute z-20 left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/90 border rounded-lg shadow-lg p-2"
              role="listbox"
            >
              {Object.keys(TEMPLATES).map((k) => (
                <li key={k}>
                  <button
                    onClick={() => selectTemplate(k)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {TEMPLATES[k].title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-300">{TEMPLATES[k].body}</div>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* message editor */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={TEMPLATES[selected].body}
        className="w-full mt-3 p-3 rounded-lg border dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm min-h-[96px]"
      />

      {/* location + actions row */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={fetchLocation}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs"
          title="Fetch location"
        >
          <MapPin size={16} /> {location ? `${location.lat}, ${location.lon}` : "Fetch Location"}
        </button>

        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800 text-xs"
          placeholder="Recipient number (e.g. +911234567890)"
        />

        <button
          onClick={copyMessage}
          className="px-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          title="Copy message"
        >
          <Copy size={16} />
        </button>

        <button
          onClick={shareMessage}
          className="px-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
          title="Share message"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* send controls */}
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => send({ via: "auto" })}
          disabled={status === "sending"}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-semibold ${
            isOnline ? "bg-sky-600 hover:bg-sky-700" : "bg-yellow-600 hover:bg-yellow-700"
          }`}
        >
          {status === "sending" ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {status === "sending" ? "Sending..." : isOnline ? "Send Now (API)" : "Send via SMS App"}
        </button>

        {/* explicit open SMS app for user if wanted */}
        <button
          onClick={() => send({ via: "sms-app" })}
          className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-700"
          title="Open SMS app"
        >
          <PhoneCall size={16} />
        </button>
      </div>

      {/* inline status badges */}
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

      {/* small history (not pending) */}
      {history.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-2">Recent activity</h4>
          <ul className="space-y-2 text-xs">
            {history.map((h) => (
              <li
                key={h.id || h.time}
                className="p-2 rounded bg-gray-50 dark:bg-gray-700 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="text-[11px] text-gray-800 dark:text-gray-100 line-clamp-3">{h.text}</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-300 mt-1">
                    {fmtTime(h.time)} • {h.sentVia || "Unknown"}
                  </div>
                </div>
                <div className="ml-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(h.text);
                      alert("Copied to clipboard");
                    }}
                    className="px-2 py-1 rounded bg-white dark:bg-gray-600 text-xs"
                  >
                    Copy
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
