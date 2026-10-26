import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Heading, type HeadingProps } from "@/components/common/heading";

const cases = [
  {
    name: "title and text children",
    props: { title: "Build", children: "together" },
    text: "Build together",
  },
  {
    name: "title, highlight and element children",
    props: {
      title: "Build",
      highlight: "something",
      children: createElement("em", null, "together"),
    },
    text: "Build something together",
  },
  {
    name: "numeric zero children",
    props: { title: "Projects", children: 0 },
    text: "Projects 0",
  },
  { name: "children only", props: { children: "Work" }, text: "Work" },
  { name: "title only", props: { title: "Work" }, text: "Work" },
  {
    name: "null children",
    props: { title: "Work", children: null },
    text: "Work",
  },
] satisfies Array<{ name: string; props: HeadingProps; text: string }>;

describe("section heading text", () => {
  it.each(cases)("separates $name correctly", ({ props, text }) => {
    const html = renderToStaticMarkup(
      createElement(Heading, { variant: "section", ...props }),
    );
    expect(html.replace(/<[^>]*>/g, "")).toBe(text);
  });
});
