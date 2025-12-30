import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req: any) {
  // Allow public and auth-related routes to pass through without redirect
  const publicPaths = [
    '/',
    '/login',
  ];

  if (
    req.nextUrl.pathname.startsWith('/api') ||
    publicPaths.includes(req.nextUrl.pathname) ||
    req.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!session && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Apply to all routes except static files
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};