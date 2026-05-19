// Trigger TS server re-evaluation
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ipAddress = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "Unknown";

    await (prisma as any).sosAlert.create({
      data: {
        ipAddress: String(ipAddress).slice(0, 45),
        userAgent: String(userAgent).slice(0, 255),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("SOS Alert logging error:", error);
    return NextResponse.json({ error: "Failed to log SOS alert" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get("x-admin-token") ?? "";
  const { verifyAdminToken } = require("@/lib/auth");
  if (!auth || !verifyAdminToken(auth)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const alerts = await (prisma as any).sosAlert.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return NextResponse.json(alerts);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
