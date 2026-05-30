import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [airQualityCount, outageCount, recentLogs] = await Promise.all([
      prisma.airQualityReading.count(),
      prisma.powerOutage.count(),
      prisma.scraperLog.findMany({
        orderBy: { runAt: "desc" },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      success: true,
      status: "healthy",
      data: {
        airQualityReadings: airQualityCount,
        powerOutages: outageCount,
        recentLogs,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, status: "unhealthy", error: error.message },
      { status: 500 }
    );
  }
}