import { useState } from "react";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";

const image = (color) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="${color}"/></svg>`,
  );
const first = image("#0c364e");
const second = image("#22567c");

export function CoversFixture() {
  const [src, setSrc] = useState(null);
  const [appearance, setAppearance] = useState("home");
  return (
    <main className="p-4 md:p-8">
      <div className="flex flex-wrap gap-4 mb-6">
        <button type="button" onClick={() => setSrc(first)}>
          First image
        </button>
        <button type="button" onClick={() => setSrc(second)}>
          Second image
        </button>
        <button
          type="button"
          onClick={() => setSrc("data:image/png;base64,broken")}
        >
          Broken image
        </button>
        <button type="button" onClick={() => setSrc(null)}>
          Clear image
        </button>
        <button
          type="button"
          onClick={() =>
            setAppearance((value) => (value === "home" ? "default" : "home"))
          }
        >
          Change appearance
        </button>
      </div>
      <div className="flex flex-col gap-8">
        <section data-cover-kind="blog" className="w-full max-w-60">
          <BlogCover
            src={src}
            alt="Blog fixture cover"
            className="aspect-video"
            appearance={appearance}
          />
        </section>
        <section data-cover-kind="project" className="w-full max-w-60">
          <ProjectCover
            src={src}
            alt="Project fixture cover"
            className="aspect-video"
            appearance={appearance}
          />
        </section>
      </div>
    </main>
  );
}
