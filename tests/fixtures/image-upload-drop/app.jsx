import { useState } from "react";
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
const onChange = () => {};
function Fixture() {
  const [limit, setLimit] = useState(1024);
  const [label, setLabel] = useState("1 KB");
  return (
    <main style={{ maxWidth: 400, margin: 40 }}>
      <h1>Upload drop fixture</h1>
      {new URLSearchParams(location.search).has("limits") && (
        <>
          <button
            type="button"
            onClick={() => {
              setLimit(8);
              setLabel("8 bytes");
            }}
          >
            Limit 8
          </button>
          <button type="button" onClick={() => setLabel("eight bytes")}>
            Change label
          </button>
          <button
            type="button"
            onClick={() => {
              setLimit(32);
              setLabel("32 bytes");
            }}
          >
            Limit 32
          </button>
        </>
      )}
      <ImageUpload
        onChange={onChange}
        maxSizeBytes={limit}
        maxSizeLabel={label}
      />
    </main>
  );
}
createRoot(document.getElementById("root")).render(<Fixture />);
