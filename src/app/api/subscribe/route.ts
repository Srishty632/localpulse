import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
  email: z.string().email(),
  ward: z.string().min(1),
  alertOnAqi: z.boolean().default(true),
  aqiThreshold: z.number().min(50).max(300).default(150),
  alertOnPower: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = subscribeSchema.parse(body);

    const subscription = await prisma.alertSubscription.upsert({
      where: {
        email_ward: {
          email: data.email,
          ward: data.ward,
        },
      },
      update: {
        alertOnAqi: data.alertOnAqi,
        aqiThreshold: data.aqiThreshold,
        alertOnPower: data.alertOnPower,
        isActive: true,
      },
      create: {
        email: data.email,
        ward: data.ward,
        alertOnAqi: data.alertOnAqi,
        aqiThreshold: data.aqiThreshold,
        alertOnPower: data.alertOnPower,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscribed successfully!",
      id: subscription.id,
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}