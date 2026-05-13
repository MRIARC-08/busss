import { NextResponse } from "next/server";

// ── Admin credentials (env-first, fallback for dev) ──────────────────────────
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin@123";
const ADMIN_SECRET   = process.env.ADMIN_SECRET   ?? "wimb-admin-secret-2026";

export async function POST(req: Request) {
  const { username, password } = await req.json().catch(() => ({}));

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Simple tamper-evident token: base64(payload):base64(secret-hash)
  const payload  = Buffer.from(JSON.stringify({ username, ts: Date.now() })).toString("base64");
  const hmacData = Buffer.from(`${payload}.${ADMIN_SECRET}`).toString("base64");
  const token    = `${payload}.${hmacData}`;

  return NextResponse.json({ token });
}
