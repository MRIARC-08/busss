export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/feedback — save a new review
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    const { name, rating, text, route } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be 1–5" }, { status: 422 });
    }
    if (!text?.trim()) {
      return NextResponse.json({ error: "Feedback text is required" }, { status: 422 });
    }

    const feedback = await prisma.feedback.create({
      data: {
        name:   (name?.trim() || "Anonymous").slice(0, 80),
        rating: Math.round(rating),
        text:   text.trim().slice(0, 1000),
        route:  route?.trim().slice(0, 100) || null,
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
