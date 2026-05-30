import axios from "axios";
import { prisma } from "@/lib/prisma";

const CPCB_API_URL = "https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

interface CPCBRecord {
  station: string;
  city: string;
  latitude: string;
  longitude: string;
  pollutant_id: string;
  avg_value: string;
  last_update: string;
}

export async function fetchAndStoreAirQuality() {
  console.log("Fetching air quality data...");

  try {
    const response = await axios.get(CPCB_API_URL, {
      params: {
        "api-key": process.env.CPCB_API_KEY,
        format: "json",
        "filters[city]": "Patna",
        limit: 100,
      },
    });

    const records: CPCBRecord[] = response.data.records;

    if (!records || records.length === 0) {
      throw new Error("No records returned from CPCB API");
    }

    console.log(`Got ${records.length} records from CPCB`);

    // Group by station
    const stationMap = new Map<string, any>();

    for (const record of records) {
      const key = record.station;
      if (!stationMap.has(key)) {
        stationMap.set(key, {
          lat: parseFloat(record.latitude) || 25.5941,
          lon: parseFloat(record.longitude) || 85.1376,
        });
      }

      const entry = stationMap.get(key);
      const value = parseFloat(record.avg_value);
      if (isNaN(value)) continue;

      switch (record.pollutant_id.toUpperCase()) {
        case "PM2.5": entry.pm25 = value; break;
        case "PM10":  entry.pm10 = value; break;
        case "NO2":   entry.no2  = value; break;
        case "SO2":   entry.so2  = value; break;
        case "CO":    entry.co   = value; break;
        case "OZONE": entry.ozone = value; break;
      }
    }

    // Calculate simple AQI from PM2.5 if available, else PM10
    for (const [, data] of stationMap.entries()) {
      if (data.pm25) {
        data.aqi = calculateAQI(data.pm25);
      } else if (data.pm10) {
        data.aqi = Math.round(data.pm10 * 1.5);
      }
    }

    // Save to database
    for (const [stationName, data] of stationMap.entries()) {
      const station = await prisma.station.upsert({
        where: { stationCode: stationName },
        update: { isActive: true },
        create: {
          name: stationName,
          stationCode: stationName,
          latitude: data.lat,
          longitude: data.lon,
        },
      });

      await prisma.airQualityReading.create({
        data: {
          stationId: station.id,
          pm25: data.pm25 ?? null,
          pm10: data.pm10 ?? null,
          no2:  data.no2  ?? null,
          so2:  data.so2  ?? null,
          co:   data.co   ?? null,
          aqi:  data.aqi  ?? null,
          recordedAt: new Date(),
        },
      });

      console.log(`✓ ${stationName} — PM10: ${data.pm10}, PM2.5: ${data.pm25}, AQI: ${data.aqi}`);
    }

    await prisma.scraperLog.create({
      data: {
        source: "CPCB_AQI",
        status: "success",
        message: `Stored ${stationMap.size} stations`,
      },
    });

  } catch (error: any) {
    console.error("Error:", error.message);
    await prisma.scraperLog.create({
      data: {
        source: "CPCB_AQI",
        status: "error",
        message: error.message,
      },
    });
  }
}

// Simple AQI calculation from PM2.5
function calculateAQI(pm25: number): number {
  if (pm25 <= 12)   return Math.round((50 / 12) * pm25);
  if (pm25 <= 35.4) return Math.round(50 + ((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1));
  if (pm25 <= 55.4) return Math.round(100 + ((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5));
  if (pm25 <= 150.4) return Math.round(150 + ((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5));
  if (pm25 <= 250.4) return Math.round(200 + ((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5));
  return Math.round(300 + ((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5));
}