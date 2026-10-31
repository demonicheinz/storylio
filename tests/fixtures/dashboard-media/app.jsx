import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toast";
import { MediaLibraryClient } from "@/features/dashboard/media/components/media-client";
import { DashboardConfirmationHost } from "@/features/dashboard/shared/components/confirmation-dialog";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

window.mediaRows = Array.from({ length: 85 }, (_, i) => ({
  id: `media-${i}`,
  url: `${location.origin}/fixture-image.svg?image=${i}`,
  publicId: `fixture/${i}`,
  filename:
    i === 0
      ? "long-descriptive-filename-for-an-interface-design-image-with-context.webp"
      : `image-${String(i).padStart(3, "0")}.${["webp", "png", "jpg"][i % 3]}`,
  size: 160000 + i * 1024,
  format: ["webp", "png", "jpg"][i % 3],
  width: 1200,
  height: 800,
  aspectRatio: 1.5,
  blurDataUrl: null,
  createdAt: new Date(Date.UTC(2026, 5, 18 - i)),
}));
window.mediaCalls = [];
createRoot(document.getElementById("root")).render(
  <>
    <DashboardConfirmationHost />
    {
      <Toaster>
        <main
          className={shell.shell}
          style={{ maxWidth: 1280, margin: "auto", padding: 16 }}
        >
          <MediaLibraryClient initialMedia={window.mediaRows} />
          <a
            className="inline-flex items-center mt-6 min-h-11 text-link"
            href="/elsewhere"
          >
            Leave library fixture
          </a>
        </main>
      </Toaster>
    }
  </>,
);
