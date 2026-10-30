import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "../actions":
    "export const actionRefreshUmamiAnalytics=()=>window.analyticsRefresh();",
  "next/link":
    "export default function Link({href,children,prefetch,...props}){return <a href={href} {...props}>{children}</a>}",
};
const bundle = await build({
  entryPoints: ["tests/fixtures/dashboard-analytics/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "analytics-fixture",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (args) =>
          replacements[args.path]
            ? { path: args.path, namespace: "fixture" }
            : undefined,
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: replacements[args.path],
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
const script = bundle.outputFiles.find((file) =>
  file.path.endsWith(".js"),
).text;
const styles =
  css.css +
  bundle.outputFiles
    .filter((file) => file.path.endsWith(".css"))
    .map((file) => file.text)
    .join("\n") +
  "@font-face{font-family:Satoshi;src:url(/satoshi.woff2)}@font-face{font-family:Clash;src:url(/clash.woff2)}:root{--font-satoshi:Satoshi;--font-clash-display:Clash}body{font-family:Satoshi,sans-serif}";
createServer(async (req, res) => {
  const path = req.url?.split("?")[0];
  if (path === "/satoshi.woff2" || path === "/clash.woff2") {
    res.writeHead(200, { "Content-Type": "font/woff2" });
    res.end(
      await readFile(
        resolve(
          "src/assets/fonts",
          path === "/satoshi.woff2"
            ? "Satoshi-Variable.woff2"
            : "ClashDisplay-Variable.woff2",
        ),
      ),
    );
    return;
  }
  const [type, body] =
    path === "/app.js"
      ? ["text/javascript", script]
      : path === "/style.css"
        ? ["text/css", styles]
        : [
            "text/html",
            '<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0"><div id="root"></div><script src="/app.js"></script></body></html>',
          ];
  res.writeHead(200, { "Content-Type": type });
  res.end(body);
}).listen(3202, "127.0.0.1", () =>
  console.log(
    `Analytics fixture http://127.0.0.1:3202 PID ${process.pid}; stop with Ctrl+C`,
  ),
);
