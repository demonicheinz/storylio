import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/toast";
import { GalleryManager } from "@/features/dashboard/gallery/components/gallery-item-form";
import { DashboardConfirmationHost } from "@/features/dashboard/shared/components/confirmation-dialog";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

const cover = (width, height, color) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#eff6fa"/><circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.35}" fill="${color}"/></svg>`,
  );
window.galleryRows = Array.from({ length: 125 }, (_, i) => ({
  id: `image-${i}`,
  imageUrl: cover(
    i % 3 === 0 ? 800 : 1200,
    i % 3 === 0 ? 1200 : 800,
    ["#1479c8", "#ca4265", "#20865f"][i % 3],
  ),
  caption:
    i === 0
      ? "A quiet composition with a deliberately long caption that should remain fully readable in the preview drawer"
      : `Image ${String(i + 1).padStart(3, "0")}`,
  category: ["Moodboard", "Texture", "Interface", "Life"][i % 4],
  description: `Image ${i + 1}: a synthetic composition for responsive management checks.`,
  altText: `Circle composition ${i + 1}`,
  width: i % 3 === 0 ? 800 : 1200,
  height: i % 3 === 0 ? 1200 : 800,
  size: 160000,
  aspectRatio: i % 3 === 0 ? 2 / 3 : 1.5,
  blurDataUrl: null,
  isVisible: i % 4 !== 3,
  order: i,
  createdAt: new Date(Date.UTC(2026, 5, 18 + i)).toISOString(),
}));
window.galleryCalls = [];
window.fixtureCover = cover(1200, 800, "#1479c8");
function Fixture() {
  const [items, setItems] = useState(window.galleryRows);
  window.galleryRefresh = () => setItems([...window.galleryRows]);
  return (
    <Toaster>
      <main
        className={shell.shell}
        style={{ maxWidth: 1280, margin: "auto", padding: 16 }}
      >
        <GalleryManager items={items} />
      </main>
    </Toaster>
  );
}
createRoot(document.getElementById("root")).render(
  <>
    <DashboardConfirmationHost />
    {<Fixture />}
  </>,
);
