"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

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

export default function Home() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    fetch("/api/air-quality")
      .then((res) => res.json())
      .then((data) => {
        setStations(data.data);
        setLastUpdated(new Date().toLocaleTimeString("en-IN"));
        setLoading(false);
      });
  }, []);

  const avgAQI = stations.length
    ? Math.round(stations.reduce((sum, s) => sum + (s.aqi ?? 0), 0) / stations.length)
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

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
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

      {/* Status Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Avg AQI · Patna</p>
            <p className="text-3xl font-bold text-white">{avgAQI ?? "--"}</p>
            <p className="text-sm mt-1 text-gray-300">
              {stations[0] ? getAQILabel(
                stations.reduce((worst, s) => {
                  const levels = ["good","moderate","unhealthy-sensitive","unhealthy","very-unhealthy","hazardous"];
                  return levels.indexOf(s.aqiLevel) > levels.indexOf(worst) ? s.aqiLevel : worst;
                }, "good")
              ) : "Loading..."}
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

        {/* Map */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Air Quality Map · Patna</h2>
          </div>
          <div className="h-[500px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                Loading map data...
              </div>
            ) : (
              <Map stations={stations} />
            )}
          </div>
        </div>

        {/* Station List */}
        <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Station Readings</h2>
          </div>
          <div className="divide-y divide-gray-800">
            {stations.map((station) => (
              <div key={station.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{station.name.split(",")[0]}</p>
                  <p className="text-gray-400 text-xs">PM2.5: {station.pm25 ?? "--"} · PM10: {station.pm10 ?? "--"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold">{station.aqi ?? "--"}</span>
                  <span className={`text-xs px-2 py-1 rounded-full text-white ${getAQIColor(station.aqiLevel)}`}>
                    {getAQILabel(station.aqiLevel)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}