export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// POST /api/feedback — save a new review
export async function POST(req: Request) {
  try {
    const rate = checkRateLimit(`feedback:${getClientIp(req)}`, 5, 60 * 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many feedback submissions. Try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { name, rating, text, route } = body;
    const numericRating = Number(rating);

    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 422 });
    }
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Feedback text is required" }, { status: 422 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        name:   (typeof name === "string" && name.trim() ? name.trim() : "Anonymous").slice(0, 80),
        rating: Math.round(numericRating),
        text:   text.trim().slice(0, 1000),
        route:  typeof route === "string" && route.trim() ? route.trim().slice(0, 100) : null,
      },
    });

    return NextResponse.json({ success: true, id: feedback.id });
  } catch (err: any) {
    console.error("Feedback POST error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// GET /api/feedback — fetch recent reviews (public, for homepage carousel)
export async function GET() {
  try {
    const items = await prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json({ success: true, feedback: items });
  } catch (err: any) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
