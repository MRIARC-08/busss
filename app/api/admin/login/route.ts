import { NextResponse } from "next/server";
import { signAdminToken } from "@/lib/auth";

function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD are required");
  }
  return { username, password };
}

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json().catch(() => ({}));
    const admin = getAdminCredentials();

    if (username !== admin.username || password !== admin.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({ token: signAdminToken(username) });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Admin auth is not configured" }, { status: 500 });
  }
}
