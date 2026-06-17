// app/api/testbcrypt/route.ts

import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET() {
  const hash = await bcrypt.hash("hello", 10);

  return NextResponse.json({
    hash,
  });
}