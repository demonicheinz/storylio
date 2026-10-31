import { createRoot } from "react-dom/client";
import { PostEditor } from "@/features/dashboard/posts/components/post-editor";
import { ProjectEditor } from "@/features/dashboard/projects/components/project-editor";
import { DashboardConfirmationHost } from "@/features/dashboard/shared/components/confirmation-dialog";

const params = new URLSearchParams(location.search);
const kind = params.get("kind") ?? "post";
const status = params.get("status") ?? "published";
const record = {
  id: "fixture",
  title: "Original title",
  slug: "fixture",
  excerpt: "",
  content: "Original content.",
  coverImage: null,
  status,
  publishedAt: "2026-01-10T10:00:00.000Z",
  tags: [],
  description: "",
  contribution: "",
  thumbnailImageUrl: null,
  ogImageUrl: null,
  structuredScreenshots: [],
  techStack: [],
  liveUrl: null,
  githubUrl: null,
  order: 0,
  isFeatured: false,
  isClosedSource: false,
};

window.editorFixture = {
  calls: [],
  pending: [],
  stored: { ...record },
  refreshes: 0,
  resolve(outcome = "success") {
    const request = this.pending.shift();
    if (!request) throw new Error("No pending request");
    if (outcome === "throw") return request.reject(new Error("Offline"));
    if (outcome === "failure")
      return request.resolve({ success: false, error: "Fixture save failed" });
    this.stored = {
      ...request.input,
      status:
        request.action === "autosave"
          ? this.stored.status
          : request.action === "publish"
            ? "published"
            : "draft",
    };
    request.resolve({
      success: true,
      data: {
        id: "fixture",
        slug: this.stored.slug,
        status: this.stored.status,
      },
    });
  },
  save(action, input) {
    this.calls.push({ action, input: structuredClone(input) });
    return new Promise((resolve, reject) =>
      this.pending.push({ action, input, resolve, reject }),
    );
  },
};

const create = params.get("mode") === "create";
createRoot(document.getElementById("root")).render(
  <>
    <DashboardConfirmationHost />
    {kind === "post" ? (
      <PostEditor
        {...(create ? { mode: "create" } : { mode: "edit", post: record })}
      />
    ) : (
      <ProjectEditor
        {...(create ? { mode: "create" } : { mode: "edit", project: record })}
      />
    )}
  </>,
);
