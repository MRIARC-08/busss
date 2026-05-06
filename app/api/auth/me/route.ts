import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return NextResponse.json({ user: null });

    const decoded = verifyToken(token) as any;
    if (!decoded?.id) return NextResponse.json({ user: null });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        age: user.age,
        // Never expose aadhaar or password
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
