import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "next/navigation": "export const usePathname=()=>location.pathname;",
  "../actions":
    "const before=async(name,ids=[])=>{window.mediaCalls.push({name,ids});if(window.mediaReject===name)throw Error('Fixture transport failure');if(window.mediaHold===name)await new Promise(resolve=>window.mediaRelease=resolve);return window.mediaFailure===name?{success:false,error:'Fixture action failed.'}:null;};export const actionCheckMediaUsage=async ids=>{const error=await before('usage',ids);if(error)return error;return {success:true,data:{canDelete:window.mediaRows.filter(item=>ids.includes(item.id)&&Number(item.id.split('-')[1])%3!==0).map(item=>({id:item.id,filename:item.filename,references:[]})),blocked:window.mediaRows.filter(item=>ids.includes(item.id)&&Number(item.id.split('-')[1])%3===0).map(item=>({id:item.id,filename:item.filename,references:[{label:'post cover',count:1}]}))}};};export const actionRenameMedia=async(id,filename)=>{const error=await before('rename',[id]);return error??{success:true,data:{id,filename}};};export const actionDeleteMedia=async id=>{const error=await before('delete',[id]);if(error)return error;if(Number(id.split('-')[1])%3===0)return {success:false,error:'Media is still in use by 1 post cover.'};return {success:true};};export const actionDeleteMediaBatch=async ids=>{const error=await before('batch',ids);if(error)return error;const failedIds=window.mediaFailedIds??[];return {success:true,data:{deletedIds:ids.filter(id=>!failedIds.includes(id)),failedItems:window.mediaRows.filter(item=>ids.includes(item.id)&&failedIds.includes(item.id)).map(item=>({id:item.id,filename:item.filename,error:'Fixture provider failure'}))}};};",
  "next/image":
    "export default function Image({src,fill,priority,unoptimized,...props}){return <img src={typeof src==='string'?src:src.src} {...props} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%',...props.style}:props.style}/>}",
};
const bundle = await build({
  entryPoints: ["tests/fixtures/dashboard-media/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "review-fixture",
      setup(b) {
        b.onResolve({ filter: /.*/ }, (a) => {
          const path =
            a.path === "./actions" &&
            a.importer.endsWith("use-media-deletion.ts")
              ? "../actions"
              : a.path;
          return replacements[path]
            ? { path, namespace: "fixture" }
            : undefined;
        });
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          contents: replacements[a.path],
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
        b.onLoad({ filter: /\.svg$/ }, async (a) => ({
          contents: `export default {src:${JSON.stringify(`data:image/svg+xml;base64,${Buffer.from(await readFile(a.path)).toString("base64")}`)}};`,
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
const styles = bundle.outputFiles
  .filter((f) => f.path.endsWith(".css"))
  .map((f) => f.text)
  .join("\n");
const js = bundle.outputFiles.find((f) => f.path.endsWith(".js")).text;
createServer(async (req, res) => {
  const path = req.url?.split("?")[0];
  if (path === "/fixture-image.svg") {
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="#eff6fa"/><circle cx="600" cy="400" r="280" fill="#1479c8"/></svg>',
    );
    return;
  }
  if (path?.startsWith("/api/")) {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Fixture request failed. Try again." }));
    return;
  }
  const fonts = {
    "/satoshi.woff2": "Satoshi-Variable.woff2",
    "/clash.woff2": "ClashDisplay-Variable.woff2",
  };
  if (fonts[path]) {
    res.writeHead(200, { "Content-Type": "font/woff2" });
    res.end(await readFile(resolve("src/assets/fonts", fonts[path])));
    return;
  }
  const [type, body] =
    path === "/app.js"
      ? ["text/javascript", js]
      : path === "/style.css"
        ? [
            "text/css",
            css.css +
              styles +
              "@font-face{font-family:Satoshi;src:url(/satoshi.woff2)}@font-face{font-family:Clash;src:url(/clash.woff2)}:root{--font-satoshi:Satoshi;--font-clash-display:Clash}body{font-family:Satoshi,sans-serif}",
          ]
        : [
            "text/html",
            '<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0"><div id="root"></div><script src="/app.js"></script></body></html>',
          ];
  res.writeHead(200, { "Content-Type": type });
  res.end(body);
}).listen(3201, "127.0.0.1", () =>
  console.log(`Media fixture http://127.0.0.1:3201 PID ${process.pid}`),
);
