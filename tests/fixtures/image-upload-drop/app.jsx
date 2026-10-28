import { createRoot } from "react-dom/client";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";

window.uploadFixture = { calls: 0, events: [], resolve: null, disabled: false };
for (const type of ["dragenter", "dragover", "drop"])
  document.addEventListener(type, (event) => {
    queueMicrotask(() =>
      window.uploadFixture.events.push({
        type,
        trusted: event.isTrusted,
        prevented: event.defaultPrevented,
      }),
    );
  });
createRoot(document.getElementById("root")).render(
  <main style={{ maxWidth: 400, margin: 40 }}>
    <h1>Upload drop fixture</h1>
    <ImageUpload onChange={() => {}} />
  </main>,
);
