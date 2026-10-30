import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "@/features/dashboard/gallery/actions":
    "const run=async(name,ids=[],payload)=>{window.galleryCalls.push({name,ids,payload});if(window.galleryReject===name)throw Error('Fixture transport failure');if(window.galleryDelay===name)await new Promise(resolve=>window.galleryRelease=resolve);if(window.galleryFail===name)return {success:false,error:'Fixture action failed.'};let rows=window.galleryRows;if(name==='update')rows=rows.map(item=>item.id===ids[0]?{...item,...payload}:item);if(name==='create')rows=[...rows,{...payload,id:'created-image',order:Math.max(...rows.map(item=>item.order))+1,createdAt:new Date().toISOString()}];if(name==='delete')rows=rows.filter(item=>!ids.includes(item.id));if(name==='show'||name==='hide')rows=rows.map(item=>ids.includes(item.id)?{...item,isVisible:name==='show'}:item);if(name==='reorder')rows=rows.map(item=>({...item,order:payload.find(row=>row.id===item.id).order})).sort((a,b)=>a.order-b.order);window.galleryRows=rows;return {success:true,data:name==='create'||name==='update'?{id:ids[0]??'created-image'}:{count:ids.length}};};export const actionCreateGalleryItem=payload=>run('create',[],payload),actionUpdateGalleryItem=(id,payload)=>run('update',[id],payload),actionDeleteGalleryItem=id=>run('delete',[id]),actionDeleteGalleryItems=ids=>run('delete',ids),actionHideGalleryItems=ids=>run('hide',ids),actionShowGalleryItems=ids=>run('show',ids),actionReorderGalleryItems=payload=>run('reorder',[],payload);",
  "@/features/dashboard/shared/utils/upload":
    "export async function uploadFile(file){window.galleryCalls.push({name:'upload',filename:file.name});if(window.galleryDelay==='upload')await new Promise(resolve=>window.galleryRelease=resolve);return {id:'upload-fixture',url:window.fixtureCover,width:1200,height:800,size:file.size,aspectRatio:1.5,blurDataUrl:null};}",
  "@/features/dashboard/shared/hooks/use-dashboard-filter": `import {useState} from 'react';export function useDashboardFilter(key,options,fallback){return useState(fallback)}`,
  "next/navigation": `export const usePathname=()=>'/dashboard/gallery';export const useRouter=()=>({push(){},replace(){},refresh(){window.galleryRefresh?.()}});`,
  "next/link": `export default function Link({children,...props}){return <a {...props}>{children}</a>}`,
  "next/image": `export default function Image({src,fill,unoptimized,priority,...props}){return <img src={typeof src==='string'?src:src.src} {...props} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%',...props.style}:props.style}/>}`,
  "@/lib/auth-client": `export const authClient={useSession:()=>({data:{user:{name:'Fixture owner',email:'owner@example.test'}}})};`,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/dashboard-gallery/app.jsx"],
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
        b.onResolve({ filter: /.*/ }, (a) =>
          replacements[a.path]
            ? { path: a.path, namespace: "fixture" }
            : undefined,
        );
        b.onLoad({ filter: /.*/, namespace: "fixture" }, (a) => ({
          contents: replacements[a.path],
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
        b.onLoad({ filter: /\.svg$/ }, async (a) => ({
          contents: `export default {src:${JSON.stringify("data:image/svg+xml;base64," + Buffer.from(await readFile(a.path)).toString("base64"))}};`,
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
}).listen(3199, "127.0.0.1", () =>
  console.log(
    `Gallery review fixture http://127.0.0.1:3199 PID ${process.pid}`,
  ),
);
