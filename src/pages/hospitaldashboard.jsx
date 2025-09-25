import React, { useEffect, useMemo, useState, useContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  Bell,
  Activity,
  Loader2,
  Search as SearchIcon,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  PlusCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { LanguageContext } from "../context/LanguageContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// -----------------------------
// Dummy data (can be replaced by props / API calls)
// -----------------------------
const INITIAL_PATIENTS = [
  { id: 1, name: "John Doe", age: 29, admitted: "2025-09-20", dept: "General" },
  { id: 2, name: "Jane Smith", age: 34, admitted: "2025-09-21", dept: "Cardiology" },
  { id: 3, name: "Mark Wilson", age: 41, admitted: "2025-09-22", dept: "Neurology" },
  { id: 4, name: "Alice Johnson", age: 37, admitted: "2025-09-23", dept: "Orthopedics" },
];

const INITIAL_APPOINTMENTS = [
  { id: 1, doctor: "Dr. Sharma", patient: "John Doe", time: "10:00 AM", dept: "General" },
  { id: 2, doctor: "Dr. Verma", patient: "Jane Smith", time: "11:30 AM", dept: "Cardiology" },
  { id: 3, doctor: "Dr. Rao", patient: "Mark Wilson", time: "01:00 PM", dept: "Neurology" },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: "New patient admitted: Alice Johnson", type: "success" },
  { id: 2, text: "Critical case in Cardiology!", type: "alert" },
  { id: 3, text: "Appointment rescheduled: John Doe", type: "info" },
];

const INITIAL_AMBULANCES = [
  { id: 1, driver: "Ramesh", status: "idle", assignedTo: null },
  { id: 2, driver: "Sita", status: "on trip", assignedTo: "Jane Smith" },
  { id: 3, driver: "Kumar", status: "idle", assignedTo: null },
];

const PIE_DATA = [
  { name: "General", value: 45 },
  { name: "Cardiology", value: 25 },
  { name: "Neurology", value: 15 },
  { name: "Orthopedics", value: 15 },
];

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7"];

// -----------------------------
// Main component
// -----------------------------
export default function HospitalDashboard() {
  const { lang } = useContext(LanguageContext) || { lang: "en" };
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [ambulances, setAmbulances] = useState(INITIAL_AMBULANCES);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("week"); // day | week | month

  // Chart data memoization (avoid regeneration on every render)
  const dailyData = useMemo(() => [
    { date: "08:00", patients: 5 },
    { date: "12:00", patients: 10 },
    { date: "16:00", patients: 7 },
    { date: "20:00", patients: 12 },
  ], []);

  const weeklyData = useMemo(() => [
    { date: "Mon", patients: 10 },
    { date: "Tue", patients: 15 },
    { date: "Wed", patients: 12 },
    { date: "Thu", patients: 20 },
    { date: "Fri", patients: 18 },
    { date: "Sat", patients: 22 },
    { date: "Sun", patients: 17 },
  ], []);

  // Generate stable monthly data once on mount
  const monthlyData = useMemo(() => {
    const arr = Array.from({ length: 30 }, (_, i) => ({
      date: `Day ${i + 1}`,
      patients: Math.floor(Math.random() * 25) + 5,
    }));
    return arr;
  }, []);

  const chartData = useMemo(() => {
    if (timeRange === "day") return dailyData;
    if (timeRange === "week") return weeklyData;
    if (timeRange === "month") return monthlyData;
    return weeklyData;
  }, [timeRange, dailyData, weeklyData, monthlyData]);

  // Loading simulation
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Live notification simulator (cleans up on unmount)
  useEffect(() => {
    const interval = setInterval(() => {
      const next = INITIAL_NOTIFICATIONS[Math.floor(Math.random() * INITIAL_NOTIFICATIONS.length)];
      setNotifications(prev => [{ ...next, id: Date.now() }, ...prev].slice(0, 6));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Derived / filtered lists
  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter(p => p.name.toLowerCase().includes(q) || p.dept.toLowerCase().includes(q));
  }, [search, patients]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(a => a.patient.toLowerCase().includes(q) || a.doctor.toLowerCase().includes(q));
  }, [search, appointments]);

  // Ambulance stats
  const totalAmbulances = ambulances.length;
  const activeTrips = ambulances.filter(a => a.status === "on trip").length;
  const idleAmbulances = ambulances.filter(a => a.status === "idle").length;

  // Assign ambulance safely (updates ambulances + notifications)
  const assignAmbulance = (patientName) => {
    setAmbulances(prev => {
      const available = prev.find(a => a.status === "idle");
      if (!available) {
        setNotifications(n => [{ id: Date.now(), text: `No ambulances available for ${patientName}`, type: "alert" }, ...n].slice(0, 6));
        return prev;
      }
      const updated = prev.map(a => a.id === available.id ? { ...a, status: "on trip", assignedTo: patientName } : a);
      setNotifications(n => [{ id: Date.now(), text: `Ambulance #${available.id} assigned to ${patientName}`, type: "success" }, ...n].slice(0, 6));
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
        <Loader2 className="animate-spin mr-3" size={22} />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100 min-h-screen p-8 transition-colors duration-500 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold drop-shadow-sm">Hospital Dashboard</h1>
          <p className="mt-2 text-sm md:text-lg text-gray-500">Real-time insights · Care operations · Logistics</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-1/3">
          <SearchIcon size={18} className="text-gray-500" />
          <input
            aria-label="Search patients or appointments"
            type="search"
            placeholder="Search patients, doctors or departments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        <KpiCard icon={<Users className="text-sky-600" size={34} />} value={patients.length} label="Total Patients" trend="+5%" trendType="up" />
        <KpiCard icon={<Calendar className="text-green-600" size={34} />} value={appointments.length} label="Appointments" trend="+2%" trendType="up" />
        <KpiCard icon={<Bell className="text-amber-500" size={34} />} value={notifications.length} label="Notifications" />
        <KpiCard icon={<Activity className="text-purple-600" size={34} />} value={12} label="Active Doctors" />
        <KpiCard icon={<Truck className="text-red-500" size={34} />} value={totalAmbulances} label="Ambulances" subText={`Idle: ${idleAmbulances} · On Trip: ${activeTrips}`} />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients Trend */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="bg-white p-6 rounded-2xl shadow-lg col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Patients Trend</h2>
              <p className="text-xs text-gray-500">{timeRange === 'day' ? 'Hourly' : timeRange === 'week' ? 'Weekly' : 'Monthly'} admissions</p>
            </div>

            <div className="flex gap-2">
              {["day", "week", "month"].map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${timeRange === range ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {range === "day" ? "1 Day" : range === "week" ? "1 Week" : "1 Month"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" stroke="#333" />
                <YAxis stroke="#333" />
                <Tooltip />
                <Area type="monotone" dataKey="patients" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorPatients)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        {/* Department Pie */}
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Department Distribution</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={PIE_DATA} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                  {PIE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.section>
      </div>

      {/* Patients & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <DataTable
          title="Recent Patients"
          data={filteredPatients}
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'age', label: 'Age' },
            { key: 'dept', label: 'Department' },
            { key: 'admitted', label: 'Admitted' },
          ]}
        />

        <AppointmentList
          title="Upcoming Appointments"
          data={filteredAppointments}
          ambulances={ambulances}
          setAmbulances={setAmbulances}
          assignAmbulance={assignAmbulance}
        />
      </div>

      {/* Notifications Section */}
<div className="mt-10">
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="bg-white p-6 rounded-2xl shadow-lg"
  >
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold">Notifications</h2>
      <span className="text-sm text-gray-400">{notifications.length} total</span>
    </div>

    {notifications.length === 0 ? (
      <p className="text-gray-500">No notifications available.</p>
    ) : (
      <ul className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl shadow-sm"
            >
              <div className="mt-1">
                {n.type === "success" && <CheckCircle2 className="text-green-500" />}
                {n.type === "alert" && <XCircle className="text-red-500" />}
                {n.type === "info" && <Bell className="text-amber-500" />}
              </div>
              <div>
                <p className="text-sm font-medium">{n.text}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.id).toLocaleTimeString()}
                </p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    )}
  </motion.div>
</div>

    </div>
  );
}

// -----------------------------
// Subcomponents
// -----------------------------

function KpiCard({ icon, value, label, trend, trendType = 'up', subText }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-start gap-3">
      <div className="flex items-center gap-4 w-full justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-xl">{icon}</div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold">{value}</h3>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-semibold flex items-center gap-1 ${trendType === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trendType === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trend}
          </div>
        )}
      </div>
      {subText && <p className="text-xs text-gray-400">{subText}</p>}
    </motion.div>
  );
}

function DataTable({ title, data = [], columns = [] }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="text-xs text-gray-400">{data.length} records</div>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500">No data found.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-sky-50">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-2 text-left text-sm font-medium text-gray-600">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map(row => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                    {String(row[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );
}

function AppointmentList({ title, data = [], ambulances = [], setAmbulances = () => {}, assignAmbulance = () => {} }) {
  // local tracking map for immediate UI response
  const [localAssigned, setLocalAssigned] = useState(() => {
    const map = {};
    ambulances.forEach(a => { if (a.assignedTo) map[a.assignedTo] = a.id; });
    return map;
  });

  useEffect(() => {
    // keep localAssigned in sync when ambulances props change
    const map = {};
    ambulances.forEach(a => { if (a.assignedTo) map[a.assignedTo] = a.id; });
    setLocalAssigned(map);
  }, [ambulances]);

  const handleAssign = (patientName) => {
    const available = ambulances.find(a => a.status === 'idle');
    if (!available) {
      // graceful UI fallback
      alert(`No ambulances available for ${patientName}`);
      return;
    }

    // optimistic UI update
    setLocalAssigned(prev => ({ ...prev, [patientName]: available.id }));

    // call parent updater which will also emit a notification
    assignAmbulance(patientName);

    // also update ambulances locally if parent didn't (best-effort)
    setAmbulances(prev => prev.map(a => a.id === available.id ? { ...a, status: 'on trip', assignedTo: patientName } : a));
  };

  const isAnyIdle = ambulances.some(a => a.status === 'idle');

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="bg-white p-6 rounded-2xl shadow-lg overflow-y-auto max-h-[520px]">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>

      {data.length === 0 ? (
        <p className="text-gray-500">No appointments found.</p>
      ) : (
        <ul className="space-y-3">
          {data.map(a => {
            const assignedAmbulance = localAssigned[a.patient] || ambulances.find(x => x.assignedTo === a.patient)?.id;
            const assigned = Boolean(assignedAmbulance);

            return (
              <motion.li key={a.id} layout className={`flex justify-between items-center p-3 rounded-lg shadow-sm transition-colors ${assigned ? 'bg-green-50' : 'bg-sky-50'}`}>
                <div>
                  <p className="font-medium">{a.patient}</p>
                  <p className="text-gray-500 text-sm">{a.doctor} · {a.time} · {a.dept}</p>
                  {assigned && (
                    <p className="text-green-600 text-sm mt-1">🚑 Assigned Ambulance #{assignedAmbulance}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAssign(a.patient)}
                    disabled={!isAnyIdle || assigned}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition ${assigned ? 'bg-gray-300 text-gray-700 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`}
                    aria-disabled={!isAnyIdle || assigned}
                  >
                    <PlusCircle size={16} /> {assigned ? 'Assigned' : 'Assign Ambulance'}
                  </button>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
