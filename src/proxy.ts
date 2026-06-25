import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Maps a subdomain to the route segment it should transparently serve.
// mutual.rlylabs.com/foo  ->  /mutual/foo  (URL bar still shows the subdomain)
const SUBDOMAIN_ROUTES: Record<string, string> = {
  mutual: "/mutual",
};

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const sub = host.split(":")[0].split(".")[0];

  const base = SUBDOMAIN_ROUTES[sub];
  if (!base) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (pathname === base || pathname.startsWith(`${base}/`)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `${base}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes, and files with an extension.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
