import { Activity, StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import NewPostPage from "@/app/(dashboard)/dashboard/posts/new/page";
import NewProjectPage from "@/app/(dashboard)/dashboard/projects/new/page";
import { PublicPageSkeleton } from "@/components/common/public-page-skeleton";
import { PostCard } from "@/components/public/sections/blog/post-card";
import { Controls } from "./controls";

window.fixture = { id: "first", fail: false, calls: [] };
window.confirm = () => true;
function App() {
  const kind = new URLSearchParams(location.search).get("kind") ?? "posts";
  const [visible, setVisible] = useState(true);
  const [id, setId] = useState("first");
  const visit = (fresh) => {
    if (fresh) setId(crypto.randomUUID());
    setVisible(true);
  };
  window.fixture.router = {
    bfcacheId: id,
    replace(path) {
      window.fixture.destination = path;
      setVisible(false);
    },
    refresh() {},
  };
  const variant = new URLSearchParams(location.search).get("variant");
  if (kind === "controls") return <Controls />;
  if (variant) return <PublicPageSkeleton variant={variant} />;
  if (kind === "cover")
    return (
      <div
        style={{ width: "min(400px, calc(100% - 32px))", margin: "80px auto" }}
      >
        <PostCard
          post={{
            id: "test",
            slug: "test",
            title: "An article without a cover",
            excerpt: "The cover area should retain its aspect ratio.",
            content: "Text",
            coverImage: null,
            publishedAt: null,
            createdAt: new Date("2026-01-01"),
            tags: [],
            viewCount: 0,
          }}
        />
      </div>
    );
  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <button type="button" onClick={() => setVisible(false)}>
          Collection
        </button>
        <button type="button" onClick={() => visit(true)}>
          New item
        </button>
        <button type="button" onClick={() => visit(false)}>
          Back to draft
        </button>
      </div>
      <Activity mode={visible ? "visible" : "hidden"}>
        {kind === "posts" ? <NewPostPage /> : <NewProjectPage />}
      </Activity>
    </main>
  );
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
