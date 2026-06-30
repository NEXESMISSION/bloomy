import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidSession } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // Mêmes identifiants pour /admin (boutique) et /crm (gestion).
  const protectedArea = (pathname.startsWith("/admin") && pathname !== "/admin/login") || pathname.startsWith("/crm");
  if (protectedArea) {
    const ok = await isValidSession(req.cookies.get(ADMIN_COOKIE)?.value);
    if (!ok) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/crm/:path*"],
};
