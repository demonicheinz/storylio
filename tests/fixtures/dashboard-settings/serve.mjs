import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const stubs = {
  "next/navigation":
    "export const useRouter=()=>({refresh(){},push(){},replace(){}});export const useSearchParams=()=>new URLSearchParams(location.search);",
  "./auth-flow":
    "export function AuthFormHeading({title,description,children}){return <section style={{maxWidth:400,margin:'auto'}}><h1>{title}</h1><p>{description}</p>{children}</section>}",
  "next/image":
    "export default function Image({src,fill,priority,unoptimized,...props}){return <img src={typeof src==='string'?src:src.src} {...props} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%',...props.style}:props.style}/>}",
};
const result = await build({
  entryPoints: ["tests/fixtures/dashboard-settings/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "settings-review",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (a) =>
          [
            "@/lib/auth-client",
            "@/features/dashboard/settings/actions",
          ].includes(a.path)
            ? {
                path: resolve(
                  "tests/fixtures/dashboard-settings/auth-mock.jsx",
                ),
              }
            : stubs[a.path]
              ? { path: a.path, namespace: "mock" }
              : undefined,
        );
        b.onLoad({ filter: /.*/, namespace: "mock" }, (a) => ({
          contents: stubs[a.path],
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
        b.onLoad({ filter: /\.svg$/ }, async (a) => ({
          contents: `export default {src:${JSON.stringify("data:image/svg+xml;base64," + Buffer.from(await readFile(a.path)).toString("base64"))}}`,
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
const script = result.outputFiles.find((x) => x.path.endsWith(".js")).text;
const styles =
  css.css +
  result.outputFiles
    .filter((x) => x.path.endsWith(".css"))
    .map((x) => x.text)
    .join("\n") +
  "@font-face{font-family:Satoshi;src:url(/satoshi.woff2)}@font-face{font-family:Clash;src:url(/clash.woff2)}:root{--font-satoshi:Satoshi;--font-clash-display:Clash}body{font-family:Satoshi,sans-serif}";
createServer(async (req, res) => {
  const path = req.url?.split("?")[0];
  if (path === "/avatar.svg") {
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#068ce6"/></svg>',
    );
    return;
  }
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
            '<!doctype html><html class="dark"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body style="margin:0"><div id="root"></div><script src="/app.js"></script></body></html>',
          ];
  res.writeHead(200, { "Content-Type": type });
  res.end(body);
}).listen(3203, "127.0.0.1", () =>
  console.log("Settings fixture http://127.0.0.1:3203; stop Ctrl+C"),
);
