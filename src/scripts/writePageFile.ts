import fs from "fs";

const content = `"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  aqiLevel: string;
  recordedAt: string | null;
}

interface ChartPoint {
  time: string;
  aqi: number;
}

export default function Home() {
  const [stations, setStations] = useState<Station[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [email, setEmail] = useState("");
  const [ward, setWard] = useState("");
  const [aqiThreshold, setAqiThreshold] = useState(150);
  const [alertOnPower, setAlertOnPower] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [waterArea, setWaterArea] = useState("");
  const [waterIssue, setWaterIssue] = useState("");
  const [waterDesc, setWaterDesc] = useState("");
  const [waterSubmitting, setWaterSubmitting] = useState(false);
  const [waterMsg, setWaterMsg] = useState("");
  const [recentWaterReports, setRecentWaterReports] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/air-quality").then((r) => r.json()),
      fetch("/api/air-quality/history").then((r) => r.json()),
      fetch("/api/water-report").then((r) => r.json()),
    ]).then(([aqData, histData, waterData]) => {
      setStations(aqData.data);
      setChartData(histData.chartData || []);
      setRecentWaterReports(waterData.data || []);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
      setLoading(false);
    });
  }, []);

  const avgAQI = stations.length
    ? Math.round(stations.reduce((s, st) => s + (st.aqi ?? 0), 0) / stations.length)
    : null;

  const getAQIColor = (level: string) => {
    switch (level) {
      case "good": return "bg-green-500";
      case "moderate": return "bg-yellow-400";
      case "unhealthy-sensitive": return "bg-orange-400";
      case "unhealthy": return "bg-red-500";
      case "very-unhealthy": return "bg-purple-600";
      case "hazardous": return "bg-rose-900";
      default: return "bg-gray-400";
    }
  };

  const getAQILabel = (level: string) => {
    switch (level) {
      case "good": return "Good";
      case "moderate": return "Moderate";
      case "unhealthy-sensitive": return "Unhealthy (Sensitive)";
      case "unhealthy": return "Unhealthy";
      case "very-unhealthy": return "Very Unhealthy";
      case "hazardous": return "Hazardous";
      default: return "Unknown";
    }
  };

  const handleSubscribe = async () => {
    if (!email || !ward) { setSubmitMsg("Please enter your email and area."); return; }
    setSubmitting(true); setSubmitMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ward, alertOnAqi: true, aqiThreshold, alertOnPower }),
      });
      const data = await res.json();
      if (data.success) { setSubmitMsg("✓ Subscribed! You will get alerts when AQI crosses " + aqiThreshold + "."); setEmail(""); setWard(""); }
      else setSubmitMsg("Something went wrong. Try again.");
    } catch { setSubmitMsg("Network error. Try again."); }
    setSubmitting(false);
  };

  const handleWaterReport = async () => {
    if (!waterArea || !waterIssue) { setWaterMsg("Please fill in area and issue type."); return; }
    setWaterSubmitting(true); setWaterMsg("");
    try {
      const res = await fetch("/api/water-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ area: waterArea, issueType: waterIssue, description: waterDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setWaterMsg("✓ Report submitted! Thank you for helping your community.");
        setWaterArea(""); setWaterIssue(""); setWaterDesc("");
        fetch("/api/water-report").then((r) => r.json()).then((d) => setRecentWaterReports(d.data || []));
      } else setWaterMsg("Something went wrong. Try again.");
    } catch { setWaterMsg("Network error. Try again."); }
    setWaterSubmitting(false);
  };

  const PATNA_WARDS = [
    "Kankarbagh", "Rajendra Nagar", "Boring Road", "Patliputra Colony",
    "Danapur", "Khagaul", "Phulwari Sharif", "Mithapur", "Gardanibagh",
    "Ashok Rajpath", "Fraser Road", "Exhibition Road", "Bankipore",
    "Digha", "Samanpura", "Muradpur", "Rajbansi Nagar", "Other"
  ];

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">LocalPulse</h1>
            <p className="text-gray-400 text-sm">Real-time civic dashboard · Patna, Bihar</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Last updated</p>
            <p className="text-white text-sm font-medium">{lastUpdated || "Loading..."}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Avg AQI · Patna</p>
            <p className="text-3xl font-bold text-white">{avgAQI ?? "--"}</p>
            <p className="text-sm mt-1 text-gray-300">
              {stations[0] ? getAQILabel(stations.reduce((worst, s) => {
                const levels = ["good","moderate","unhealthy-sensitive","unhealthy","very-unhealthy","hazardous"];
                return levels.indexOf(s.aqiLevel) > levels.indexOf(worst) ? s.aqiLevel : worst;
              }, "good")) : "Loading..."}
            </p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Stations Active</p>
            <p className="text-3xl font-bold text-white">{stations.length}</p>
            <p className="text-sm mt-1 text-gray-300">Monitoring sites</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Power Outages</p>
            <p className="text-3xl font-bold text-green-400">0</p>
            <p className="text-sm mt-1 text-gray-300">No active cuts</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Data Source</p>
            <p className="text-lg font-bold text-white">CPCB</p>
            <p className="text-sm mt-1 text-gray-300">Govt. of India</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-medium text-gray-300">Air Quality Map · Patna</h2>
            </div>
            <div className="h-[420px]">
              {loading ? (
                <div className="h-full flex items-center justify-center text-gray-400">Loading map...</div>
              ) : (
                <Map stations={stations} />
              )}
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-medium text-gray-300">Station Readings</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {stations.map((station) => (
                <div key={station.id} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white text-sm font-medium truncate pr-2">{station.name.split(",")[0]}</p>
                    <span className="text-white font-bold text-lg">{station.aqi ?? "--"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs">PM2.5: {station.pm25 ?? "--"} · PM10: {station.pm10 ?? "--"}</p>
                    <span className={\`text-xs px-2 py-0.5 rounded-full text-white \${getAQIColor(station.aqiLevel)}\`}>
                      {getAQILabel(station.aqiLevel)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h2 className="text-sm font-medium text-gray-300 mb-4">AQI Trend · Last 24 Hours</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} domain={[0, 300]} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} labelStyle={{ color: "#fff" }} itemStyle={{ color: "#f87171" }} />
                <Line type="monotone" dataKey="aqi" stroke="#f87171" strokeWidth={2} dot={{ fill: "#f87171", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-500 text-sm">
              Not enough data yet — chart will populate as readings accumulate over time.
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-white font-semibold text-base mb-1">Get Alerts</h2>
          <p className="text-gray-400 text-sm mb-4">Get notified when AQI crosses your threshold or a power cut is scheduled in your area.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Your area / ward</label>
              <select value={ward} onChange={(e) => setWard(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                <option value="">Select your area</option>
                {PATNA_WARDS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-xs block mb-1">Alert when AQI crosses: <span className="text-white font-medium">{aqiThreshold}</span></label>
              <input type="range" min={50} max={300} step={25} value={aqiThreshold} onChange={(e) => setAqiThreshold(Number(e.target.value))} className="w-full accent-red-500" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>50 (Good)</span><span>150 (Unhealthy)</span><span>300 (Hazardous)</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <input type="checkbox" id="powerAlert" checked={alertOnPower} onChange={(e) => setAlertOnPower(e.target.checked)} className="accent-blue-500" />
              <label htmlFor="powerAlert" className="text-gray-300 text-sm">Also alert me for power outages in my area</label>
            </div>
          </div>
          <button onClick={handleSubscribe} disabled={submitting}
            className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
            {submitting ? "Subscribing..." : "Subscribe to Alerts"}
          </button>
          {submitMsg && <p className={\`mt-3 text-sm \${submitMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}\`}>{submitMsg}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-white font-semibold text-base mb-1">Report Water Issue</h2>
            <p className="text-gray-400 text-sm mb-4">No API exists for water supply in Patna — help your community by reporting issues directly.</p>
            <div className="space-y-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">Your area</label>
                <input type="text" value={waterArea} onChange={(e) => setWaterArea(e.target.value)} placeholder="e.g. Kankarbagh, Boring Road..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Issue type</label>
                <select value={waterIssue} onChange={(e) => setWaterIssue(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500">
                  <option value="">Select issue</option>
                  <option value="No water supply">No water supply</option>
                  <option value="Low pressure">Low pressure</option>
                  <option value="Contaminated water">Contaminated water</option>
                  <option value="Pipe leakage">Pipe leakage</option>
                  <option value="Irregular supply">Irregular supply</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">Description (optional)</label>
                <textarea value={waterDesc} onChange={(e) => setWaterDesc(e.target.value)} placeholder="Any additional details..." rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none" />
              </div>
              <button onClick={handleWaterReport} disabled={waterSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {waterSubmitting ? "Submitting..." : "Submit Report"}
              </button>
              {waterMsg && <p className={\`text-sm \${waterMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}\`}>{waterMsg}</p>}
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800">
            <div className="px-4 py-3 border-b border-gray-800">
              <h2 className="text-sm font-medium text-gray-300">Recent Water Reports · Community</h2>
            </div>
            {recentWaterReports.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm">No reports yet. Be the first to report an issue in your area.</div>
            ) : (
              <div className="divide-y divide-gray-800">
                {recentWaterReports.map((report) => (
                  <div key={report.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white text-sm font-medium">{report.area}</p>
                      <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">{report.issueType}</span>
                    </div>
                    {report.description && <p className="text-gray-400 text-xs">{report.description}</p>}
                    <p className="text-gray-500 text-xs mt-1">{new Date(report.reportedAt).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}`;

fs.writeFileSync("src/app/page.tsx", content, "utf8");
console.log("✓ page.tsx written successfully!");
console.log("File size:", content.length, "chars");