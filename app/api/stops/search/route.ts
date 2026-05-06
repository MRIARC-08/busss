export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json({ stops: [] });
    }

    const stops = await prisma.stop.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive", // PostgreSQL case-insensitive search
        },
      },
      take: 10,
      select: {
        name: true,
      },
    });

    const stopNames = stops.map((s) => s.name);
    return NextResponse.json({ stops: stopNames });
  } catch (error) {
    console.error("Stop Search Error:", error);
    return NextResponse.json({ stops: [] }, { status: 500 });
  }
}
