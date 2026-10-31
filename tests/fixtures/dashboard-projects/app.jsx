import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ToastProvider } from "@/components/ui/toast";
import { ProjectEditor } from "@/features/dashboard/projects/components/project-editor";
import { ProjectsManager } from "@/features/dashboard/projects/components/projects-manager";
import { ScreenshotsUpload } from "@/features/dashboard/projects/components/screenshots-upload";
import { DashboardConfirmationHost } from "@/features/dashboard/shared/components/confirmation-dialog";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

const projects = Array.from({ length: 85 }, (_, i) => ({
  id: `project-${i}`,
  title:
    i === 0
      ? "Nebula Commerce with a deliberately long project name"
      : i === 1
        ? "Storylio"
        : `Project ${i}`,
  slug: `project-${i}`,
  description: "A portfolio case study for an accessible web application.",
  coverImage: null,
  thumbnailImageUrl: null,
  isFeatured: i < 2,
  status: i % 2 ? "PUBLISHED" : "DRAFT",
  techStack:
    i % 2
      ? ["React", "TypeScript", "PostgreSQL"]
      : ["Next.js", "React", "Tailwind CSS"],
  order: i,
  createdAt: new Date("2026-06-18"),
  updatedAt: new Date("2026-10-27"),
}));
const params = new URLSearchParams(location.search);
const sampleCover =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="white"/><path d="M0 0L1280 720M1280 0L0 720" stroke="#facc15" stroke-width="200"/><circle cx="640" cy="360" r="180" fill="#14b8a6"/></svg>',
  );
for (const row of projects.slice(0, 3)) row.coverImage = sampleCover;
function DrawerFixture() {
  const [open, setOpen] = useState(true);
  const direction = params.get("handle");
  return (
    <Drawer
      open={open}
      onOpenChange={setOpen}
      swipeDirection={direction}
      showSwipeHandle
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Drawer handle fixture</DrawerTitle>
          <DrawerDescription>
            Shared handle alignment and swipe behavior.
          </DrawerDescription>
        </DrawerHeader>
        <p className="p-4">Review fixture.</p>
      </DrawerContent>
    </Drawer>
  );
}
const status = params.get("editor") === "published" ? "published" : "draft";
window.editorStatus = status;
const project = {
  ...projects[1],
  id: "saved",
  title: "Saved project",
  slug: "saved-project",
  content: "Saved content.",
  contribution: "Full stack development",
  structuredScreenshots: [],
  ogImageUrl: null,
  liveUrl: null,
  githubUrl: null,
  isClosedSource: false,
  status,
};
if (params.has("media")) {
  project.coverImage =
    "data:image/svg+xml," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#243b53"/></svg>',
    );
  project.structuredScreenshots = [
    {
      id: "screen-one",
      imageUrl: project.coverImage,
      altText: "Overview screenshot",
      caption: "Overview",
      order: 0,
      width: 1280,
      height: 720,
    },
  ];
  project.structuredScreenshots.push({
    ...project.structuredScreenshots[0],
    id: "screen-two",
    altText: "Details screenshot",
    caption: "Details",
    order: 1,
  });
  project.techStack = [
    "Next.js",
    "React",
    "TypeScript",
    "Stripe",
    "Tailwind CSS",
    "PostgreSQL",
    "Prisma",
    "Cloudinary",
  ];
  project.liveUrl = "https://example.test/commerce";
  project.githubUrl = "https://github.com/example/commerce";
}
function UploadFixture() {
  const [value, setValue] = useState([]);
  const [disabled, setDisabled] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setDisabled(!disabled)}>
        Toggle disabled
      </button>
      <ScreenshotsUpload
        value={value}
        onChange={setValue}
        disabled={disabled}
      />
    </>
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
          {params.has("handle") ? (
            <DrawerFixture />
          ) : params.has("upload") ? (
            <UploadFixture />
          ) : params.has("editor") ? (
            <ProjectEditor
              mode={params.get("editor") === "create" ? "create" : "edit"}
              {...(params.get("editor") === "create" ? {} : { project })}
            />
          ) : (
            <ProjectsManager projects={projects} />
          )}
        </main>
      </ToastProvider>
    }
  </>,
);
