import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    const outages = await prisma.powerOutage.findMany({
      where: {
        isActive: true,
        endTime: { gte: now },
      },
      orderBy: { startTime: "asc" },
      take: 50,
    });

    return NextResponse.json({ success: true, data: outages });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}