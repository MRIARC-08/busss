import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

// ── Input validators ─────────────────────────────────────────────────────────
function isValidMobile(mobile: string) {
  return /^[6-9]\d{9}$/.test(mobile.trim());
}
function isValidAadhaar(aadhaar: string) {
  return /^\d{12}$/.test(aadhaar.trim());
}
function isValidPassword(password: string) {
  return password.length >= 6;
}
function isValidAge(age: number) {
  return Number.isInteger(age) && age >= 1 && age <= 120;
}
function isValidName(name: string) {
  return name.trim().length >= 1 && name.trim().length <= 60;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { mobile, firstName, lastName, age, aadhaar, password } = body;

    // ── Field validation ────────────────────────────────────────────────────
    const errors: string[] = [];

    if (!isValidMobile(String(mobile ?? "")))
      errors.push("Enter a valid 10-digit Indian mobile number (starts with 6-9).");
    if (!isValidName(String(firstName ?? "")))
      errors.push("First name is required (max 60 chars).");
    if (!isValidName(String(lastName ?? "")))
      errors.push("Last name is required (max 60 chars).");
    if (!isValidAge(Number(age)))
      errors.push("Age must be between 1 and 120.");
    if (!isValidAadhaar(String(aadhaar ?? "")))
      errors.push("Aadhaar must be exactly 12 digits.");
    if (!isValidPassword(String(password ?? "")))
      errors.push("Password must be at least 6 characters.");

    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0], errors }, { status: 422 });
    }

    // ── Duplicate check ─────────────────────────────────────────────────────
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile: mobile.trim() }, { aadhaar: aadhaar.trim() }] },
      select: { mobile: true, aadhaar: true },
    });

    if (existing) {
      if (existing.mobile === mobile.trim())
        return NextResponse.json({ error: "An account with this mobile number already exists." }, { status: 409 });
      return NextResponse.json({ error: "An account with this Aadhaar number already exists." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 12);

    const user = await prisma.user.create({
      data: {
        mobile: mobile.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age),
        aadhaar: aadhaar.trim(),
        password: hashedPassword,
      },
    });

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
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
