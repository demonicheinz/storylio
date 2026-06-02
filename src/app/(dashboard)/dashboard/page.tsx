import {
  ArticleIcon,
  ChatCircleIcon,
  FolderOpenIcon,
  ImageIcon,
} from "@phosphor-icons/react/dist/ssr";
import { connection } from "next/server";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

async function getStats() {
  const [postsCount, projectsCount, galleryCount, testimonialsCount] =
    await Promise.all([
      db.post.count(),
      db.project.count(),
      db.galleryItem.count(),
      db.testimonial.count(),
    ]);

  return { postsCount, projectsCount, galleryCount, testimonialsCount };
}

async function getRecentPosts() {
  return db.post.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });
}

async function getRecentProjects() {
  return db.project.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
    },
  });
}

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<DashboardHomeFallback />}>
      <DashboardHomeContent />
    </Suspense>
  );
}

function DashboardHomeFallback() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Overview</h1>
        <p className="mt-2 text-muted-foreground">
          Loading your site overview...
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {["Posts", "Projects", "Gallery", "Testimonials"].map((label) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded-md bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

async function DashboardHomeContent() {
  await connection();

  const [stats, recentPosts, recentProjects] = await Promise.all([
    getStats(),
    getRecentPosts(),
    getRecentProjects(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Overview</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your site.
        </p>
      </div>
      {/* Total Posts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <ArticleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsCount}</div>
            <p className="text-xs text-muted-foreground">Blog articles</p>
          </CardContent>
        </Card>
        {/* Total Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderOpenIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsCount}</div>
            <p className="text-xs text-muted-foreground">Portfolio items</p>
          </CardContent>
        </Card>
        {/* Total Gallery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Gallery Items
            </CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.galleryCount}</div>
            <p className="text-xs text-muted-foreground">Uploaded images</p>
          </CardContent>
        </Card>
        {/* Total Testimonials */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Testimonials
            </CardTitle>
            <ChatCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.testimonialsCount}</div>
            <p className="text-xs text-muted-foreground">Client reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No posts yet.</p>
            ) : (
              <ul className="space-y-4">
                {recentPosts.map((post) => (
                  <li
                    key={post.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(post.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        post.status === "PUBLISHED" ? "default" : "secondary"
                      }
                    >
                      {post.status.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <ul className="space-y-4">
                {recentProjects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(project.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        project.status === "PUBLISHED" ? "default" : "secondary"
                      }
                    >
                      {project.status.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
