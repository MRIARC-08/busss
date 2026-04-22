import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mobile, firstName, lastName, age, aadhaar, password } = body;
    
    const existing = await prisma.user.findFirst({
      where: { OR: [{ mobile }, { aadhaar }] }
    });
    
    if (existing) {
      return NextResponse.json({ error: "User with mobile or aadhaar already exists" }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        mobile,
        firstName,
        lastName,
        age: parseInt(age),
        aadhaar,
        password: hashedPassword
      }
    });
    
    const token = signToken(user);
    const response = NextResponse.json({ success: true, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, mobile: user.mobile } });
    response.cookies.set("token", token, { httpOnly: true, path: "/" });
    
    return response;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: error.message || String(error) || "Server error" }, { status: 500 });
  }
}
