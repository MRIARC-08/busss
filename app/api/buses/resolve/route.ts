export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/buses/resolve?id=<rawId>
 *
 * Maps any bus identifier to a DB bus integer ID:
 * - If rawId is already an integer → verify it exists, return it
 * - If rawId looks like a bus number (e.g. "HR-29-4521") → find by busNumber
 * - If rawId is a GTFS vehicle ID (e.g. "DL1PD6734") → try to match by any
 *   heuristic (partial match on busNumber, routeId prefix, etc.)
 * - If nothing matches → pick bus 1 as a demo fallback so the page
 *   always shows something meaningful instead of a blank error screen
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = (searchParams.get("id") || "").trim();

  if (!rawId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    // 1. Try integer parse
    const asInt = parseInt(rawId, 10);
    if (!isNaN(asInt) && String(asInt) === rawId) {
      const bus = await prisma.bus.findUnique({ where: { id: asInt }, select: { id: true } });
      if (bus) return NextResponse.json({ busId: bus.id });
    }

    // 2. Try exact busNumber match (e.g. "HR-29-4521")
    const byNumber = await prisma.bus.findUnique({
      where: { busNumber: rawId },
      select: { id: true },
    });
    if (byNumber) return NextResponse.json({ busId: byNumber.id });

    // 3. Try partial match — GTFS IDs sometimes encode route info
    //    e.g. "DL1PD6734" → look for buses whose busNumber contains "DL"
    const prefix = rawId.replace(/\d+/g, "").slice(0, 4); // take alpha prefix
    if (prefix.length >= 2) {
      const partial = await prisma.bus.findFirst({
        where: { busNumber: { contains: prefix } },
        select: { id: true },
      });
      if (partial) return NextResponse.json({ busId: partial.id });
    }

    // 4. Demo fallback — return first active bus so tracking page always loads
    const fallback = await prisma.bus.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true },
    });
    if (fallback) {
      return NextResponse.json({ busId: fallback.id, fallback: true });
    }

    return NextResponse.json({ error: "No buses found" }, { status: 404 });
  } catch (e: any) {
    console.error("Resolve error:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
