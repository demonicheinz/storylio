import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "next/navigation": `export const usePathname=()=>'/dashboard/about';export const useRouter=()=>({push(){},refresh(){}});`,
  "next/link": `export default function Link({children,...props}){return <a {...props}>{children}</a>;}`,
  "next/image": `export default function Image({src,unoptimized,fill,priority,...props}){return <img src={typeof src==='string'?src:src.src} {...props}/>;}`,
  "@/lib/auth-client": `export const authClient={useSession:()=>({data:{user:{name:'Example owner',email:'owner@example.test',image:null}}}),signOut:async()=>({})};`,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/sidebar-layout/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "fixture",
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
          contents: `export default {src:${JSON.stringify(`data:image/svg+xml;base64,${Buffer.from(await readFile(args.path)).toString("base64")}`)}};`,
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
const styles = bundle.outputFiles
  .filter((f) => f.path.endsWith(".css"))
  .map((f) => f.text)
  .join("\n");
const html =
  '<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0"><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer((req, res) => {
  const path = req.url?.split("?")[0];
  const [type, body] =
    path === "/app.js"
      ? ["text/javascript", js]
      : path === "/style.css"
        ? ["text/css", css.css + styles]
        : ["text/html", html];
  res.writeHead(200, { "Content-Type": type });
  res.end(body);
});
server.listen(3195, "127.0.0.1", () =>
  console.log(`Sidebar fixture http://127.0.0.1:3195 PID ${process.pid}`),
);
