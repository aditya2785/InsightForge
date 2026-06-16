import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "User already exists",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    const response = NextResponse.json(
      {
        message: "Registration successful",
      },
      { status: 201 }
    );

    response.cookies.set(
      SESSION_COOKIE,
      createSessionToken(user.id),
      getSessionCookieOptions()
    );

    return response;
  } catch (error) {
    console.error("Registration Error:", error);

    return NextResponse.json(
      {
        message: "Registration failed",
      },
      { status: 500 }
    );
  }
}
