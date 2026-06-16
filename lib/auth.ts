import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SESSION_COOKIE = "token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export function createSessionToken(userId: string) {
  return jwt.sign(
    {
      userId,
    },
    getJwtSecret(),
    {
      expiresIn: SESSION_MAX_AGE_SECONDS,
    }
  );
}

export function verifySessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(
      token,
      getJwtSecret()
    ) as SessionPayload;

    return typeof decoded.userId === "string"
      ? decoded.userId
      : null;
  } catch {
    return null;
  }
}

export async function getCurrentUserId() {
  const cookieStore = await cookies();

  return verifySessionToken(
    cookieStore.get(SESSION_COOKIE)?.value
  );
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: new Date(0),
  };
}

export { SESSION_COOKIE };
