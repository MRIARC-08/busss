import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Simple secret guard — set SEED_SECRET in Vercel env vars
// Hit: GET /api/seed?secret=<SEED_SECRET>
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  const expected = process.env.SEED_SECRET || "wimb-seed-2026";
  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Upsert demo user (password = "password123", bcrypt cost 12)
  const demoHash = "$2b$12$vtaeNk3Pvqgc98jDI0w7auTH7pvh5axxDhVXfBe964MD.XJpnHx.m";

  const user = await prisma.user.upsert({
    where:  { mobile: "9999999999" },
    update: {},
    create: {
      mobile:    "9999999999",
      password:  demoHash,
      firstName: "Demo",
      lastName:  "User",
      age:       25,
      aadhaar:   "999999999999",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Demo user ready",
    userId:  user.id,
    mobile:  user.mobile,
    note:    "Login with mobile: 9999999999 / password: password123",
  });
}
