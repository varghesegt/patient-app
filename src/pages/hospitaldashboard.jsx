import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
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

// ===== Dummy Data =====
const patientsData = [
  { id: 1, name: "John Doe", age: 29, admitted: "2025-09-20", dept: "General" },
  { id: 2, name: "Jane Smith", age: 34, admitted: "2025-09-21", dept: "Cardiology" },
  { id: 3, name: "Mark Wilson", age: 41, admitted: "2025-09-22", dept: "Neurology" },
  { id: 4, name: "Alice Johnson", age: 37, admitted: "2025-09-23", dept: "Orthopedics" },
];

const appointmentsData = [
  { id: 1, doctor: "Dr. Sharma", patient: "John Doe", time: "10:00 AM", dept: "General" },
  { id: 2, doctor: "Dr. Verma", patient: "Jane Smith", time: "11:30 AM", dept: "Cardiology" },
  { id: 3, doctor: "Dr. Rao", patient: "Mark Wilson", time: "01:00 PM", dept: "Neurology" },
];

const notificationsDummy = [
  { id: 1, text: "New patient admitted: Alice Johnson", type: "success" },
  { id: 2, text: "Critical case in Cardiology!", type: "alert" },
  { id: 3, text: "Appointment rescheduled: John Doe", type: "info" },
];

const ambulancesData = [
  { id: 1, driver: "Ramesh", status: "idle", assignedTo: null },
  { id: 2, driver: "Sita", status: "on trip", assignedTo: "Jane Smith" },
  { id: 3, driver: "Kumar", status: "idle", assignedTo: null },
];

const pieData = [
  { name: "General", value: 45 },
  { name: "Cardiology", value: 25 },
  { name: "Neurology", value: 15 },
  { name: "Orthopedics", value: 15 },
];

const COLORS = ["#0ea5e9", "#22c55e", "#f97316", "#a855f7"];

export default function HospitalDashboard() {
  const { lang } = useContext(LanguageContext);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [search, setSearch] = useState("");
  const [ambulances, setAmbulances] = useState(ambulancesData);
  const [timeRange, setTimeRange] = useState("week"); // day / week / month

  // ===== Dummy trend data =====
  const dailyData = [
    { date: "08:00", patients: 5 },
    { date: "12:00", patients: 10 },
    { date: "16:00", patients: 7 },
    { date: "20:00", patients: 12 },
  ];
  const weeklyData = [
    { date: "Mon", patients: 10 },
    { date: "Tue", patients: 15 },
    { date: "Wed", patients: 12 },
    { date: "Thu", patients: 20 },
    { date: "Fri", patients: 18 },
    { date: "Sat", patients: 22 },
    { date: "Sun", patients: 17 },
  ];
  const monthlyData = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    patients: Math.floor(Math.random() * 25) + 5
  }));

  const getChartData = () => {
    if (timeRange === "day") return dailyData;
    if (timeRange === "week") return weeklyData;
    if (timeRange === "month") return monthlyData;
    return weeklyData;
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Live notifications simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const next = notificationsDummy[Math.floor(Math.random() * notificationsDummy.length)];
      setNotifications(prev => [{ ...next, id: Date.now() }, ...prev].slice(0, 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtered Patients & Appointments
  const filteredPatients = patientsData.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAppointments = appointmentsData.filter(a =>
    a.patient.toLowerCase().includes(search.toLowerCase())
  );

  // Ambulance stats
  const totalAmbulances = ambulances.length;
  const activeTrips = ambulances.filter(a => a.status === "on trip").length;
  const idleAmbulances = ambulances.filter(a => a.status === "idle").length;

  const assignAmbulance = (patientName) => {
    const available = ambulances.find(a => a.status === "idle");
    if (available) {
      setAmbulances(prev =>
        prev.map(a =>
          a.id === available.id ? { ...a, status: "on trip", assignedTo: patientName } : a
        )
      );
      setNotifications(prev => [
        { id: Date.now(), text: `Ambulance #${available.id} assigned to ${patientName}`, type: "success" },
        ...prev
      ].slice(0, 5));
    } else {
      setNotifications(prev => [
        { id: Date.now(), text: `No ambulances available for ${patientName}`, type: "alert" },
        ...prev
      ].slice(0, 5));
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-sky-600 font-semibold animate-pulse">
      <Loader2 className="animate-spin mr-2" size={24} /> Loading dashboard...
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100 min-h-screen p-8 transition-colors duration-500 relative">

      {/* Header + Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-5xl font-extrabold drop-shadow-sm">Hospital Dashboard</h1>
          <p className="mt-2 text-lg text-gray-500">Real-time Insights & Analytics</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-1/3">
          <SearchIcon size={20} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search patients or appointments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
          />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-10">
        <KpiCard icon={<Users className="text-sky-600" size={36} />} value={patientsData.length} label="Total Patients" trend="+5%" trendType="up" />
        <KpiCard icon={<Calendar className="text-green-600" size={36} />} value={appointmentsData.length} label="Appointments Today" trend="+2%" trendType="up" />
        <KpiCard icon={<Bell className="text-amber-500" size={36} />} value={notifications.length} label="Notifications" />
        <KpiCard icon={<Activity className="text-purple-600" size={36} />} value={12} label="Active Doctors" />
        <KpiCard icon={<Truck className="text-red-500" size={36} />} value={totalAmbulances} label="Ambulances" subText={`Idle: ${idleAmbulances} | On Trip: ${activeTrips}`} />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patients Trend */}
        <motion.div className="bg-white p-6 rounded-2xl shadow-lg col-span-2">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-semibold">Patients Trend</h2>
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
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={getChartData()}>
              <defs>
                <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc"/>
              <XAxis dataKey="date" stroke="#000"/>
              <YAxis stroke="#000"/>
              <Tooltip/>
              <Area type="monotone" dataKey="patients" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorPatients)"/>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Department Pie */}
        <motion.div className="bg-white p-6 rounded-2xl shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Department Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value">
                {pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Patients & Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
        <DataTable title="Recent Patients" data={filteredPatients} columns={["Name", "Age", "Department", "Admitted"]} />
        <AppointmentList title="Upcoming Appointments" data={filteredAppointments} assignAmbulance={assignAmbulance} />
      </div>
    </div>
  );
}

// ===== Sub-components (KpiCard, DataTable, AppointmentList) remain same as your previous code but polished with hover/animation effects =====
// ===== Components =====
function KpiCard({ icon, value, label, trend, trendType, subText }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} className="bg-white p-6 rounded-2xl shadow-xl flex flex-col items-start gap-2">
      <div className="flex items-center gap-3">{icon}<h2 className="text-4xl font-bold">{value}</h2></div>
      <p className="text-gray-500">{label}</p>
      {trend && (
        <p className={`text-sm font-semibold flex items-center gap-1 ${trendType === "up" ? "text-green-500" : "text-red-500"}`}>
          {trendType === "up" ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </p>
      )}
      {subText && <p className="text-gray-400 text-sm">{subText}</p>}
    </motion.div>
  );
}

function DataTable({ title, data, columns }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="bg-white p-6 rounded-2xl shadow-lg overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No data found.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-sky-100">
              {columns.map(col => <th key={col} className="px-4 py-2 text-left">{col}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-100 transition">
                {columns.map(col => {
                  const key = col.toLowerCase();
                  return <td key={key} className="px-4 py-2">{row[key]}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </motion.div>
  );
}

function AppointmentList({ title, data, ambulances, setAmbulances, assignAmbulance }) {
  const [assignedMap, setAssignedMap] = useState({}); // Track patient -> ambulance

  const handleAssign = (patientName) => {
    const available = ambulances.find(a => a.status === "idle");
    if (available) {
      // Update ambulances state
      setAmbulances(prev =>
        prev.map(a =>
          a.id === available.id ? { ...a, status: "on trip", assignedTo: patientName } : a
        )
      );
      // Track assignment locally
      setAssignedMap(prev => ({ ...prev, [patientName]: available.id }));
      assignAmbulance(patientName); // Optional: notify in dashboard
    } else {
      alert(`No ambulances available for ${patientName}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="bg-white p-6 rounded-2xl shadow-lg overflow-y-auto max-h-[500px]"
    >
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {data.length === 0 ? (
        <p className="text-gray-500">No appointments found.</p>
      ) : (
        <ul className="space-y-3">
          {data.map((a) => {
            const assignedAmbulance = assignedMap[a.patient] || ambulances.find(x => x.assignedTo === a.patient)?.id;
            const isAvailable = ambulances.some(a => a.status === "idle");

            return (
              <motion.li
                key={a.id}
                layout
                className={`flex justify-between items-center p-3 rounded-lg shadow-sm transition-colors ${
                  assignedAmbulance ? "bg-green-50" : "bg-sky-50"
                }`}
              >
                <div>
                  <p className="font-medium">{a.patient}</p>
                  <p className="text-gray-500 text-sm">{a.doctor} | {a.time}</p>
                  {assignedAmbulance && (
                    <p className="text-green-600 text-sm mt-1">
                      🚑 Assigned Ambulance #{assignedAmbulance}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleAssign(a.patient)}
                  disabled={!isAvailable || assignedAmbulance}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg transition 
                    ${assignedAmbulance ? "bg-gray-300 text-gray-700 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                  <PlusCircle size={16} /> {assignedAmbulance ? "Assigned" : "Assign Ambulance"}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

