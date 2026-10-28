// Real Home UI and CSS; local fake actions only. No auth, secrets, upload, or DB.
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "next/navigation": `export const useRouter=()=>({refresh(){window.homeFixture.refreshes++;window.dispatchEvent(new Event("fixture-refresh"));},push(href){location.href=href;}});`,
  "next/link": `export default function Link({children,...props}){return <a {...props}>{children}</a>;}`,
  "next/image": `export default function Image({src,unoptimized,fill,priority,loading,...props}){return <img src={typeof src==='string'?src:src.src} {...props}/>;}`,
  "@/components/ui/toast": `export const toast={add(){}};`,
  "@/features/dashboard/shared/utils/upload": `export async function uploadFile(){throw new Error("Local fixture: upload disabled");}`,
};
for (const name of [
  "actionSetHeroHeadline",
  "actionCreateHomeSection",
  "actionUpdateHomeSection",
  "actionDeleteHomeSection",
  "actionReorderHomeSections",
]) {
  replacements["@/features/dashboard/home/actions"] =
    (replacements["@/features/dashboard/home/actions"] ?? "") +
    `export const ${name}=(...args)=>window.homeFixture.action('${name}',args);\n`;
}
const bundle = await build({
  entryPoints: ["tests/fixtures/dashboard-home/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "fixture-boundaries",
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
        b.onLoad({ filter: /\.svg$/ }, async (args) => ({
          contents: `export default {src:${JSON.stringify("data:image/svg+xml;base64," + Buffer.from(await readFile(args.path)).toString("base64"))},width:40,height:40};`,
          loader: "js",
        }));
      },
    },
  ],
});
const css = await postcss([tailwind()]).process(
  await readFile("src/app/globals.css", "utf8"),
  { from: resolve("src/app/globals.css") },
);
const js = bundle.outputFiles.find((f) => f.path.endsWith(".js")).text;
const moduleCss = bundle.outputFiles
  .filter((f) => f.path.endsWith(".css"))
  .map((f) => f.text)
  .join("\n");
const extra = `@font-face{font-family:Satoshi;src:url('/satoshi.woff2')}@font-face{font-family:Clash;src:url('/clash.woff2')}:root{--font-sans:Satoshi,sans-serif;--font-heading:Clash,sans-serif}body{margin:0}`;
const html = `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body><div id="root"></div><script src="/app.js"></script></body></html>`;
const server = createServer(async (req, res) => {
  const path = req.url?.split("?")[0];
  const [type, body] =
    path === "/app.js"
      ? ["text/javascript", js]
      : path === "/style.css"
        ? ["text/css", css.css + moduleCss + extra]
        : path === "/satoshi.woff2"
          ? [
              "font/woff2",
              await readFile("src/assets/fonts/Satoshi-Variable.woff2"),
            ]
          : path === "/clash.woff2"
            ? [
                "font/woff2",
                await readFile("src/assets/fonts/ClashDisplay-Variable.woff2"),
              ]
            : ["text/html", html];
  res.writeHead(200, { "Content-Type": type });
  res.end(body);
});
server.listen(3199, "127.0.0.1", () =>
  console.log(
    `Home fixture: http://127.0.0.1:3199 (PID ${process.pid}); stop with Ctrl+C`,
  ),
);
