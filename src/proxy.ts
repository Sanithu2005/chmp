import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";

type SessionWithUser = {
  session: { id: string; userId: string; expiresAt: string };
  user: { id: string; email: string; role: string };
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — skip auth check
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const { data } = await betterFetch<SessionWithUser>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  if (!data?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const role = data.user.role;

  // Role guards
  if (pathname.startsWith("/doctor") && role !== "medical_professional") {
    return NextResponse.redirect(new URL("/parent", request.url));
  }

  if (pathname.startsWith("/parent") && role !== "parent") {
    return NextResponse.redirect(new URL("/doctor", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
