import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { mobile, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    
    const token = signToken(user);
    const response = NextResponse.json({ success: true, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, mobile: user.mobile } });
    response.cookies.set("token", token, { httpOnly: true, path: "/" });
    
    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message || String(error) || "Server error" }, { status: 500 });
  }
}
