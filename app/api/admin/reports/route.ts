import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Basic token check
  const auth = req.headers.get("x-admin-token") ?? "";
  if (!auth.startsWith("ey") && !auth.includes(".")) {
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
  const auth = req.headers.get("x-admin-token") ?? "";
  if (!auth.includes(".")) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { id, status } = await req.json();
  const updated = await prisma.report.update({ where: { id }, data: { status } });
  return NextResponse.json(updated);
}
