import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ToastProvider } from "@/components/ui/toast";
import { NotePreview } from "@/features/dashboard/posts/components/note-preview";
import { PostEditor } from "@/features/dashboard/posts/components/post-editor";
import { PostsManager } from "@/features/dashboard/posts/components/posts-manager";
import { DashboardConfirmationHost } from "@/features/dashboard/shared/components/confirmation-dialog";
import { DateTimePicker } from "@/features/dashboard/shared/components/date-time-picker";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

const cover =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="white"/><path d="M0 0L1280 720M1280 0L0 720" stroke="#facc15" stroke-width="200"/></svg>',
  );
const params = new URLSearchParams(location.search),
  future = new Date(Date.now() + 7 * 86400000).toISOString();
const posts = Array.from({ length: 65 }, (_, i) => ({
  id: `post-${i}`,
  title:
    i === 0
      ? "An article title with a deliberately long accessible interface description"
      : i === 1
        ? "A note on project details"
        : `Post ${i}`,
  slug: `post-${i}`,
  status: i % 4 === 0 ? "DRAFT" : "PUBLISHED",
  coverImage: i < 3 ? cover : null,
  createdAt: "2026-06-18T06:00:00Z",
  updatedAt: "2026-10-27T06:00:00Z",
  publishedAt:
    i % 4 === 0 ? null : i % 4 === 2 ? future : "2026-10-27T06:00:00Z",
  viewCount: i * 7,
  tags:
    i % 3 === 1
      ? [{ name: "notes" }]
      : [
          { name: "React" },
          { name: "TypeScript" },
          { name: "Accessibility" },
          { name: "Dashboard" },
        ],
}));
if (params.has("due"))
  posts[2].publishedAt = new Date(Date.now() + 60_000).toISOString();
const post = {
  id: "saved",
  title: "Saved article",
  slug: "saved-article",
  excerpt: "A concise summary.",
  content: "Saved content.",
  coverImage: cover,
  status:
    params.get("editor") === "scheduled" || params.get("editor") === "published"
      ? "published"
      : "draft",
  publishedAt:
    params.get("editor") === "scheduled"
      ? future
      : params.get("editor") === "published"
        ? "2026-10-27T06:00:00Z"
        : null,
  tags: params.has("note") ? ["notes", "React"] : ["React", "Accessibility"],
};
window.persistedPost =
  params.get("editor") === "create"
    ? null
    : {
        id: post.id,
        slug: post.slug,
        status: post.status,
        publishedAt: post.publishedAt,
      };
function Picker() {
  const [date, setDate] = useState(future);
  return (
    <div style={{ marginTop: 500 }}>
      <label htmlFor="fixture-date">Publication date</label>
      <DateTimePicker id="fixture-date" value={date} onChange={setDate} />
      <p id="fixture-value">{date}</p>
    </div>
  );
}
createRoot(document.getElementById("root")).render(
  <>
    <DashboardConfirmationHost />
    {
      <ToastProvider>
        <main
          className={shell.shell}
          style={{ maxWidth: 1280, margin: "auto", padding: 16 }}
        >
          {params.has("picker") ? (
            <Picker />
          ) : params.has("preview-note") ? (
            <NotePreview
              id="saved"
              title="Private draft note"
              state="Draft"
              dateISO={future}
              dateLabel="Preview date"
              body={
                <>
                  <h2 id="details">Shared note reading body</h2>
                  <p>Private note content.</p>
                </>
              }
            />
          ) : params.has("editor") ? (
            <PostEditor
              mode={params.get("editor") === "create" ? "create" : "edit"}
              {...(params.get("editor") === "create" ? {} : { post })}
            />
          ) : (
            <PostsManager posts={posts} />
          )}
        </main>
      </ToastProvider>
    }
  </>,
);
