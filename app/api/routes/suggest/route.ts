export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || "";
  const to   = searchParams.get("to")   || "";

  if (!from || !to) {
    return NextResponse.json({ error: "from and to required" }, { status: 400 });
  }

  try {
    // Find stops matching from/to names
    const fromStop = await prisma.stop.findFirst({
      where: { name: { contains: from } },
    });
    const toStop = await prisma.stop.findFirst({
      where: { name: { contains: to } },
    });

    if (!fromStop || !toStop) {
      return NextResponse.json({
        success: false,
        message: "Could not find stops for given locations",
        from, to,
      }, { status: 404 });
    }

    // Get all routes with their stops
    const allRoutes = await prisma.route.findMany({
      where: { isActive: true },
      include: {
        stops: { orderBy: { sequence: "asc" } },
        authority: true,
        buses: { where: { isActive: true } },
      },
    });

    // ── FIND DIRECT ROUTES ───────────────────────
    const directPlans: any[] = [];
    const transferPlans: any[] = [];

    for (const route of allRoutes) {
      const fromIdx = route.stops.findIndex(s => s.stopId === fromStop.id);
      const toIdx   = route.stops.findIndex(s => s.stopId === toStop.id);

      if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
        const fromStopData = route.stops[fromIdx];
        const toStopData   = route.stops[toIdx];
        const travelMin    = toStopData.timeMinutes - fromStopData.timeMinutes;
        const distanceKm   = toStopData.distanceKm  - fromStopData.distanceKm;
        const waitMin      = Math.floor(route.frequencyMinutes / 2);
        const totalMin     = travelMin + waitMin;
        const occupancy    = route.buses[0]?.simOccupancy ?? 20;
        const capacity     = route.buses[0]?.capacity ?? 55;
        const crowdLevel   = getCrowdLevel(occupancy, capacity);
        const fare         = route.baseFare *
          (distanceKm / route.totalKm);

        directPlans.push({
          type: "DIRECT",
          routeNumber: route.routeNumber,
          routeName: route.name,
          authority: route.authority.code,
          routeType: route.type,
          legs: [{
            routeNumber: route.routeNumber,
            authority:   route.authority.code,
            from:        fromStopData.stopName,
            to:          toStopData.stopName,
            durationMin: travelMin,
            distanceKm:  Math.round(distanceKm * 10) / 10,
            isTransfer:  false,
            waitMin,
          }],
          totalMin,
          travelMin,
          waitMin,
          walkMin: 0,
          transfers: 0,
          fare: Math.round(fare),
          distanceKm: Math.round(distanceKm * 10) / 10,
          crowdLevel,
          reliability: route.reliability,
          occupancy,
          capacity,
          busId: route.buses[0]?.id,
          busNumber: route.buses[0]?.busNumber,
          delayMin: route.buses[0]?.simDelay ?? 0,
        });
      }
    }

    // ── FIND 1-TRANSFER ROUTES ───────────────────
    for (const routeA of allRoutes) {
      const fromIdx = routeA.stops.findIndex(s => s.stopId === fromStop.id);
      if (fromIdx === -1) continue;

      const stopsAfterOrigin = routeA.stops.slice(fromIdx + 1);

      for (const routeB of allRoutes) {
        if (routeA.id === routeB.id) continue;
        const toIdx = routeB.stops.findIndex(s => s.stopId === toStop.id);
        if (toIdx === -1) continue;

        for (const midStop of stopsAfterOrigin) {
          const transferIdx = routeB.stops.findIndex(
            s => s.stopId === midStop.stopId
          );
          if (transferIdx === -1 || transferIdx >= toIdx) continue;

          const legAFrom = routeA.stops[fromIdx];
          const legATo   = midStop;
          const legBFrom = routeB.stops[transferIdx];
          const legBTo   = routeB.stops[toIdx];

          const legAMin  = legATo.timeMinutes - legAFrom.timeMinutes;
          const legBMin  = legBTo.timeMinutes - legBFrom.timeMinutes;
          const waitA    = Math.floor(routeA.frequencyMinutes / 2);
          const waitB    = Math.floor(routeB.frequencyMinutes / 2);
          const walkMin  = 4; // walking between stops
          const totalMin = legAMin + waitA + walkMin + legBMin + waitB;

          const occA = routeA.buses[0]?.simOccupancy ?? 20;
          const capA = routeA.buses[0]?.capacity     ?? 55;
          const occB = routeB.buses[0]?.simOccupancy ?? 20;
          const capB = routeB.buses[0]?.capacity     ?? 55;
          const avgOcc = (occA + occB) / 2;
          const avgCap = (capA + capB) / 2;

          const fareA = routeA.baseFare * ((legATo.distanceKm - legAFrom.distanceKm) / routeA.totalKm);
          const fareB = routeB.baseFare * ((legBTo.distanceKm - legBFrom.distanceKm) / routeB.totalKm);

          transferPlans.push({
            type: "TRANSFER",
            routeNumber: `${routeA.routeNumber} → ${routeB.routeNumber}`,
            authority: `${routeA.authority.code} + ${routeB.authority.code}`,
            legs: [
              {
                routeNumber: routeA.routeNumber,
                authority:   routeA.authority.code,
                from:        legAFrom.stopName,
                to:          legATo.stopName,
                durationMin: legAMin,
                isTransfer:  false,
                waitMin:     waitA,
              },
              {
                type:        "WALK",
                description: `Walk at ${midStop.stopName}`,
                durationMin: walkMin,
                isTransfer:  true,
              },
              {
                routeNumber: routeB.routeNumber,
                authority:   routeB.authority.code,
                from:        legBFrom.stopName,
                to:          legBTo.stopName,
                durationMin: legBMin,
                isTransfer:  false,
                waitMin:     waitB,
              },
            ],
            totalMin,
            travelMin: legAMin + legBMin,
            waitMin: waitA + waitB,
            walkMin,
            transfers: 1,
            transferStop: midStop.stopName,
            fare: Math.round(fareA + fareB),
            distanceKm: Math.round(
              (legATo.distanceKm - legAFrom.distanceKm +
               legBTo.distanceKm - legBFrom.distanceKm) * 10
            ) / 10,
            crowdLevel: getCrowdLevel(avgOcc, avgCap),
            reliability: (routeA.reliability + routeB.reliability) / 2,
            occupancy: Math.round(avgOcc),
            capacity:  Math.round(avgCap),
            busId: routeA.buses[0]?.id,
            busNumber: routeA.buses[0]?.busNumber,
            delayMin: routeA.buses[0]?.simDelay ?? 0,
          });

          break; // take first valid transfer
        }
      }
    }

    const allPlans = [...directPlans, ...transferPlans];

    if (allPlans.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No routes found between these stops",
      }, { status: 404 });
    }

    // ── SCORE EACH PLAN ──────────────────────────
    const scored = allPlans.map(plan => ({
      ...plan,
      score: scoreRoute(plan, allPlans),
    }));

    // ── BUILD RECOMMENDATIONS ────────────────────
    const byScore      = [...scored].sort((a, b) => b.score - a.score);
    const bySpeed      = [...scored].sort((a, b) => a.totalMin - b.totalMin);
    const byCrowd      = [...scored].sort((a, b) =>
      crowdOrder(a.crowdLevel) - crowdOrder(b.crowdLevel));
    const byTransfers  = [...scored].sort((a, b) => a.transfers - b.transfers);

    const result = {
      success: true,
      from: fromStop.name,
      to:   toStop.name,
      totalFound: scored.length,
      recommendations: {
        RECOMMENDED:      { ...byScore[0],     label: "⭐ Recommended",    reasons: buildReasons(byScore[0],     "recommended") },
        FASTEST:          { ...bySpeed[0],      label: "🚀 Fastest",        reasons: buildReasons(bySpeed[0],      "fastest")     },
        LEAST_CROWDED:    { ...byCrowd[0],      label: "😌 Least Crowded",  reasons: buildReasons(byCrowd[0],      "crowd")       },
        LEAST_TRANSFERS:  { ...byTransfers[0],  label: "🔄 Least Transfers", reasons: buildReasons(byTransfers[0],  "transfers")   },
      },
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error("Route suggestion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── HELPERS ──────────────────────────────────────
function getCrowdLevel(occupancy: number, capacity: number): string {
  const hour = new Date().getHours();
  const isPeak = (hour >= 8 && hour <= 10) || (hour >= 17 && hour <= 20);
  const pct = (occupancy / capacity) * 100 * (isPeak ? 1.3 : 1);
  if (pct < 40) return "LOW";
  if (pct < 65) return "MEDIUM";
  if (pct < 85) return "HIGH";
  return "VERY_HIGH";
}

function crowdOrder(level: string) {
  return { LOW: 0, MEDIUM: 1, HIGH: 2, VERY_HIGH: 3 }[level] ?? 4;
}

function scoreRoute(plan: any, allPlans: any[]) {
  const minTime = Math.min(...allPlans.map(p => p.totalMin));
  const maxTime = Math.max(...allPlans.map(p => p.totalMin));
  const range   = maxTime - minTime || 1;

  const speedScore    = 30 * (1 - (plan.totalMin - minTime) / range);
  const crowdScore    = ({ LOW: 25, MEDIUM: 18, HIGH: 10, VERY_HIGH: 0 } as Record<string, number>)[plan.crowdLevel] ?? 10;
  const transferScore = { 0: 20, 1: 13, 2: 6 }[plan.transfers as 0|1|2] ?? 0;
  const reliScore     = 15 * plan.reliability;
  const walkScore     = plan.walkMin <= 3 ? 10 : plan.walkMin <= 7 ? 7 : 4;

  return Math.round(speedScore + crowdScore + transferScore + reliScore + walkScore);
}

function buildReasons(plan: any, type: string): string[] {
  if (!plan) return [];
  const map: Record<string, string[]> = {
    recommended: [
      `Best overall score — balanced speed and comfort`,
      `Travel time: ${plan.totalMin} minutes with ${plan.transfers} transfer(s)`,
      `Crowd level: ${plan.crowdLevel.toLowerCase()} — comfortable journey`,
      `On-time reliability: ${Math.round(plan.reliability * 100)}%`,
      plan.delayMin > 0
        ? `Current delay: ${plan.delayMin} min — factor this in`
        : `Currently running on time`,
    ],
    fastest: [
      `Shortest total travel time: ${plan.totalMin} minutes`,
      plan.transfers === 0 ? `Direct route — no transfers needed` : `Fastest despite ${plan.transfers} transfer`,
      `Note: Crowd level is ${plan.crowdLevel.toLowerCase()}`,
      `Fare: ₹${plan.fare} approx`,
    ],
    crowd: [
      `Lowest crowd level: ${plan.crowdLevel.toLowerCase()}`,
      `Good chance of getting a seat`,
      `Recommended for elderly or passengers with luggage`,
      plan.transfers > 0
        ? `Has ${plan.transfers} transfer — transfer stop has waiting area`
        : `Direct route with comfortable journey`,
    ],
    transfers: [
      `Minimum transfers: ${plan.transfers}`,
      `Easiest route to navigate`,
      `Best for first-time travelers or unfamiliar passengers`,
      `Travel time: ${plan.totalMin} minutes`,
    ],
  };
  return map[type] ?? [];
}
