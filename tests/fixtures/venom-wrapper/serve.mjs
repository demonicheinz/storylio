import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const real = process.argv.includes("--real");

const mocks = {
  "next/link":
    "export default function Link({children,...props}){return <a {...props}>{children}</a>;}",
  "@/components/effects/venom/engine": `
    export async function prepareVenomAssets(){window.venomFixture.preparations++;if(window.venomFixture.pending)await new Promise(resolve=>window.venomFixture.release=resolve);}
    export function createVenomScene(canvas,link){const state=window.venomFixture;state.created++;if(state.mode==='throw')throw Error('Fixture init failure');if(state.mode==='null')return null;let disposed=false;link.dataset.venomReady='true';return {pause(){},resume(){},dispose(){if(disposed)return;disposed=true;state.disposed++;delete link.dataset.venomReady;}};}
  `,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/venom-wrapper/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "mock-renderer",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, ({ path }) =>
          mocks[path] && !(real && path === "@/components/effects/venom/engine")
            ? { path, namespace: "fixture" }
            : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: mocks[path],
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
        if (!real)
          builder.onLoad({ filter: /\.module\.css$/ }, () => ({
            contents: "export default {};",
            loader: "js",
          }));
      },
    },
  ],
});
const css =
  (real
    ? (
        await postcss([tailwind()]).process(
          await readFile("src/app/globals.css", "utf8"),
          { from: resolve("src/app/globals.css") },
        )
      ).css +
      "\n" +
      bundle.outputFiles
        .filter((file) => file.path.endsWith(".css"))
        .map((file) => file.text)
        .join("\n")
    : "") +
  (real
    ? '\n@font-face{font-family:Satoshi;src:url("/satoshi.woff2") format("woff2");font-weight:100 900;font-display:swap}html{--font-sans:Satoshi,sans-serif;font-family:var(--font-sans)}'
    : "");
const js = bundle.outputFiles.find((file) => file.path.endsWith(".js")).text;
const html =
  '<!doctype html><html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:#070c15;color:#edf7ff"><div id="root"></div><script src="/app.js"></script></body></html>';
createServer(async (request, response) => {
  if (request.url === "/satoshi.woff2") {
    response.writeHead(200, { "Content-Type": "font/woff2" });
    response.end(await readFile("src/assets/fonts/Satoshi-Variable.woff2"));
    return;
  }
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
  response.end(script ? js : style ? css : html);
}).listen(real ? 3215 : 3214, "127.0.0.1", () =>
  console.log(
    `Venom wrapper fixture http://127.0.0.1:${real ? 3215 : 3214} PID ${process.pid}`,
  ),
);
