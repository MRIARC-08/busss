import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const JWT_SECRET = requiredEnv("JWT_SECRET");
const ADMIN_SECRET = requiredEnv("ADMIN_SECRET");

export function signToken(user: User) {
  return jwt.sign(
    { id: user.id, mobile: user.mobile, firstName: user.firstName, lastName: user.lastName },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function signAdminToken(username: string) {
  return jwt.sign(
    { username, role: "admin" },
    ADMIN_SECRET,
    { expiresIn: "8h" }
  );
}

export function verifyAdminToken(token: string) {
  try {
    const decoded = jwt.verify(token, ADMIN_SECRET) as jwt.JwtPayload;
    if (decoded?.role !== "admin" || typeof decoded.username !== "string") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
