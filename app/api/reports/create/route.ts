export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, severity, description, busNumber, routeId, stopId } = body;

    if (!type || !description) {
      return NextResponse.json(
        { error: "type and description required" },
        { status: 400 }
      );
    }

    const report = await prisma.report.create({
      data: {
        type,
        severity: severity || "MEDIUM",
        description,
        busNumber: busNumber || null,
        routeId:   routeId  ? parseInt(routeId)  : null,
        stopId:    stopId   ? parseInt(stopId)   : null,
        status:    "OPEN",
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
