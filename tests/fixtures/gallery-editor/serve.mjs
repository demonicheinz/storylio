import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "@/features/dashboard/gallery/actions": `
    async function save(values,id){
      const fixture=window.galleryEditor;
      fixture.calls.push({values,id});
      if(fixture.deferSave)await new Promise(resolve=>fixture.releaseSave=resolve);
      if(fixture.saveResult==='transport')throw new Error('Fixture transport failure');
      if(fixture.saveResult==='field')return {success:false,error:'Check the highlighted fields.',fieldErrors:{caption:['Fixture caption rejected.'],category:['Fixture category rejected.'],altText:['Fixture alt text rejected.'],description:['Fixture description rejected.'],imageUrl:['Fixture image rejected.']}};
      return {success:true,message:'Fixture saved.'};
    }
    export const actionCreateGalleryItem=values=>save(values);
    export const actionUpdateGalleryItem=(id,values)=>save(values,id);
  `,
  "@/features/dashboard/shared/utils/upload": `export async function uploadFile(){const f=window.galleryEditor;f.uploadCalls++;await new Promise(resolve=>f.releaseUpload=resolve);if(f.failUpload)throw new Error('Fixture upload failed.');return {url:location.origin+'/fixture.svg',width:12,height:8,size:100,aspectRatio:1.5};}`,
  "next/navigation": `export const usePathname=()=>location.pathname;export const useRouter=()=>({refresh(){window.galleryEditor.refreshes++;}});`,
  "next/image": `export default function Image({src,unoptimized,fill,priority,...props}){return <img src={typeof src==='string'?src:src.src} {...props} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%',...props.style}:props.style}/>;}`,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/gallery-editor/app.jsx"],
  bundle: true,
  write: false,
  outfile: "app.js",
  format: "iife",
  jsx: "automatic",
  loader: { ".woff2": "dataurl", ".woff": "dataurl", ".ttf": "dataurl" },
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
          contents: `export default {src:${JSON.stringify("data:image/svg+xml;base64," + Buffer.from(await readFile(args.path)).toString("base64"))}};`,
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
  '<!doctype html><html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0"><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer(async (req, res) => {
  const path = req.url?.split("?")[0];
  if (path === "/fixture.svg") {
    res.writeHead(200, { "Content-Type": "image/svg+xml" });
    res.end(
      '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="8"><rect width="12" height="8" fill="#1479c8"/></svg>',
    );
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
              `@font-face{font-family:Satoshi;src:url(/satoshi.woff2)}@font-face{font-family:Clash;src:url(/clash.woff2)}:root{--font-satoshi:Satoshi;--font-clash-display:Clash}body{font-family:Satoshi,sans-serif}h1{font-family:Clash,sans-serif}`,
          ]
        : ["text/html", html];
  res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
  res.end(body);
});
server.listen(3207, "127.0.0.1", () =>
  console.log(
    `Gallery editor fixture http://127.0.0.1:3207 PID ${process.pid}`,
  ),
);
