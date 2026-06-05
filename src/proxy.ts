import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    const loginUrl = new URL("/sign-in", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(loginUrl);
  }

  // Owner-only guard: only configured owner email(s) can access dashboard
  const ownerEmails = process.env.OWNER_EMAIL
    ? process.env.OWNER_EMAIL.split(",").map((e) => e.trim().toLowerCase())
    : null;

  if (!ownerEmails) {
    // Env tidak dikonfigurasi — tolak semua akses
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
