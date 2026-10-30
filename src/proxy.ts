import { and, eq, isNull, lte, or } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PostStatus, ProjectStatus } from "@/lib/db/enums";
import { isOwnerEmail } from "@/lib/owner-guard";

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const detail = /^\/(blog|projects)\/([^/]+)\/?$/.exec(pathname);

  if (detail) {
    let slug: string;
    try {
      slug = decodeURIComponent(detail[2]);
    } catch {
      return missingContent(request);
    }

    // Check before any layout can stream. Fetch only an ID, never article content.
    const content =
      detail[1] === "blog"
        ? await db.query.post.findFirst({
            columns: { id: true },
            where: (table) =>
              and(
                eq(table.slug, slug),
                eq(table.status, PostStatus.PUBLISHED),
                or(
                  isNull(table.publishedAt),
                  lte(table.publishedAt, new Date()),
                ),
              ),
          })
        : await db.query.project.findFirst({
            columns: { id: true },
            where: (table) =>
              and(
                eq(table.slug, slug),
                eq(table.status, ProjectStatus.PUBLISHED),
              ),
          });

    return content ? NextResponse.next() : missingContent(request);
  }

  if (pathname !== "/dashboard" && !pathname.startsWith("/dashboard/")) {
    return NextResponse.next();
  }

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

  if (!isOwnerEmail(session.user.email)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

function missingContent(request: NextRequest) {
  return NextResponse.rewrite(new URL("/not-found", request.url), {
    status: 404,
    headers: {
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "private, no-store",
    },
  });
}

export const config = {
  matcher: ["/dashboard/:path*", "/blog/:slug", "/projects/:slug"],
};
