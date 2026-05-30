import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const readings = await prisma.airQualityReading.findMany({
      where: {
        recordedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      select: {
        aqi: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: "asc" },
    });

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

    return NextResponse.json({ success: true, chartData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}