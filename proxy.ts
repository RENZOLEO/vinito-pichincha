import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isLogin = request.nextUrl.pathname === "/admin/login";
  const isAdminApi = request.nextUrl.pathname.startsWith("/api/admin");

  if (isLogin) return NextResponse.next();

  if (isAdmin || isAdminApi) {
    const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
