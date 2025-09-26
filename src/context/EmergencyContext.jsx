import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const STORAGE_KEY = "emergency_alerts";
const ALERT_TTL = 5 * 60 * 1000;

export const EmergencyContext = createContext({
  alerts: [],
  dispatchSOS: () => {},
  clearAlert: () => {},
});

export function EmergencyProvider({ children, onDispatch }) {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAlerts(parsed.filter((a) => Date.now() - a.timestamp < ALERT_TTL));
      } catch {
        console.warn("Invalid stored alerts");
      }
    }
  }, []);


  useEffect(() => {
    const active = alerts.filter((a) => Date.now() - a.timestamp < ALERT_TTL);
    if (active.length !== alerts.length) setAlerts(active);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(active));
  }, [alerts]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setAlerts(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const dispatchSOS = useCallback(
    (data) => {
      const alert = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...data,
      };

      setAlerts((prev) => [alert, ...prev]);
      try {
        new Audio("/sos-alert.mp3").play().catch(() => {});
        if ("vibrate" in navigator) navigator.vibrate([300, 200, 300]);
      } catch (e) {
        console.warn("Notification error:", e);
      }
      if (onDispatch) onDispatch(alert);
    },
    [onDispatch]
  );

  const clearAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo(
    () => ({ alerts, dispatchSOS, clearAlert }),
    [alerts, dispatchSOS, clearAlert]
  );

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
}
