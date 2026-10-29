import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { ToastProvider } from "@/components/ui/toast";
import { GalleryItemDialog } from "@/features/dashboard/gallery/components/gallery-item-dialog";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";
import shell from "@/features/dashboard/shell/dashboard-shell.module.css";

window.galleryEditor = {
  calls: [],
  uploadCalls: 0,
  refreshes: 0,
  saveResult: "transport",
};
const original = {
  id: "fixture-item",
  imageUrl: `${location.origin}/fixture.svg`,
  caption: "Original caption",
  altText: "Blue rectangle",
  description: "Original description",
  category: "Interface",
  width: 12,
  height: 8,
  size: 100,
  aspectRatio: 1.5,
  blurDataUrl: null,
  isVisible: true,
  order: 7,
  createdAt: "2026-01-01T00:00:00.000Z",
};
function Fixture() {
  const [item, setItem] = useState(original);
  window.galleryEditor.updateItem = (changes) =>
    setItem((current) => ({ ...current, ...changes }));
  return (
    <ToastProvider>
      <main className={shell.shell} style={{ padding: 24 }}>
        <GalleryItemDialog
          item={item}
          categories={["Interface", "Texture", "Interface"]}
          trigger={<Button>Edit fixture</Button>}
        />
        <GalleryItemDialog trigger={<Button>Add fixture</Button>} />
        <section aria-label="Legacy upload caller">
          <ImageUpload onChange={() => {}} />
        </section>
      </main>
    </ToastProvider>
  );
}
createRoot(document.getElementById("root")).render(<Fixture />);
