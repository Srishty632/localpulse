"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

interface MapProps {
  stations: Station[];
}

const getMarkerColor = (level: string): string => {
  switch (level) {
    case "good": return "#22c55e";
    case "moderate": return "#facc15";
    case "unhealthy-sensitive": return "#fb923c";
    case "unhealthy": return "#ef4444";
    case "very-unhealthy": return "#9333ea";
    case "hazardous": return "#881337";
    default: return "#6b7280";
  }
};

const getAQILabel = (level: string): string => {
  switch (level) {
    case "good": return "Good";
    case "moderate": return "Moderate";
    case "unhealthy-sensitive": return "Unhealthy (Sensitive Groups)";
    case "unhealthy": return "Unhealthy";
    case "very-unhealthy": return "Very Unhealthy";
    case "hazardous": return "Hazardous";
    default: return "Unknown";
  }
};

export default function Map({ stations }: MapProps) {
  useEffect(() => {
    // Fix Leaflet icon issue in Next.js
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "/leaflet/marker-icon-2x.png",
      iconUrl: "/leaflet/marker-icon.png",
      shadowUrl: "/leaflet/marker-shadow.png",
    });
  }, []);

  return (
    <MapContainer
      center={[25.5941, 85.1376]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stations.map((station) => (
        <CircleMarker
          key={station.id}
          center={[station.latitude, station.longitude]}
          radius={20}
          fillColor={getMarkerColor(station.aqiLevel)}
          color={getMarkerColor(station.aqiLevel)}
          weight={2}
          opacity={0.9}
          fillOpacity={0.7}
        >
          <Popup>
            <div style={{ minWidth: "180px" }}>
              <p style={{ fontWeight: "bold", marginBottom: "6px", fontSize: "13px" }}>
                {station.name.split(",")[0]}
              </p>
              <p style={{ color: getMarkerColor(station.aqiLevel), fontWeight: "bold", fontSize: "16px" }}>
                AQI: {station.aqi ?? "--"}
              </p>
              <p style={{ fontSize: "12px", color: "#555" }}>
                {getAQILabel(station.aqiLevel)}
              </p>
              <hr style={{ margin: "6px 0" }} />
              <p style={{ fontSize: "12px" }}>PM2.5: <b>{station.pm25 ?? "--"}</b> µg/m³</p>
              <p style={{ fontSize: "12px" }}>PM10: <b>{station.pm10 ?? "--"}</b> µg/m³</p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}