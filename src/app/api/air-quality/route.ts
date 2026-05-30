import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get latest reading per station
    const stations = await prisma.station.findMany({
      where: { isActive: true },
      include: {
        readings: {
          orderBy: { recordedAt: "desc" },
          take: 1,
        },
      },
    });

    const data = stations.map((station: any) => {
      const latest = station.readings[0];
      return {
        id: station.id,
        name: station.name,
        latitude: station.latitude,
        longitude: station.longitude,
        aqi: latest?.aqi ?? null,
        pm25: latest?.pm25 ?? null,
        pm10: latest?.pm10 ?? null,
        no2: latest?.no2 ?? null,
        so2: latest?.so2 ?? null,
        recordedAt: latest?.recordedAt ?? null,
        aqiLevel: getAQILevel(latest?.aqi ?? null),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function getAQILevel(aqi: number | null): string {
  if (aqi === null) return "unknown";
  if (aqi <= 50)  return "good";
  if (aqi <= 100) return "moderate";
  if (aqi <= 150) return "unhealthy-sensitive";
  if (aqi <= 200) return "unhealthy";
  if (aqi <= 300) return "very-unhealthy";
  return "hazardous";
}