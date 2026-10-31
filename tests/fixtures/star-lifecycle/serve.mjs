import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const bundle = await build({
  entryPoints: ["tests/fixtures/star-lifecycle/app.jsx"],
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
});
const css = await postcss([tailwind()]).process(
  await readFile("src/app/globals.css", "utf8"),
  { from: resolve("src/app/globals.css") },
);
const html =
  '<!doctype html><html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0;background:#07111d;color:white"><div id="root"></div><script src="/app.js"></script></body></html>';
createServer((request, response) => {
  const script = request.url === "/app.js",
    style = request.url === "/style.css";
  response.writeHead(200, {
    "Content-Type": script
      ? "text/javascript"
      : style
        ? "text/css"
        : "text/html",
    "Cache-Control": "no-store",
  });
  response.end(script ? bundle.outputFiles[0].text : style ? css.css : html);
}).listen(3216, "127.0.0.1", () =>
  console.log(`Star fixture http://127.0.0.1:3216 PID ${process.pid}`),
);
