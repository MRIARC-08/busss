import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function authCheck(req: Request) {
  const auth = req.headers.get("x-admin-token") ?? "";
  return Boolean(auth && verifyAdminToken(auth));
}

// GET /api/admin/data?resource=buses|routes|users|stats
export async function GET(req: Request) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const url      = new URL(req.url);
  const resource = url.searchParams.get("resource") ?? "stats";

  if (resource === "stats") {
    const [buses, routes, users, reports, openReports] = await Promise.all([
      prisma.bus.count(),
      prisma.route.count(),
      prisma.user.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: "OPEN" } }),
    ]);
    return NextResponse.json({ buses, routes, users, reports, openReports });
  }

  if (resource === "buses") {
    const buses = await prisma.bus.findMany({
      include: { route: { select: { routeNumber: true, name: true } }, authority: { select: { name: true } } },
      orderBy: { id: "asc" },
    });
    return NextResponse.json(buses);
  }

  if (resource === "routes") {
    const routes = await prisma.route.findMany({
      include: {
        authority: { select: { name: true } },
        _count: { select: { buses: true, stops: true } },
      },
      orderBy: { routeNumber: "asc" },
    });
    return NextResponse.json(routes);
  }

  if (resource === "users") {
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, mobile: true, age: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  }

  return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
}

export async function PATCH(req: Request) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const url = new URL(req.url);
  const resource = url.searchParams.get("resource");

  try {
    const body = await req.json();

    if (resource === "buses") {
      const { id, busNumber, capacity, type, isActive } = body;
      const updated = await prisma.bus.update({
        where: { id },
        data: {
          busNumber,
          capacity: Number(capacity),
          type,
          isActive: Boolean(isActive),
        },
      });
      return NextResponse.json(updated);
    }

    if (resource === "routes") {
      const { id, routeNumber, name, type, baseFare, isActive } = body;
      const updated = await prisma.route.update({
        where: { id },
        data: {
          routeNumber,
          name,
          type,
          baseFare: Number(baseFare),
          isActive: Boolean(isActive),
        },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Unknown resource" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}
