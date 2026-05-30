import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const reportSchema = z.object({
  area: z.string().min(1),
  ward: z.string().optional(),
  issueType: z.string().min(1),
  description: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = reportSchema.parse(body);

    const report = await prisma.waterReport.create({
      data: {
        area: data.area,
        ward: data.ward,
        issueType: data.issueType,
        description: data.description,
      },
    });

    return NextResponse.json({ success: true, id: report.id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const reports = await prisma.waterReport.findMany({
      orderBy: { reportedAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}