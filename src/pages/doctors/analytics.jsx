
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  BarChart3,
  Brain,
  Download,
  Upload,
  Share2,
  RefreshCw,
  Filter,
  PieChart as PieIcon,
  Clock,
  Users,
  Activity,
  Sparkles,
  Percent,
  LineChart as LineIcon,
  Target,
  TrendingUp,
  Database,
  Info,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart, Line,
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar,
} from "recharts";

/* ------------------------ Local Storage Source ------------------------ */
const LS = { APPTS: "dd_appts_v4" };
const load = (k, f) => { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : f; } catch { return f; } };

/* ------------------------------- Helpers ------------------------------ */
const dateISO = (d) => new Date(d).toISOString().slice(0, 10);
const fmtDT = (s) => new Date(s);
const clip = (n, a, b) => Math.max(a, Math.min(b, n));
const uniq = (arr) => [...new Set(arr)];
const isSameDay = (a, b = new Date()) => fmtDT(a).toDateString() === fmtDT(b).toDateString();
const withinDays = (iso, daysFromNow) => {
  const t = fmtDT(iso).getTime();
  const now = Date.now();
  return t >= now - daysFromNow * 86400000 && t <= now;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const durMins = (a, b) => Math.max(0, Math.round((fmtDT(b) - fmtDT(a)) / 60000));

/* Linear regression (least squares) on y over x=[0..n-1] */
function linReg(y) {
  const n = y.length;
  if (!n) return { m: 0, b: 0 };
  const sumX = (n - 1) * n / 2;
  const sumXX = (n - 1) * n * (2 * n - 1) / 6;
  const sumY = y.reduce((a, v) => a + v, 0);
  const sumXY = y.reduce((a, v, i) => a + i * v, 0);
  const denom = n * sumXX - sumX * sumX || 1;
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  return { m, b };
}
const forecastNext = (hist, k = 7) => {
  const y = hist.map((d) => d.value);
  const { m, b } = linReg(y);
  const startIdx = y.length;
  return Array.from({ length: k }).map((_, i) => {
    const idx = startIdx + i;
    return Math.max(0, Math.round(m * idx + b));
  });
};

/* Export helpers: CSV + per-chart PNG (SVG -> PNG) */
function exportCSV(filename, rows) {
  const csv = rows.map((r) => r.map((x) => `"${String(x ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

async function svgToPngAndDownload(svgEl, filename = "chart.png", scale = 2) {
  if (!svgEl) return;
  const xml = new XMLSerializer().serializeToString(svgEl);
  const svg64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  const { width, height } = svgEl.getBoundingClientRect();
  const w = Math.max(1, Math.floor(width * scale));
  const h = Math.max(1, Math.floor(height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  await new Promise((res, rej) => {
    img.onload = res; img.onerror = rej; img.src = svg64;
  });
  ctx.drawImage(img, 0, 0, w, h);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}

/* ------------------------------ Analytics ----------------------------- */
const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];
const COLORS = {
  primary: "#6366F1", // indigo-500
  green: "#10B981",   // emerald-500
  rose: "#E11D48",    // rose-600
  amber: "#F59E0B",   // amber-500
  slate: "#475569",   // slate-600
  sky: "#0EA5E9",
  violet: "#8B5CF6",
};

export default function AnalyticsPage() {
  const [apptsRaw, setApptsRaw] = useState(() => load(LS.APPTS, []));
  const [range, setRange] = useState("Month"); // Today | Week | Month | All | Custom
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [urgent, setUrgent] = useState("All"); // All | Urgent | Normal
  const [status, setStatus] = useState("All"); // All | STATUSES...
  const [view, setView] = useState("Charts");  // Charts | Tables
  const [refreshTick, setRefreshTick] = useState(0);
  const [openAI, setOpenAI] = useState(true);

  // chart refs for export
  const refLine = useRef(null);
  const refBar = useRef(null);
  const refPie = useRef(null);
  const refArea = useRef(null);
  const refRadar = useRef(null);

  /* Live reload from LS if other pages updated it */
  useEffect(() => {
    const onFocus = () => setApptsRaw(load(LS.APPTS, []));
    window.addEventListener("focus", onFocus);
    const iv = setInterval(onFocus, 4000);
    return () => { window.removeEventListener("focus", onFocus); clearInterval(iv); };
  }, []);

  /* Filters application */
  const filtered = useMemo(() => {
    let list = [...apptsRaw];
    if (urgent !== "All") list = list.filter((a) => !!a.urgent === (urgent === "Urgent"));
    if (status !== "All") list = list.filter((a) => a.status === status);
    const now = new Date();
    if (range === "Today") list = list.filter((a) => isSameDay(a.start, now));
    else if (range === "Week") list = list.filter((a) => withinDays(a.start, 7));
    else if (range === "Month") list = list.filter((a) => withinDays(a.start, 31));
    else if (range === "Custom" && from && to) {
      const f = new Date(from).getTime();
      const t = new Date(to).getTime();
      list = list.filter((a) => {
        const s = new Date(a.start).getTime();
        return s >= f && s <= t;
      });
    }
    return list.sort((a, b) => fmtDT(a.start) - fmtDT(b.start));
  }, [apptsRaw, urgent, status, range, from, to]);

  /* Aggregations */
  const derived = useMemo(() => {
    const list = filtered;
    const total = list.length;
    const uniquePatients = uniq(list.map((a) => a.patient || "Unknown")).length;
    const durations = list.map((a) => durMins(a.start, a.end));
    const avgDuration = Math.round((durations.reduce((s, v) => s + v, 0) / Math.max(1, durations.length)) || 0);

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    list.forEach((a) => { if (byStatus[a.status] !== undefined) byStatus[a.status] += 1; });
    const cancelRate = total ? Math.round((byStatus["Cancelled"] / total) * 100) : 0;
    const urgentCount = list.filter((a) => a.urgent).length;

    // occupancy (overlap intensity / capacity proxy)
    const byDaySlots = {};
    list.forEach((a) => {
      const d = dateISO(a.start);
      byDaySlots[d] ||= [];
      byDaySlots[d].push([fmtDT(a.start).getTime(), fmtDT(a.end).getTime()]);
    });
    const overlapsPerDay = Object.entries(byDaySlots).map(([d, ranges]) => {
      ranges.sort((x, y) => x[0] - y[0]);
      let maxOverlap = 0;
      const points = [];
      ranges.forEach(([s, e]) => { points.push([s, 1]); points.push([e, -1]); });
      points.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      let cur = 0;
      points.forEach(([, delta]) => { cur += delta; maxOverlap = Math.max(maxOverlap, cur); });
      return { d, maxOverlap };
    });
    const avgOverlap = Math.round(
      (overlapsPerDay.reduce((s, x) => s + x.maxOverlap, 0) / Math.max(1, overlapsPerDay.length)) * 100
    ) / 100;

    // daily series
    const byDate = {};
    list.forEach((a) => {
      const d = dateISO(a.start);
      byDate[d] ||= { value: 0, completed: 0, cancelled: 0, urgent: 0, mins: 0 };
      byDate[d].value += 1;
      if (a.status === "Completed") byDate[d].completed += 1;
      if (a.status === "Cancelled") byDate[d].cancelled += 1;
      if (a.urgent) byDate[d].urgent += 1;
      byDate[d].mins += durMins(a.start, a.end);
    });
    const daysSorted = Object.keys(byDate).sort();
    const dailySeries = daysSorted.map((d) => ({
      date: d,
      value: byDate[d].value,
      completed: byDate[d].completed,
      cancelled: byDate[d].cancelled,
      urgent: byDate[d].urgent,
      avgMins: Math.round(byDate[d].mins / Math.max(1, byDate[d].value)),
    }));

    // hour density
    const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, "0")}:00`, count: 0 }));
    list.forEach((a) => { byHour[fmtDT(a.start).getHours()].count += 1; });

    // repeats (patient return rate)
    const byPatient = {};
    list.forEach((a) => { const p = a.patient || "Unknown"; byPatient[p] = (byPatient[p] || 0) + 1; });
    const repeaters = Object.entries(byPatient).filter(([, c]) => c >= 2).length;
    const repeatRate = total ? Math.round((repeaters / uniq(list.map(a => a.patient || "Unknown")).length) * 100) : 0;

    // location / department load (using 'location' as proxy)
    const byLocation = {};
    list.forEach((a) => { const l = a.location || "—"; byLocation[l] = (byLocation[l] || 0) + 1; });
    const topLocations = Object.entries(byLocation).map(([k, v]) => ({ name: k, value: v }))
      .sort((a, b) => b.value - a.value).slice(0, 5);

    // forecasting next 7 from daily history
    const forecast = forecastNext(dailySeries, 7);
    const forecastSeries = forecast.map((v, i) => ({
      date: dateISO(addDays(daysSorted.length ? new Date(daysSorted[daysSorted.length - 1]) : new Date(), i + 1)),
      value: v,
    }));

    // trend last 7 vs previous 7
    const last7 = dailySeries.slice(-7).reduce((s, d) => s + d.value, 0);
    const prev7 = dailySeries.slice(-14, -7).reduce((s, d) => s + d.value, 0);
    const trendPct = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : (last7 ? 100 : 0);

    return {
      total,
      uniquePatients,
      avgDuration,
      byStatus,
      cancelRate,
      urgentCount,
      avgOverlap,
      dailySeries,
      byHour,
      repeatRate,
      topLocations,
      forecastSeries,
      trendPct,
    };
  }, [filtered, refreshTick]);

  /* AI-like Insights */
  const aiInsights = useMemo(() => {
    const d = derived;
    if (!filtered.length) return ["No data in current filter. Adjust date range or import appointments."];
    const tips = [];
    // Trend
    tips.push(d.trendPct > 0
      ? `Appointments rose ${d.trendPct}% vs previous period. Prepare staffing and room allocation accordingly.`
      : d.trendPct < 0
      ? `Appointments dipped ${Math.abs(d.trendPct)}% vs previous period. Consider patient engagement reminders.`
      : `Stable load compared to previous period.`);
    // Urgent
    const urgentPct = Math.round((d.urgentCount / Math.max(1, derived.total)) * 100);
    if (urgentPct >= 25) tips.push(`High urgent share (${urgentPct}%). Reserve slots for triage and buffer overruns.`);
    // Cancellations
    if (derived.cancelRate >= 15) tips.push(`Elevated cancellations (${derived.cancelRate}%). Send automated confirmations + waitlist fill.`);
    // Overlap
    if (derived.avgOverlap >= 2) tips.push(`Average concurrent load ~${derived.avgOverlap} appointments. Risk of bottlenecks; stagger check-ins.`);
    // Hours
    const peakHour = derived.byHour.reduce((a, b) => (b.count > a.count ? b : a), { hour: "00:00", count: 0 });
    if (peakHour.count >= 2) tips.push(`Peak hour around ${peakHour.hour}. Offer extended slots or extra staff then.`);
    // Repeat rate
    if (derived.repeatRate >= 35) tips.push(`Strong repeat patient rate (${derived.repeatRate}%). Consider loyalty/continuity programs.`);
    else tips.push(`Repeat patient rate at ${derived.repeatRate}%. Offer follow-up reminders to improve continuity.`);
    // Locations
    if (derived.topLocations[0]) tips.push(`Top load at ${derived.topLocations[0].name}. Balance room allocation to reduce wait times.`);
    return tips;
  }, [derived, filtered.length]);

  /* KPI Sparkline data (last up to 14 days) */
  const sparkData = useMemo(() => {
    const s = derived.dailySeries.slice(-14);
    return s.map((d, i) => ({ x: i + 1, y: d.value }));
  }, [derived.dailySeries]);

  /* Table rows for export */
  const tableRows = useMemo(() => {
    const rows = derived.dailySeries.map((d) => [
      d.date,
      d.value,
      d.completed,
      d.cancelled,
      `${Math.round((d.completed / Math.max(1, d.value)) * 100)}%`,
      d.urgent,
      `${d.avgMins} min`,
    ]);
    return [["Date", "Appointments", "Completed", "Cancelled", "Completion %", "Urgent", "Avg Duration"], ...rows];
  }, [derived.dailySeries]);

  const exportAllCSVs = () => {
    exportCSV(`analytics_daily_${new Date().toISOString().slice(0,10)}.csv`, tableRows);
  };

  const exportChartsPNG = async () => {
    const svgs = Array.from(document.querySelectorAll("#analytics svg"));
    let i = 1;
    for (const svg of svgs) {
      await svgToPngAndDownload(svg, `analytics_chart_${i++}.png`, 2);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur shadow flex items-center justify-between px-3 sm:px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <h1 className="text-lg sm:text-xl font-bold">Analytics</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRefreshTick((x) => x + 1)}
            className="px-3 py-2 rounded-lg border bg-white flex items-center gap-2"
            title="Refresh data from localStorage"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={exportAllCSVs}
            className="px-3 py-2 rounded-lg bg-slate-900 text-white flex items-center gap-2"
            title="Export tables CSV"
          >
            <Download className="w-4 h-4" /> CSV
          </button>
          <button
            onClick={exportChartsPNG}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white flex items-center gap-2"
            title="Export all charts as PNG"
          >
            <Download className="w-4 h-4" /> Charts PNG
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
        <div className="bg-white rounded-xl border shadow p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="font-medium">Filters</div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select className="p-2 rounded-lg border" value={range} onChange={(e) => setRange(e.target.value)}>
              {["Today", "Week", "Month", "All", "Custom"].map((x) => <option key={x}>{x}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Urgency</span>
              <select className="p-2 rounded-lg border flex-1" value={urgent} onChange={(e) => setUrgent(e.target.value)}>
                {["All", "Urgent", "Normal"].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">Status</span>
              <select className="p-2 rounded-lg border flex-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                {["All", ...STATUSES].map((x) => <option key={x}>{x}</option>)}
              </select>
            </div>
            {range === "Custom" && (
              <>
                <input type="date" className="p-2 rounded-lg border" value={from} onChange={(e) => setFrom(e.target.value)} />
                <input type="date" className="p-2 rounded-lg border" value={to} onChange={(e) => setTo(e.target.value)} />
              </>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              className={`px-3 py-1.5 rounded-full text-sm border ${view === "Charts" ? "bg-indigo-600 text-white border-indigo-600" : ""}`}
              onClick={() => setView("Charts")}
            >
              Charts
            </button>
            <button
              className={`px-3 py-1.5 rounded-full text-sm border ${view === "Tables" ? "bg-gray-900 text-white border-gray-900" : ""}`}
              onClick={() => setView("Tables")}
            >
              Tables
            </button>
            <button
              className={`ml-auto px-3 py-1.5 rounded-full text-sm border ${openAI ? "bg-emerald-600 text-white border-emerald-600" : ""}`}
              onClick={() => setOpenAI((s) => !s)}
              title="Toggle AI insights"
            >
              AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <KPI icon={<Database className="w-4 h-4" />} label="Appointments" value={derived.total} trend={derived.trendPct} spark={sparkData} />
          <KPI icon={<Users className="w-4 h-4" />} label="Unique Patients" value={derived.uniquePatients} spark={sparkData} />
          <KPI icon={<Clock className="w-4 h-4" />} label="Avg. Duration" value={`${derived.avgDuration}m`} spark={sparkData} />
          <KPI icon={<Percent className="w-4 h-4" />} label="Cancellation %" value={`${derived.cancelRate}%`} spark={sparkData} />
          <KPI icon={<Activity className="w-4 h-4" />} label="Urgent Count" value={derived.urgentCount} spark={sparkData} />
          <KPI icon={<TrendingUp className="w-4 h-4" />} label="Avg. Overlap" value={derived.avgOverlap} spark={sparkData} />
        </div>
      </div>

      {/* AI Insights */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3">
        <AnimatePresence>
          {openAI && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/60 rounded-xl p-3 sm:p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-emerald-700" />
                <div className="font-semibold">AI Insights</div>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {aiInsights.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main visualizations */}
      <div id="analytics" className="max-w-7xl mx-auto px-3 sm:px-4 pb-6">
        {view === "Charts" ? (
          <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
            <Card title="Appointments Over Time" icon={<LineIcon className="w-4 h-4" />} desc="Daily totals with completion/cancellation" actions={<ChartActions refEl={refLine} />}>
              <div ref={refLine} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={derived.dailySeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={2} dot={false} name="Total" />
                    <Line type="monotone" dataKey="completed" stroke={COLORS.green} strokeWidth={2} dot={false} name="Completed" />
                    <Line type="monotone" dataKey="cancelled" stroke={COLORS.rose} strokeWidth={2} dot={false} name="Cancelled" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Next 7 Days Forecast" icon={<Target className="w-4 h-4" />} desc="Linear regression on history" actions={<ChartActions refEl={refArea} />}>
              <div ref={refArea} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={derived.forecastSeries}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.sky} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.sky} stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke={COLORS.sky} fill="url(#grad)" name="Forecast"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Status Distribution" icon={<PieIcon className="w-4 h-4" />} desc="Share of each status" actions={<ChartActions refEl={refPie} />}>
              <div ref={refPie} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip />
                    <Legend />
                    <Pie
                      data={Object.entries(derived.byStatus).map(([name, value]) => ({ name, value }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                    >
                      {Object.entries(derived.byStatus).map(([s], i) => (
                        <Cell key={s} fill={[COLORS.amber, COLORS.primary, COLORS.green, COLORS.rose][i % 4]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Hourly Density" icon={<Clock className="w-4 h-4" />} desc="Appointments by start hour" actions={<ChartActions refEl={refBar} />}>
              <div ref={refBar} className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.byHour}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" interval={2} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.violet} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Top Locations / OPDs" icon={<CalendarIcon className="w-4 h-4" />} desc="Load by room/OPD" >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={derived.topLocations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.slate} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Repeat Patient Rate" icon={<Users className="w-4 h-4" />} desc="Retention indicator" >
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={[
                    { name: "Repeat Rate", value: clip(derived.repeatRate, 0, 100) },
                    { name: "Cancel %", value: clip(derived.cancelRate, 0, 100) },
                    { name: "Urgent %", value: clip(Math.round((derived.urgentCount / Math.max(1, derived.total)) * 100), 0, 100) },
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar dataKey="value" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <Card title="Daily Summary" icon={<LineIcon className="w-4 h-4" />} desc="Aggregated metrics by day">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2">Date</th>
                      <th>Appointments</th>
                      <th>Completed</th>
                      <th>Cancelled</th>
                      <th>Completion %</th>
                      <th>Urgent</th>
                      <th>Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derived.dailySeries.map((d) => (
                      <tr key={d.date} className="border-b last:border-none">
                        <td className="py-2">{d.date}</td>
                        <td>{d.value}</td>
                        <td>{d.completed}</td>
                        <td>{d.cancelled}</td>
                        <td>{Math.round((d.completed / Math.max(1, d.value)) * 100)}%</td>
                        <td>{d.urgent}</td>
                        <td>{d.avgMins} min</td>
                      </tr>
                    ))}
                    {derived.dailySeries.length === 0 && (
                      <tr><td colSpan={7} className="py-6 text-center opacity-60">No rows</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={exportAllCSVs}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Sticky mobile bar */}
      <div className="sm:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="bg-white border shadow-lg rounded-2xl flex items-center justify-between px-3 py-2">
          <button onClick={() => setView("Charts")} className={`px-3 py-2 rounded-xl ${view==="Charts" ? "bg-indigo-600 text-white" : "bg-white border"}`}>Charts</button>
          <button onClick={() => setView("Tables")} className={`px-3 py-2 rounded-xl ${view==="Tables" ? "bg-gray-900 text-white" : "bg-white border"}`}>Tables</button>
          <button onClick={exportChartsPNG} className="px-3 py-2 rounded-xl bg-indigo-600 text-white flex items-center gap-1">
            <Download className="w-4 h-4"/>PNG
          </button>
        </div>
      </div>

      {/* Print styles */}
      <style>{`@media print {
        header, .fixed, .sticky { display:none !important; }
        body { background:white; }
        .shadow { box-shadow:none !important; }
      }`}</style>
    </div>
  );
}

/* ---------------------------- Reusable Pieces --------------------------- */
function Card({ title, icon, desc, children, actions }) {
  return (
    <div className="bg-white rounded-xl border shadow p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0">{icon}</span>
          <div>
            <div className="font-semibold">{title}</div>
            {desc && <div className="text-xs opacity-60">{desc}</div>}
          </div>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function ChartActions({ refEl }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          const el = refEl?.current?.querySelector?.("svg") || refEl?.current;
          svgToPngAndDownload(el, "chart.png", 2);
        }}
        className="px-2 py-1 text-xs rounded-lg border bg-white"
        title="Download chart as PNG"
      >
        <Download className="w-3 h-3 inline-block mr-1" /> PNG
      </button>
    </div>
  );
}

function KPI({ icon, label, value, trend, spark }) {
  return (
    <div className="bg-white rounded-xl border shadow p-3">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">{icon}</div>
        <div className="text-xs opacity-60">{label}</div>
      </div>
      <div className="mt-1 flex items-end justify-between">
        <div className="text-xl sm:text-2xl font-bold">{value}</div>
        <Sparkline data={spark} />
      </div>
      {typeof trend === "number" && (
        <div className={`mt-1 text-xs ${trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-slate-500"}`}>
          {trend > 0 ? "▲" : trend < 0 ? "▼" : "■"} {Math.abs(trend)}% vs prev
        </div>
      )}
    </div>
  );
}

function Sparkline({ data = [] }) {
  // tiny svg sparkline
  const w = 80, h = 28, pad = 3;
  const ys = data.map((d) => d.y);
  const min = Math.min(0, ...ys);
  const max = Math.max(1, ...ys);
  const range = max - min || 1;
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (d.y - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h}>
      <polyline points={pts} fill="none" stroke={COLORS.primary} strokeWidth="2" />
    </svg>
  );
}
