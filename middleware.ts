import { NextRequest, NextResponse } from "next/server";
import { adminCookieName, verifyAdminCookieValue } from "./lib/adminAuth";

const PUBLIC_PATHS = new Set([
  "/admin/login",
]);

const PUBLIC_API_PATHS = new Set([
  "/api/admin/login",
]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminPage && PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (isAdminApi && PUBLIC_API_PATHS.has(pathname)) return NextResponse.next();

  if (isAdminPage || isAdminApi) {
    const cookie = req.cookies.get(adminCookieName())?.value;
    const ok = (await verifyAdminCookieValue(cookie)).ok;

    if (!ok) {
      if (isAdminApi) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
