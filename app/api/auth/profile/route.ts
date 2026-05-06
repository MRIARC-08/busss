export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyToken, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function PATCH(req: Request) {
  try {
    const token = cookies().get("token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const decoded = verifyToken(token) as any;
    if (!decoded?.id) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

    const { firstName, lastName, age, currentPassword, newPassword } = body;
    const updates: any = {};

    if (firstName !== undefined) {
      if (!String(firstName).trim()) return NextResponse.json({ error: "First name cannot be empty." }, { status: 422 });
      updates.firstName = String(firstName).trim();
    }
    if (lastName !== undefined) {
      if (!String(lastName).trim()) return NextResponse.json({ error: "Last name cannot be empty." }, { status: 422 });
      updates.lastName = String(lastName).trim();
    }
    if (age !== undefined) {
      const ageNum = Number(age);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120)
        return NextResponse.json({ error: "Age must be between 1 and 120." }, { status: 422 });
      updates.age = ageNum;
    }

    // Password change requires current password verification
    if (newPassword !== undefined) {
      if (!currentPassword) return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 422 });
      if (String(newPassword).length < 6) return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 422 });

      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

      const isValid = await bcrypt.compare(String(currentPassword), user.password);
      if (!isValid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

      updates.password = await bcrypt.hash(String(newPassword), 12);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided." }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id: decoded.id }, data: updates });

    // Refresh token with updated name
    const newToken = signToken(updated);
    const response = NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        firstName: updated.firstName,
        lastName: updated.lastName,
        mobile: updated.mobile,
        age: updated.age,
        createdAt: updated.createdAt,
      },
    });
    response.cookies.set("token", newToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
