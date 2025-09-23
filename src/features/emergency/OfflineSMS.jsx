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

const DEFAULT_RECIPIENT = "+911234567890";
const MAX_SMS_PART = 150;

const TEMPLATES = {
  accident: { title: "Accident — Need help", body: "🚨 Accident reported. Immediate assistance required." },
  stroke: { title: "Suspected Stroke — Urgent", body: "🚨 Suspected stroke. FAST: Face droop / Arm weakness / Speech trouble / Time critical." },
  cardiac: { title: "Cardiac Emergency", body: "🚨 Sudden chest pain / collapse — possible cardiac arrest. Please send help." },
  fire: { title: "Fire — Evacuate", body: "🔥 Fire emergency. Evacuation and rescue needed immediately." },
  other: { title: "Emergency", body: "🚨 Emergency — please respond immediately." },
};

const IDB_DB = "offlineSMS_db";
const IDB_STORE = "messages";

function openIdb() {
  return new Promise((res) => {
    if (!('indexedDB' in window)) return res(null);
    const r = indexedDB.open(IDB_DB, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => res(null);
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

const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isiOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;

function buildMapsLink(lat, lon) {
  return `https://maps.google.com/?q=${lat},${lon}`;
}

function buildGeoUri(lat, lon, label = 'Emergency') {
  // geo URI works on many Android devices: geo:lat,lon?q=lat,lon(label)
  return `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(label)})`;
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
  const encoded = encodeURIComponent(body);
  if (isiOS) return `sms:${number}&body=${encoded}`;
  return `sms:${number}?body=${encoded}`;
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch (e) {
    return null;
  }
}

export default function OfflineSMS() {
  const [online, setOnline] = useState(navigator.onLine);
  const [selected, setSelected] = useState('accident');
  const [message, setMessage] = useState('');

  const [location, setLocation] = useState(null); // { lat, lon, accuracy, ts }
  const [locationSource, setLocationSource] = useState(null); // 'gps' | 'cache' | 'manual'
  const [locLoading, setLocLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recipient, setRecipient] = useState(DEFAULT_RECIPIENT);
  const [history, setHistory] = useState([]);
  const [pending, setPending] = useState([]);
  const [swRegistered, setSwRegistered] = useState(false);

  const mounted = useRef(true);
  const watchId = useRef(null);
  const gpsRetryTimer = useRef(null);

  useEffect(() => {
    mounted.current = true;
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    (async () => {
      const all = await idbGetAll();
      const hist = (all || []).filter(x => x.sentVia).sort((a,b) => b.time - a.time).slice(0, 50);
      const pend = (JSON.parse(localStorage.getItem('pendingSMS') || '[]')) || [];
      const cachedLoc = JSON.parse(localStorage.getItem('lastLocation') || 'null');
      if (cachedLoc) {
        setLocation(cachedLoc);
        setLocationSource('cache');
      }
      setHistory(hist);
      setPending(pend);
    })();

    (async () => {
      const reg = await registerServiceWorker();
      setSwRegistered(!!reg);
    })();

    ensureGpsLock({ aggressive: true, maxAttempts: 4 });

    return () => {
      mounted.current = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      stopWatchingLocation();
      if (gpsRetryTimer.current) clearTimeout(gpsRetryTimer.current);
    };
  }, []);

  useEffect(() => {
    if (online && pending.length) flushPending();
  }, [online]);

  // Aggressive high-accuracy capture: tries getCurrentPosition, then watches until accuracy threshold or timeout.
  async function captureHighAccuracyLocation({ timeout = 12000, targetAccuracy = 50 } = {}) {
    if (!('geolocation' in navigator)) return null;

    return new Promise((resolve) => {
      let resolved = false;
      let localWatchId = null;
      const finish = (loc) => {
        if (resolved) return;
        resolved = true;
        if (localWatchId != null && 'geolocation' in navigator) navigator.geolocation.clearWatch(localWatchId);
        resolve(loc);
      };

      const onSuccess = (pos) => {
        const loc = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lon: Number(pos.coords.longitude.toFixed(6)),
          accuracy: pos.coords.accuracy,
          ts: Date.now(),
        };
        // if accuracy good enough, finish immediately
        if (loc.accuracy != null && loc.accuracy <= targetAccuracy) {
          setLocation(loc);
          setLocationSource('gps');
          localStorage.setItem('lastLocation', JSON.stringify(loc));
          finish(loc);
        } else {
          // keep watching; accept this if we run out of time
          setLocation(loc);
          setLocationSource('gps');
          localStorage.setItem('lastLocation', JSON.stringify(loc));
        }
      };

      const onError = () => {
        // ignore here, allow fallback below
      };

      try {
        // try a single immediate attempt first
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: Math.min(8000, timeout), maximumAge: 0 });
      } catch (e) {}

      try {
        // start watch so device keeps GPS active and we can get updated accuracy
        localWatchId = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, maximumAge: 0, timeout: timeout });
      } catch (e) {}

      // timeout fallback: resolve with cached loc or last seen loc
      gpsRetryTimer.current = setTimeout(() => {
        const cached = JSON.parse(localStorage.getItem('lastLocation') || 'null');
        if (cached) {
          setLocation(cached);
          setLocationSource('cache');
          finish(cached);
        } else {
          finish(null);
        }
      }, timeout);
    });
  }

  function startWatchingLocation() {
    if (!('geolocation' in navigator)) return;
    try {
      setLocLoading(true);
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const loc = { lat: Number(pos.coords.latitude.toFixed(6)), lon: Number(pos.coords.longitude.toFixed(6)), accuracy: pos.coords.accuracy, ts: Date.now() };
          setLocation(loc);
          setLocationSource('gps');
          localStorage.setItem('lastLocation', JSON.stringify(loc));
          setLocLoading(false);
        },
        () => {
          const cache = JSON.parse(localStorage.getItem('lastLocation') || 'null');
          if (cache) {
            setLocation(cache);
            setLocationSource('cache');
          }
          setLocLoading(false);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
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

  function setManualLocation(lat, lon) {
    const loc = { lat: Number(Number(lat).toFixed(6)), lon: Number(Number(lon).toFixed(6)), accuracy: null, ts: Date.now() };
    setLocation(loc);
    setLocationSource('manual');
    localStorage.setItem('lastLocation', JSON.stringify(loc));
  }

  const buildMessageText = (customText, locSnapshot = null) => {
    const template = TEMPLATES[selected];
    const base = customText?.trim().length ? customText.trim() : template.body;
    const time = new Date().toLocaleString();

    const loc = locSnapshot || location || JSON.parse(localStorage.getItem('lastLocation') || 'null');
    const sourceLabel = locationSource ? `Source:${locationSource}` : '';

    const locPart = loc
      ? `\n📍 Location: ${loc.lat}, ${loc.lon}\n${sourceLabel}${loc.accuracy ? ` • acc:${Math.round(loc.accuracy)}m` : ''}\n🌐 Maps: ${buildMapsLink(loc.lat, loc.lon)}\ngeo:${loc.lat},${loc.lon}`
      : '\n📍 Location: Not available (GPS error)';

    return `${template.title}\n\n${base}\n\n🕒 ${time}${locPart}\n\n(Sent via Emergency App)`;
  };

  const pushHistory = async (entry) => {
    await idbPut(entry);
    setHistory((prev) => [entry, ...prev].slice(0, 50));
  };

  const queuePending = (msg) => {
    const next = [msg, ...pending].slice(0, 100);
    setPending(next);
    localStorage.setItem('pendingSMS', JSON.stringify(next));
    if (navigator.serviceWorker && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(reg => reg.sync.register('offline-sms-sync').catch(()=>{}));
    }
  };

  const removePendingById = async (id) => {
    const next = pending.filter(p => p.id !== id);
    setPending(next);
    localStorage.setItem('pendingSMS', JSON.stringify(next));
  };

  const sendViaApi = async (msg) => {
    if (!online) throw new Error('offline');
    setStatus('sending');
    await new Promise(r => setTimeout(r, 900));
    if (!mounted.current) return;
    setStatus('success');
    await pushHistory({ ...msg, sentVia: 'API', time: Date.now() });
    setTimeout(() => setStatus(null), 1500);
    return true;
  };

  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {}
    // fallback: create textarea and copy
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e) { return false; }
  }

  const openNativeSmsApp = async (msg) => {
    const uri = buildSmsUri(msg.recipient, msg.text);
    let opened = false;
    try {
      // try to open SMS intent
      window.location.href = uri;
      opened = true;
      await pushHistory({ ...msg, sentVia: 'SMS App', time: Date.now() });
      if (navigator.vibrate) navigator.vibrate([60,40]);
      return true;
    } catch (e) {
      opened = false;
    }

    // if opening failed, copy to clipboard and inform user
    const copied = await copyToClipboard(msg.text);
    if (copied) alert('Message copied to clipboard. Paste into your SMS app and send.');
    else alert('Could not open SMS app and could not copy automatically. Please copy the message manually.');
    await pushHistory({ ...msg, sentVia: 'Queued (User-copy)', time: Date.now() });
    return false;
  };

  const send = async (opts = { via: 'auto' }) => {
    // try to get a better lock (short) when about to send
    if (!location || (location && location.accuracy && location.accuracy > 80)) {
      await captureHighAccuracyLocation({ timeout: 8000, targetAccuracy: 60 });
    }

    // snapshot location at send time
    const locSnapshot = location || JSON.parse(localStorage.getItem('lastLocation') || 'null');
    const txt = buildMessageText(message, locSnapshot);
    const msg = { id: Date.now() + Math.floor(Math.random()*1000), text: txt, recipient, createdAt: Date.now(), locationSnapshot: locSnapshot };

    if (online && opts.via !== 'sms-app') {
      try {
        await sendViaApi(msg);
        setMessage('');
        return;
      } catch (err) {
        queuePending(msg);
        if (isMobile) openNativeSmsApp(msg);
        setMessage('');
        return;
      }
    }

    const didOpen = await openNativeSmsApp(msg);
    if (!didOpen) {
      queuePending(msg);
    }
    setMessage('');
  };

  const flushPending = async () => {
    const saved = JSON.parse(localStorage.getItem('pendingSMS') || '[]');
    for (const m of saved) {
      try {
        await sendViaApi(m);
        await removePendingById(m.id);
      } catch {}
    }
  };

  const retryPendingViaApi = async (p) => {
    try {
      await sendViaApi(p);
      await removePendingById(p.id);
      alert('Pending message sent via API');
    } catch (e) {
      alert('Failed to send via API');
    }
  };

  const openPendingInSms = async (p) => {
    const ok = await openNativeSmsApp(p);
    if (ok) await removePendingById(p.id);
  };

  const shareMessage = async () => {
    const locSnapshot = location || JSON.parse(localStorage.getItem('lastLocation') || 'null');
    const txt = buildMessageText(message, locSnapshot);
    if (!navigator.share) { alert('Share API not supported'); return; }
    try {
      await navigator.share({ text: txt });
      await pushHistory({ id: Date.now(), text: txt, sentVia: 'Share API', time: Date.now() });
      setMessage('');
    } catch {}
  };

  const editPending = (id) => {
    const p = pending.find(x => x.id === id);
    if (!p) return;
    setMessage(p.text);
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

  return (
    <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="p-6 bg-white border rounded-2xl shadow-xl max-w-2xl w-full mx-auto">
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

      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={TEMPLATES[selected].body} className="w-full mt-3 p-3 rounded-lg border bg-gray-50 text-sm min-h-[120px] focus:ring-2 focus:ring-sky-400 outline-none" />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button onClick={() => ensureGpsLock({ aggressive: true, maxAttempts: 4 })} className="flex items-center gap-1 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-xs font-medium hover:bg-sky-100 transition">
          {locLoading ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
          {location ? `${location.lat}, ${location.lon} (${locationSource || 'unknown'})` : 'Get Location'}
        </button>

        <div className="flex-1 min-w-[160px]">
          <input value={recipient} onChange={(e) => setRecipient(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-white text-xs" placeholder="Recipient (e.g. +911234567890)" />
        </div>

        <div className="flex gap-2">
          <button onClick={() => {
            const manual = prompt('Enter coordinates as lat,lon (e.g. 12.9716,77.5946)');
            if (!manual) return;
            const [la, lo] = manual.split(',').map(s => s && s.trim());
            if (!la || !lo || Number.isNaN(Number(la)) || Number.isNaN(Number(lo))) { alert('Invalid coords'); return; }
            setManualLocation(la, lo);
          }} className="px-3 py-2 bg-white border rounded-lg text-xs">Manual</button>

          <button onClick={shareMessage} className="px-3 py-2 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 transition"><Share2 size={16} /></button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={() => send({ via: 'auto' })} disabled={status === 'sending'} className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-white font-semibold shadow ${online ? 'bg-sky-600 hover:bg-sky-700' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
          {status === 'sending' ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {status === 'sending' ? 'Sending...' : online ? 'Send (API)' : 'Send (SMS App)'}
        </button>

        <button onClick={() => send({ via: 'sms-app' })} className="px-4 py-3 rounded-lg border bg-white hover:bg-gray-50 transition"><PhoneCall size={18} /></button>
      </div>

      <AnimatePresence>
        {status === 'success' && (<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 inline-flex items-center gap-2 text-xs bg-green-600 text-white px-3 py-1 rounded-full"><CheckCircle2 size={14} /> Sent successfully</motion.div>)}
        {status === 'error' && (<motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 inline-flex items-center gap-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded-full"><AlertTriangle size={14} /> Opened SMS app / Offline fallback</motion.div>)}
      </AnimatePresence>

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
                  <button onClick={() => retryPendingViaApi(p)} className="text-blue-600 text-xs flex items-center gap-1">Retry (API)</button>
                  <button onClick={() => openPendingInSms(p)} className="text-gray-600 text-xs flex items-center gap-1">Open SMS</button>
                  <button onClick={() => (async () => { await copyToClipboard(p.text); alert('Copied pending message to clipboard'); })()} className="text-gray-600 text-xs flex items-center gap-1">Copy</button>
                  <button onClick={() => editPending(p.id)} className="text-gray-600 text-xs flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                  <button onClick={() => deletePending(p.id)} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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

function fmtTime(ts) { return new Date(ts).toLocaleString(); }