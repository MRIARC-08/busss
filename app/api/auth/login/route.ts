export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

function isValidMobile(mobile: string) {
  return /^[6-9]\d{9}$/.test(mobile.trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { mobile, password } = body;

    // Field presence + format check
    if (!mobile || !isValidMobile(String(mobile))) {
      return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 422 });
    }
    if (!password || String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 422 });
    }

    const user = await prisma.user.findUnique({ where: { mobile: mobile.trim() } });

    // Use constant-time compare even when user not found (prevents timing attacks)
    const dummyHash = "$2a$12$invalidhashfortimingprotection000000000000000000000000";
    const hashToCheck = user?.password ?? dummyHash;
    const isValid = await bcrypt.compare(String(password), hashToCheck);

    if (!user || !isValid) {
      // Generic message — never reveal whether mobile exists
      return NextResponse.json({ error: "Invalid mobile number or password." }, { status: 401 });
    }

    const token = signToken(user);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobile: user.mobile,
        age: user.age,
        createdAt: user.createdAt,
      },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
