import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_temporary_key_12345";

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
