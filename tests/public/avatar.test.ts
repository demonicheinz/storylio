import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LiveOrb } from "@/components/common/live-orb";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { resolveAvatarSource } from "@/lib/avatar";

describe("avatar source", () => {
  it.each([undefined, null, "", "   "])("uses the default for %s", (source) => {
    expect(resolveAvatarSource(source)).toBeUndefined();
  });

  it.each([
    "/images/heinz.jpg",
    "/images/heinz.jpg?v=2",
    "https://heinz.id/images/heinz.jpg",
    "https://heinz.id/images/%68einz.jpg?download=1",
  ])("does not request the removed portrait at %s", (source) => {
    expect(resolveAvatarSource(source)).toBeUndefined();
  });

  it("preserves an uploaded avatar", () => {
    const source =
      "https://res.cloudinary.com/storylio/image/upload/avatar.webp";
    expect(resolveAvatarSource(` ${source} `)).toBe(source);
  });
});

describe("static avatar orb", () => {
  it.each([null, "/images/heinz.jpg"])(
    "renders the shared fallback for %s",
    (src) => {
      const html = renderToStaticMarkup(
        createElement(ProfileAvatar, { src, name: "Heinz" }),
      );
      expect(html).toContain('aria-label="Heinz avatar"');
      expect(html).not.toContain("<img");
      expect(html).not.toContain("<canvas");
    },
  );

  it("renders an accessible face without a WebGL canvas", () => {
    const html = renderToStaticMarkup(
      createElement(LiveOrb, {
        animated: false,
        size: 32,
        label: "Heinz avatar",
      }),
    );

    expect(html).not.toContain("<canvas");
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Heinz avatar"');
    expect(html).toContain("var(--foreground)");
    expect(html).toContain("var(--background)");
    expect(html).toContain("width:32px");
  });

  it("keeps custom colors in the static fallback", () => {
    const html = renderToStaticMarkup(
      createElement(LiveOrb, {
        animated: false,
        variant: "custom",
        color: "#f2fbfe",
        eyeColor: "#000b27",
      }),
    );
    expect(html).not.toContain("<canvas");
    expect(html).toContain("#f2fbfe");
    expect(html).toContain("#000b27");
  });
});
