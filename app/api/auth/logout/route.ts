import { NextResponse } from "next/server";
import {
  getExpiredSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST() {
  const response =
    NextResponse.json({
      success: true,
    });

  response.cookies.set(
    SESSION_COOKIE,
    "",
    getExpiredSessionCookieOptions()
  );

  return response;
}
