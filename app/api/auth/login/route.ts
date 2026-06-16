import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(
  req: Request
) {
  try {
    const {
      email,
      password,
    } = await req.json();

    const user =
      await prisma.user.findUnique({
        where: { email },
      });

    if (!user) {
      return NextResponse.json(
        {
          message:
            "User not found",
        },
        { status: 404 }
      );
    }

    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return NextResponse.json(
        {
          message:
            "Invalid password",
        },
        { status: 401 }
      );
    }

    const token =
      createSessionToken(user.id);

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set(
      SESSION_COOKIE,
      token,
      getSessionCookieOptions()
    );

    return response;
  } catch {
    return NextResponse.json(
      {
        message:
          "Login failed",
      },
      { status: 500 }
    );
  }
}
