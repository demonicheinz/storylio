import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const bundle = await build({
  entryPoints: ["tests/fixtures/webgl-lifecycle/app.jsx"],
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "optional-baseline",
      setup(builder) {
        if (!process.argv.includes("--baseline")) return;
        builder.onLoad(
          { filter: /(?:gooey-nav|live-orb)\.tsx$/ },
          async ({ path }) => ({
            contents: await readFile(
              resolve(
                ".tmp/webgl-lifecycle/baseline",
                path.endsWith("gooey-nav.tsx")
                  ? "gooey-nav.tsx"
                  : "live-orb.tsx",
              ),
              "utf8",
            ),
            loader: "tsx",
            resolveDir: resolve(path, ".."),
          }),
        );
      },
    },
    {
      name: "next-link",
      setup(builder) {
        builder.onResolve({ filter: /^next\/link$/ }, () => ({
          path: "link",
          namespace: "fixture",
        }));
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, () => ({
          contents:
            "export default function Link({prefetch,scroll,children,...props}){return <a {...props}>{children}</a>;}",
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const css = await postcss([tailwind()]).process(
  await readFile("src/app/globals.css", "utf8"),
  { from: resolve("src/app/globals.css") },
);
const html =
  '<!doctype html><html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0;background:#07111d;color:#eaf5fc"><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer((request, response) => {
  const script = request.url === "/app.js";
  const style = request.url === "/style.css";
  response.writeHead(200, {
    "Content-Type": script
      ? "text/javascript"
      : style
        ? "text/css"
        : "text/html",
    "Cache-Control": "no-store",
  });
  response.end(script ? bundle.outputFiles[0].text : style ? css.css : html);
});
const port = process.argv.includes("--baseline") ? 3213 : 3212;
server.listen(port, "127.0.0.1", () =>
  console.log(
    `WebGL lifecycle fixture http://127.0.0.1:${port} PID ${process.pid}`,
  ),
);
