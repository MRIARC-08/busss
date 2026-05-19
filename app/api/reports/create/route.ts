export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const REPORT_TYPES = new Set([
  "LATE_BUS",
  "OVERCROWDING",
  "CLEANLINESS",
  "UNSAFE_BEHAVIOR",
  "FARE_ISSUE",
  "VEHICLE_PROBLEM",
  "BREAKDOWN",
  "DRIVER_BEHAVIOR",
  "AC_ISSUE",
  "ROUTE_ISSUE",
  "OTHER",
]);
const SEVERITIES = new Set(["LOW", "MEDIUM", "HIGH", "EMERGENCY", "CRITICAL"]);

export async function POST(request: NextRequest) {
  try {
    const rate = checkRateLimit(`report:${getClientIp(request)}`, 10, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many reports. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const { type, severity, description, busNumber, routeId, stopId } = body;

    if (typeof type !== "string" || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "type and description required" },
        { status: 400 }
      );
    }
    if (!REPORT_TYPES.has(type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 422 });
    }
    const normalizedSeverity = typeof severity === "string" && severity ? severity : "MEDIUM";
    if (!SEVERITIES.has(normalizedSeverity)) {
      return NextResponse.json({ error: "Invalid severity" }, { status: 422 });
    }
    const parsedRouteId = routeId ? Number(routeId) : null;
    const parsedStopId = stopId ? Number(stopId) : null;
    if ((parsedRouteId !== null && !Number.isInteger(parsedRouteId)) || (parsedStopId !== null && !Number.isInteger(parsedStopId))) {
      return NextResponse.json({ error: "Invalid route or stop id" }, { status: 422 });
    }

    const report = await prisma.report.create({
      data: {
        type,
        severity: normalizedSeverity,
        description: description.trim().slice(0, 1000),
        busNumber: typeof busNumber === "string" && busNumber.trim() ? busNumber.trim().slice(0, 40) : null,
        routeId:   parsedRouteId,
        stopId:    parsedStopId,
        status:    "OPEN",
      },
    });

    return NextResponse.json({ success: true, reportId: report.id });
  } catch (error) {
    console.error("Report error:", error);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
