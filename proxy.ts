import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

const privateRoutes = [
  "/dashboard",
  "/upload",
  "/forecasts",
  "/reports",
  "/settings",
];

const publicAuthRoutes = [
  "/login",
  "/register",
];

function pathStartsWith(pathname: string, routes: string[]) {
  return routes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(`${route}/`)
  );
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const userId = verifySessionToken(
    req.cookies.get(SESSION_COOKIE)?.value
  );

  if (
    !userId &&
    pathStartsWith(pathname, privateRoutes)
  ) {
    return NextResponse.redirect(
      new URL("/login", req.url)
    );
  }

  if (
    userId &&
    pathStartsWith(pathname, publicAuthRoutes)
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", req.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/upload/:path*",
    "/forecasts/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/login",
    "/register",
  ],
};
