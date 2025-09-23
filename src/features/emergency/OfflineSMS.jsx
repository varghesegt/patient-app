

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
  History,
  Trash2,
  RefreshCw,
  Edit2,
} from "lucide-react";

/* ================= CONFIG ================= */
const DEFAULT_RECIPIENT = "+911234567890";
const MAX_SMS_PART = 150; // conservative; real MMS/SMS segmentation varies by carrier

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

/* ================= SIMPLE IDB WRAPPER ================= */
// Small promise-based IndexedDB helper. If IDB unavailable, falls back to localStorage.
const IDB_DB = "offlineSMS_db";
const IDB_STORE = "messages";

function openIdb() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in window)) return res(null);
    const r = indexedDB.open(IDB_DB, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => res(null); // fallback
  });
}

async function idbGetAll() {
  const idb = await openIdb();
  if (!idb) return JSON.parse(localStorage.getItem('offlineSMS_store') || '[]');
  return new Promise((res) => {
    const tx = idb.transaction(IDB_STORE, 'readonly');
    const store = tx.objectStore(IDB_STORE);
    const all = store.getAll();
    all.onsuccess = () => res(all.result || []);
    all.onerror = () => res([]);
  });
}

async function idbPut(item) {
  const idb = await openIdb();
  if (!idb) {
    const existing = JSON.parse(localStorage.getItem('offlineSMS_store') || '[]');
    const next = [item, ...existing].slice(0, 100);
    localStorage.setItem('offlineSMS_store', JSON.stringify(next));
    return;
  }
  return new Promise((res) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(item);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

async function idbDelete(id) {
  const idb = await openIdb();
  if (!idb) {
    const remaining = (JSON.parse(localStorage.getItem('offlineSMS_store') || '[]') || []).filter(x => x.id !== id);
    localStorage.setItem('offlineSMS_store', JSON.stringify(remaining));
    return;
  }
  return new Promise((res) => {
    const tx = idb.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

/* ================= HELPERS ================= */
const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isiOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

function buildMapsLink(lat, lon) {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

function splitSms(text) {
  if (!text) return [];
  const parts = [];
  let rest = text;
  while (rest.length) {
    parts.push(rest.slice(0, MAX_SMS_PART));
    rest = rest.slice(MAX_SMS_PART);
  }
  return parts;
}

function buildSmsUri(number, body) {
  // Android: sms:number?body=...  iOS: sms:number&body=...
  const encoded = encodeURIComponent(body);
  if (isiOS) return `sms:${number}&body=${encoded}`;
  return `sms:${number}?body=${encoded}`;
}

/* ================= SERVICE WORKER / BACKGROUND SYNC HELPERS ================= */
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    // try to register sync tag if supported
    if ('sync' in reg) {
      // later: reg.sync.register('send-sms');
    }
    return reg;
  } catch (e) {
    return null;
  }
}

/* ================= MAIN COMPONENT ================= */
export default function OfflineSMS() {
  const [online, setOnline] = useState(navigator.onLine);
  const [selected, setSelected] = useState('accident');
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [swRegistered, setSwRegistered] = useState(false);

  const mounted = useRef(true);
  const watchId = useRef(null);

  useEffect(() => {
    mounted.current = true;
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    // load IDB history + pending
    (async () => {
      const all = await idbGetAll();
      const hist = (all || []).filter(x => x.sentVia).sort((a,b) => b.time - a.time).slice(0, 50);
      const pend = (JSON.parse(localStorage.getItem('pendingSMS') || '[]')) || [];
      setHistory(hist);
      setPending(pend);
    })();

    // register sw
    (async () => {
      const reg = await registerServiceWorker();
      setSwRegistered(!!reg);
    })();

    // start watchPosition to keep location fresh (permission required)
    startWatchingLocation();

    return () => {
      mounted.current = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      stopWatchingLocation();
    };
  }, []);

  useEffect(() => {
    // when connection returns, try to flush pending queue
    if (online && pending.length) flushPending();
  }, [online]);

  /* ===== Location ===== */
  function startWatchingLocation() {
    if (!('geolocation' in navigator)) return;
    try {
      setLocLoading(true);
      watchId.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const loc = { lat: Number(pos.coords.latitude.toFixed(6)), lon: Number(pos.coords.longitude.toFixed(6)) };
          setLocation(loc);
          localStorage.setItem('lastLocation', JSON.stringify(loc));
          setLocLoading(false);
          if (online) reverseGeocode(loc.lat, loc.lon).then(addr => setAddress(addr)).catch(() => {});
        },
        (err) => {
          // fallback to last known
          const cache = localStorage.getItem('lastLocation');
          if (cache) setLocation(JSON.parse(cache));
          setLocLoading(false);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    } catch (e) {
      setLocLoading(false);
    }
  }

  function stopWatchingLocation() {
    if (watchId.current != null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }

  async function reverseGeocode(lat, lon) {
    // uses OpenStreetMap Nominatim - for demo only. Respect usage policy.
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
      if (!res.ok) return null;
      const json = await res.json();
      return (json.display_name || null);
    } catch { return null; }
  }

  /* ===== Message builder ===== */
  const buildMessageText = (customText) => {
    const template = TEMPLATES[selected];
    const base = customText?.trim().length ? customText.trim() : template.body;
    const time = new Date().toLocaleString();
    const locPart = location
      ? `\n📍 Location: ${location.lat}, ${location.lon}\n🌐 Maps: ${buildMapsLink(location.lat, location.lon)}`
      : '\n📍 Location: Not available (GPS error)';
    const addrPart = address ? `\n🏷 Address: ${address}` : '';
    return `${template.title}\n\n${base}\n\n🕒 ${time}${locPart}${addrPart}\n\n(Sent via Emergency App)`;
  };

  /* ===== Persistence ===== */
  const pushHistory = async (entry) => {
    // save to IDB (preferred) and update local state
    await idbPut(entry);
    setHistory((prev) => [entry, ...prev].slice(0, 50));
  };

  const queuePending = (msg) => {
    const next = [msg, ...pending].slice(0, 100);
    setPending(next);
    localStorage.setItem('pendingSMS', JSON.stringify(next));

    // try background sync registration if service worker + sync available
    if (navigator.serviceWorker && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => reg.sync.register('offline-sms-sync').catch(()=>{}));
    }
  };

  const removePendingById = async (id) => {
    const next = pending.filter(p => p.id !== id);
    setPending(next);
    localStorage.setItem('pendingSMS', JSON.stringify(next));
  };

  /* ===== Sending ===== */
  const sendViaApi = async (msg) => {
    // Replace with real API endpoint in production
    if (!online) throw new Error('offline');
    setStatus('sending');
    // simulate API latency
    await new Promise(r => setTimeout(r, 900));
    if (!mounted.current) return;
    setStatus('success');
    await pushHistory({ ...msg, sentVia: 'API', time: Date.now() });
    setTimeout(() => setStatus(null), 1500);
    return true;
  };

  const openNativeSmsApp = async (msg) => {
    const parts = splitSms(msg.text);
    if (parts.length <= 1) {
      const uri = buildSmsUri(msg.recipient, msg.text);
      try {
        window.location.href = uri;
        await pushHistory({ ...msg, sentVia: 'SMS App', time: Date.now() });
        if (navigator.vibrate) navigator.vibrate([60,40]);
        return true;
      } catch (e) {
        return false;
      }
    }

    // for multi-part SMS we open SMS app with full body (most apps handle long texts)
    const uri = buildSmsUri(msg.recipient, msg.text);
    try {
      window.location.href = uri;
      await pushHistory({ ...msg, sentVia: 'SMS App', time: Date.now() });
      return true;
    } catch { return false; }
  };

  const send = async (opts = { via: 'auto' }) => {
    if (!location && !locLoading) startWatchingLocation();
    const txt = buildMessageText(message);
    const msg = { id: Date.now() + Math.floor(Math.random()*1000), text: txt, recipient };

    // prefer API when online
    if (online && opts.via !== 'sms-app') {
      try {
        await sendViaApi(msg);
        setMessage('');
        return;
      } catch (err) {
        // if API fails, queue and fallback to SMS app on mobile
        queuePending(msg);
        if (isMobile) openNativeSmsApp(msg);
        setMessage('');
        return;
      }
    }

    // if offline or user forced SMS app
    const didOpen = await openNativeSmsApp(msg);
    if (!didOpen) {
      // as a last resort, queue pending and show confirmation to user to copy
      queuePending(msg);
      alert('Could not open SMS app. Message has been queued locally and will be sent when connection is restored.');
    }
    setMessage('');
  };

  /* Retry / flush pending */
  const flushPending = async () => {
    const saved = JSON.parse(localStorage.getItem('pendingSMS') || '[]');
    // attempt send each via API; if succeeds remove from pending
    for (const m of saved) {
      try {
        await sendViaApi(m);
        await removePendingById(m.id);
      } catch (e) {
        // keep it
      }
    }
  };

  /* Share API */
  const shareMessage = async () => {
    const txt = buildMessageText(message);
    if (!navigator.share) { alert('Share API not supported'); return; }
    try {
      await navigator.share({ text: txt });
      await pushHistory({ id: Date.now(), text: txt, sentVia: 'Share API', time: Date.now() });
      setMessage('');
    } catch {}
  };

  /* Edit pending (quick) */
  const editPending = (id) => {
    const p = pending.find(x => x.id === id);
    if (!p) return;
    setMessage(p.text);
    // remove from pending on edit
    removePendingById(id);
  };

  const deletePending = (id) => {
    if (!confirm('Delete this queued message?')) return;
    removePendingById(id);
  };

  const selectTemplate = (key) => {
    setSelected(key);
    setMessage(prev => prev.trim().length ? prev : TEMPLATES[key].body);
    setDropdownOpen(false);
  };

  const fmtTime = (ts) => new Date(ts).toLocaleString();

  /* ================= UI ================= */
  return (
    <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 bg-white border rounded-2xl shadow-xl max-w-2xl w-full mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          {online ? <Wifi className="text-green-500" /> : <WifiOff className="text-red-500" />}
          Emergency Quick-Send
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500">{online ? 'Online' : 'Offline'}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100">SW: {swRegistered ? 'Yes' : 'No'}</span>
        </div>
      </header>

      {/* Template selector */}
      <div className="mt-5 relative">
        <button onClick={() => setDropdownOpen(s => !s)} className="w-full flex items-center justify-between gap-2 px-4 py-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition">
          <div className="text-left">
            <div className="text-sm font-semibold text-gray-800">{TEMPLATES[selected].title}</div>
            <div className="text-xs text-gray-500">{TEMPLATES[selected].body}</div>
          </div>
          <ChevronDown size={18} />
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute z-20 left-0 right-0 mt-2 bg-white border rounded-lg shadow-lg p-2 max-h-60 overflow-y-auto">
              {Object.keys(TEMPLATES).map(k => (
                <li key={k}>
                  <button onClick={() => selectTemplate(k)} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">
                    <div className="text-sm font-medium">{TEMPLATES[k].title}</div>
                    <div className="text-xs text-gray-500">{TEMPLATES[k].body}</div>
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* Message box */}
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={TEMPLATES[selected].body} className="w-full mt-3 p-3 rounded-lg border bg-gray-50 text-sm min-h-[120px] focus:ring-2 focus:ring-sky-400 outline-none" />

      {/* Location + actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => startWatchingLocation()} className="flex items-center gap-1 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium hover:bg-sky-100 transition">
          {locLoading ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
          {location ? `${location.lat}, ${location.lon}` : 'Get Location'}
        </button>

        <div className="flex-1 min-w-[160px]">
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white text-xs" placeholder="Recipient (e.g. +911234567890)" />
          {address && <div className="text-[10px] text-gray-500 mt-1 line-clamp-2">{address}</div>}
        </div>

        <button onClick={shareMessage} className="px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition"><Share2 size={16} /></button>
      </div>

      {/* Send buttons */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => send({ via: 'auto' })} disabled={status === 'sending'} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold shadow ${online ? 'bg-sky-600 hover:bg-sky-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
          {status === 'sending' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {status === 'sending' ? 'Sending...' : online ? 'Send (API)' : 'Send (SMS App)'}
        </button>

        <button onClick={() => send({ via: 'sms-app' })} className="px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition"><PhoneCall size={18} /></button>
      </div>

      {/* Status */}
      <AnimatePresence>
        {status === 'success' && (<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 inline-flex items-center gap-2 text-xs bg-green-600 text-white px-3 py-1 rounded-full"><CheckCircle2 size={14} /> Sent successfully</motion.div>)}
        {status === 'error' && (<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 inline-flex items-center gap-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded-full"><AlertTriangle size={14} /> Opened SMS app / Offline fallback</motion.div>)}
      </AnimatePresence>

      {/* Pending queue */}
      {pending.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-2"><History size={14} /> Pending (unsent) <span className="ml-2 text-xs bg-red-100 px-2 py-0.5 rounded-full">{pending.length}</span></h4>
          <ul className="space-y-2 text-xs">
            {pending.map(p => (
              <li key={p.id} className="p-3 rounded-lg bg-yellow-50 border flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-[12px] text-gray-700 line-clamp-3">{p.text}</div>
                  <div className="text-[10px] text-gray-500 mt-1">Queued locally • {new Date(p.createdAt || p.id).toLocaleString()}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => flushPending()} className="text-blue-600 text-xs flex items-center gap-1"><RefreshCw size={12} /> Retry all</button>
                  <button onClick={() => editPending(p.id)} className="text-gray-600 text-xs flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                  <button onClick={() => deletePending(p.id)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Recent activity</h4>
          <ul className="space-y-2 text-xs">
            {history.map(h => (
              <li key={h.id || h.time} className="p-3 rounded-lg bg-gray-50 border flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-[12px] text-gray-700 line-clamp-3">{h.text}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{fmtTime(h.time)} • {h.sentVia}</div>
                </div>
                <button onClick={async () => { await idbDelete(h.id); setHistory(prev => prev.filter(x => x.id !== h.id)); }} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}

