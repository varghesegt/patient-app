import React, { useEffect, useState, useRef } from "react";
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
  // ===== State Management =====
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [manualLocation, setManualLocation] = useState({ lat: "", lng: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("sosHistory")) || []
  );
  const [sosQueue, setSosQueue] = useState(
    JSON.parse(localStorage.getItem("sosQueue")) || []
  );
  const [vibrateSupported, setVibrateSupported] = useState(false);
  const [nearbyHospitals, setNearbyHospitals] = useState({ gov: [], priv: [] });
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hiddenTypes, setHiddenTypes] = useState([]);

  // Emergency types (static ref so not re-rendered)
  const emergencyTypesRef = useRef([
    { id: "accident", label: "Accident" },
    { id: "stroke", label: "Stroke" },
    { id: "fire", label: "Fire" },
    { id: "assault", label: "Assault" },
    { id: "other", label: "Other" },
  ]);

  // ===== Effects =====
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    setVibrateSupported("vibrate" in navigator);

    if (isOnline) flushQueue();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  useEffect(() => {
    localStorage.setItem("sosQueue", JSON.stringify(sosQueue));
  }, [sosQueue]);

  useEffect(() => {
    localStorage.setItem("sosHistory", JSON.stringify(history));
  }, [history]);

  // ===== Helpers =====
  const saveToHistory = (data) =>
    setHistory(([data, ...history].slice(0, 10)));

  const addToQueue = (data) =>
    setSosQueue(([data, ...sosQueue].slice(0, 20)));

  const clearHistoryItem = (idx) =>
    setHistory(history.filter((_, i) => i !== idx));

  const clearQueue = () => setSosQueue([]);

  const isGovernmentHospital = (name) => {
    if (!name) return false;
    const keywords = [
      "govt",
      "government",
      "municipal",
      "state",
      "public",
      "regional",
      "rural hospital",
      "district hospital",
      "medical college",
    ];
    return keywords.some((k) => name.toLowerCase().includes(k));
  };

  // ===== Hospital Lookup =====
  const fetchNearbyHospitals = async (lat, lng, radius = 5000) => {
    try {
      setLoadingHospitals(true);
      const query = `[out:json][timeout:25];(
        node[amenity=hospital](around:${radius},${lat},${lng});
        way[amenity=hospital](around:${radius},${lat},${lng});
        relation[amenity=hospital](around:${radius},${lat},${lng});
      );out center 20;`;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const data = await res.json();
      const places = (data.elements || []).map((el) => ({
        id: el.id,
        name: el.tags?.name || el.tags?.operator,
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        addr: el.tags?.["addr:full"] || el.tags?.["addr:street"],
        tags: el.tags || {},
      }));

      setNearbyHospitals({
        gov: places.filter((p) => isGovernmentHospital(p.name)),
        priv: places.filter((p) => !isGovernmentHospital(p.name)),
      });
    } catch (err) {
      console.error("Hospital lookup failed:", err);
      setNearbyHospitals({ gov: [], priv: [] });
    } finally {
      setLoadingHospitals(false);
    }
  };

  // ===== SOS Handling =====
  const flushQueue = async () => {
    if (!isOnline || sosQueue.length === 0) return;
    const remaining = [];

    for (const item of sosQueue) {
      try {
        const res = await fetch("/api/emergency/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error("Failed to send");
      } catch {
        remaining.push(item);
      }
    }
    setSosQueue(remaining);
  };

  const handleSOS = async (useLiveLocation, type = "other") => {
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
        latitude = parseFloat(manualLocation.lat);
        longitude = parseFloat(manualLocation.lng);
      }

      const nearest = await fetchNearbyHospitals(latitude, longitude, 10000);

      const sosData = {
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
        status: isOnline ? "Sent Online" : "Queued Offline",
        type,
        nearestGovHospitals: nearest.gov?.slice(0, 3),
        nearestPrivateHospitals: nearest.priv?.slice(0, 3),
      };

      if (isOnline) {
        try {
          const res = await fetch("/api/emergency/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sosData),
          });
          if (!res.ok) throw new Error("Server POST failed");
        } catch {
          addToQueue(sosData);
        }
      } else {
        const smsBody = encodeURIComponent(
          `🚨 EMERGENCY (${type.toUpperCase()})! Location: https://maps.google.com/?q=${latitude},${longitude}`
        );
        window.location.href = `sms:?body=${smsBody}`;
        addToQueue({ ...sosData, status: "Queued Offline - SMS Sent" });
      }

      saveToHistory(sosData);
      setHiddenTypes((prev) => [...prev, type]);

      setSending(false);
      setSent(true);
      vibrateSupported && navigator.vibrate([200, 100, 200]);

      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      console.error("SOS failed:", err);
      setSending(false);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    navigator.geolocation.getCurrentPosition((pos) =>
      fetchNearbyHospitals(pos.coords.latitude, pos.coords.longitude, 8000)
    );
  };

  // ===== UI =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6 sm:p-10 relative overflow-hidden">
      {/* Glowing Background */}
      <motion.div
        animate={{ x: [0, 20, 0], y: [0, 15, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-10 left-10 w-60 h-60 bg-red-300 rounded-full blur-3xl opacity-20 pointer-events-none"
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
            Quick emergency actions. Select a type to send location + suggested
            nearby hospitals. Government hospitals are shown first.
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

        {/* SOS Main Button */}
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
              whileTap={{ scale: 0.95 }}
              onClick={openModal}
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
                Tap to choose emergency type & location.
              </p>
            )}
            {sending && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sending location…
              </p>
            )}
            {sent && (
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold">
                SOS triggered ✅
              </p>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {modalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl relative">
                <button onClick={() => setModalOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X size={20} /></button>
                <h4 className="text-lg font-semibold mb-4">Choose Emergency Type & Location</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-medium mb-2">Emergency Type</p>
                    <div className="flex flex-wrap gap-2">
                      {emergencyTypesRef.current.map((t) => {
                        if (hiddenTypes.includes(t.id)) return null; // disappear after selecting
                        return (
                          <button key={t.id} onClick={() => handleSOS(true, t.id)} className="px-3 py-2 rounded-lg bg-red-600 text-white hover:opacity-90">
                            {t.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4">
                      <p className="font-medium mb-2">Or use custom location</p>
                      <input type="text" placeholder="Latitude" value={manualLocation.lat} onChange={(e) => setManualLocation({ ...manualLocation, lat: e.target.value })} className="border rounded p-2 w-full mb-2" />
                      <input type="text" placeholder="Longitude" value={manualLocation.lng} onChange={(e) => setManualLocation({ ...manualLocation, lng: e.target.value })} className="border rounded p-2 w-full mb-2" />
                      <div className="flex gap-2">
                        <button onClick={() => handleSOS(false, 'other')} disabled={!manualLocation.lat || !manualLocation.lng} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Send From Custom Location</button>
                        <button onClick={() => {
                          navigator.geolocation.getCurrentPosition((p)=>{
                            setManualLocation({ lat: p.coords.latitude, lng: p.coords.longitude });
                          });
                        }} className="px-4 py-2 bg-gray-200 rounded-lg">Use Current Loc</button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="font-medium mb-2">Nearby Hospitals (government first)</p>
                    <div className="h-56 overflow-auto border rounded p-2">
                      {loadingHospitals ? (
                        <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Loading…</div>
                      ) : (
                        <>
                          {nearbyHospitals.gov.length === 0 && nearbyHospitals.priv.length === 0 ? (
                            <p className="text-sm text-gray-500">No hospitals found yet. Allow location and reopen modal or try again.</p>
                          ) : (
                            <>
                              {nearbyHospitals.gov.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-green-700">Government Hospitals</p>
                                  <ul className="space-y-2 mt-2">
                                    {nearbyHospitals.gov.map((h) => (
                                      <li key={h.id} className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium">{h.name || "Unnamed Gov Hospital"}</div>
                                          <div className="text-xs text-gray-500">{h.addr}</div>
                                        </div>
                                        <a href={`https://maps.google.com/?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Map</a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {nearbyHospitals.priv.length > 0 && (
                                <div className="mt-4">
                                  <p className="text-xs font-semibold text-gray-700">Private Hospitals</p>
                                  <ul className="space-y-2 mt-2">
                                    {nearbyHospitals.priv.map((h) => (
                                      <li key={h.id} className="flex justify-between items-start">
                                        <div>
                                          <div className="font-medium">{h.name || "Unnamed Private Hospital"}</div>
                                          <div className="text-xs text-gray-500">{h.addr}</div>
                                        </div>
                                        <a href={`https://maps.google.com/?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600">Map</a>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button onClick={() => navigator.geolocation.getCurrentPosition((p)=>fetchNearbyHospitals(p.coords.latitude, p.coords.longitude, 8000))} className="flex-1 px-3 py-2 rounded-lg bg-gray-100">Refresh</button>
                      <button onClick={() => setNearbyHospitals({ gov: [], priv: [] })} className="px-3 py-2 rounded-lg bg-gray-100">Clear</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Offline & Queue */}
        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }} className="mt-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-lg border border-gray-200 dark:border-gray-700 p-6 rounded-2xl shadow-md">
          <OfflineSMS />
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Offline Queue</div>
              <div className="text-sm text-gray-500">{sosQueue.length} pending</div>
            </div>
            {sosQueue.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {sosQueue.map((q, i) => (
                  <li key={i} className="flex justify-between items-start border-b pb-1">
                    <div>
                      <div className="font-medium">{q.type?.toUpperCase() || 'SOS'}</div>
                      <div className="text-xs text-gray-500">{new Date(q.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { navigator.share && navigator.share({ title: 'SOS', text: `SOS: ${q.type} - https://maps.google.com/?q=${q.lat},${q.lng}` }); }} className="text-xs px-2 py-1 bg-gray-100 rounded">Share</button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 mt-2">No pending items</p>
            )}
            <div className="mt-3 flex gap-2">
              <button onClick={flushQueue} className="px-3 py-2 bg-green-600 text-white rounded">Try Send Now</button>
              <button onClick={clearQueue} className="px-3 py-2 bg-gray-200 rounded">Clear Queue</button>
            </div>
          </div>
        </motion.div>

        {/* SOS History */}
        {history.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.6 }} className="mt-8 bg-white/80 dark:bg-gray-800/70 p-5 rounded-xl shadow-md">
            <h4 className="flex items-center gap-2 font-semibold mb-3"><History size={18} /> Last SOS Requests</h4>
            <ul className="space-y-2 text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex justify-between border-b pb-1 text-gray-600 dark:text-gray-300">
                  <span>
                    {new Date(h.timestamp).toLocaleString()} - {h.status} - {h.type?.toUpperCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <a href={`https://maps.google.com/?q=${h.lat},${h.lng}`} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">View Map</a>
                    <button onClick={() => clearHistoryItem(i)} className="text-xs text-red-500">Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Additional Emergency Options */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }} className="mt-10 grid gap-6 sm:grid-cols-2">
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
              title: "Share Location",
              desc: "Share your current map link with a contact.",
              color: "text-purple-500",
              action: () => navigator.share && navigator.share({ title: "My Location", text: `I'm here: ${window.location.href}` }),
            },
            {
              icon: AlertTriangle,
              title: "Critical Alerts",
              desc: "Get notified of nearby incidents or hazards.",
              color: "text-orange-500",
            },
          ].map((card, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }} onClick={card.action} className="bg-white/90 dark:bg-gray-800/90 p-5 rounded-xl shadow hover:shadow-lg transition cursor-pointer flex flex-col gap-2">
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
