import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/",
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/refresh",
  "/api/health",
  "/api/docs",
  "/api-docs",
];

// Pages that should redirect to /dashboard if already logged in
const AUTH_PAGES = ["/login", "/signup"];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

async function verifyMiddlewareToken(token: string): Promise<boolean> {
  try {
    const secret = getSecret();
    if (!secret) return false;
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public/")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get("access_token")?.value;
  const isValid = token ? await verifyMiddlewareToken(token) : false;

  // Redirect authenticated users away from login/signup
  if (AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    if (isValid) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  if (!isValid) {
    // For API routes: return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }
    // For pages: redirect to login
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
