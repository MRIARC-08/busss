import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

function authCheck(req: Request) {
  const auth = req.headers.get("x-admin-token") ?? "";
  return Boolean(auth && verifyAdminToken(auth));
}

export async function GET(req: Request) {
  if (!authCheck(req)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const url    = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const type   = url.searchParams.get("type")   ?? undefined;
  const page   = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const limit  = 20;

  const where: any = {};
  if (status) where.status = status;
  if (type)   where.type   = type;

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { bus: { select: { busNumber: true } }, route: { select: { routeNumber: true, name: true } } },
    }),
  ]);

  return NextResponse.json({ total, page, pages: Math.ceil(total / limit), reports });
}

export async function PATCH(req: Request) {
  if (!authCheck(req)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, status } = await req.json();
  if (!Number.isInteger(Number(id))) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 422 });
  }
  if (!["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 422 });
  }
  const updated = await prisma.report.update({ where: { id }, data: { status } });
  return NextResponse.json(updated);
}
