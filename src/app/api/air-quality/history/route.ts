import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get readings from last 24 hours grouped by hour
    const readings = await prisma.airQualityReading.findMany({
      where: {
        recordedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: { station: true },
      orderBy: { recordedAt: "asc" },
    });

    // Group by hour and calculate avg AQI
    const hourMap = new Map<string, number[]>();

    for (const reading of readings) {
      const hour = new Date(reading.recordedAt);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      if (!hourMap.has(key)) hourMap.set(key, []);
      if (reading.aqi !== null) hourMap.get(key)!.push(reading.aqi);
    }

    const chartData = Array.from(hourMap.entries()).map(([time, aqis]) => ({
      time: new Date(time).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      aqi: Math.round(aqis.reduce((a, b) => a + b, 0) / aqis.length),
    }));

    // Also return per-station latest
    const stationData = await prisma.station.findMany({
      where: { isActive: true },
      include: {
        readings: {
          orderBy: { recordedAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json({ success: true, chartData, stationData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}