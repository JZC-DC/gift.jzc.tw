import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // 需要登入才能存取的路由
  const protectedPaths = ["/dashboard", "/scan", "/settings"];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 已登入的使用者不需要看登入頁
  if (pathname === "/" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons|Logo.png).*)"],
};
