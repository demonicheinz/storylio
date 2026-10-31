import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "next/dynamic": `import React,{lazy,Suspense} from 'react'; export default function dynamic(load){const Component=lazy(()=>load().then(defaultExport=>({default:defaultExport})));return props=><Suspense fallback={<p>Loading editor...</p>}><Component {...props}/></Suspense>}`,
  "@/features/dashboard/projects/actions": `
  const record=(name,args)=>{window.projectCalls??=[];window.projectCalls.push({name,args});};
  export async function actionSaveProjectDraft(payload,id){record('draft',[payload,id]);if(window.failProjectSave)return {success:false,error:'Fixture save failed'};return {success:true,data:{id:id??'created',slug:payload.slug,status:'draft'}};}
  export async function actionPublishProject(payload,id){record('publish',[payload,id]);return {success:true,data:{id:id??'created',slug:payload.slug,status:'published'}};}
  export async function actionAutosaveProject(payload,id){record('autosave',[payload,id]);return {success:true,data:{id,slug:payload.slug,status:window.editorStatus??'draft'}};}
  export async function actionReorderProjects(input){record('reorder',[input]);return window.failProjectReorder?{success:false,error:'Fixture reorder failed'}:{success:true};}
  export async function actionPublishProjects(ids){record('batchPublish',[ids]);return {success:true,data:{count:ids.length}};}
  export async function actionMoveProjectsToDraft(ids){record('batchDraft',[ids]);return {success:true,data:{count:ids.length}};}
  export async function actionDeleteProjects(ids){record('batchDelete',[ids]);return {success:true,data:{count:ids.length}};}
  export async function actionDeleteProject(id){record('delete',[id]);return {success:true};}
  `,
  "@/features/dashboard/shared/utils/upload": `export async function uploadFile(file){window.fixtureUploadCount=(window.fixtureUploadCount??0)+1;await new Promise(resolve=>window.releaseFixtureUpload=resolve);return {url:'https://example.test/'+file.name,width:1280,height:720}}`,
  "@/features/dashboard/shared/hooks/use-dashboard-filter": `import {useState} from "react";export function useDashboardFilter(key,options,fallback){return useState(fallback)}`,
  "next/navigation": `export const usePathname=()=>'/dashboard/projects';export const useRouter=()=>({push(){},replace(url){window.projectReplacement=url;},refresh(){}});`,
  "next/link": `export default function Link({children,...props}){return <a {...props}>{children}</a>;}`,
  "next/image": `export default function Image({src,unoptimized,fill,priority,...props}){return <img src={typeof src==='string'?src:src.src} {...props} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%',...props.style}:props.style}/>;}`,
  "@/lib/auth-client": `export const authClient={useSession:()=>({data:{user:{name:'Example owner',email:'owner@example.test',image:null}}}),signOut:async()=>({})};`,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/dashboard-projects/app.jsx"],
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
          args.path === "../actions" && args.importer.includes("projects")
            ? {
                path: "@/features/dashboard/projects/actions",
                namespace: "fixture",
              }
            : replacements[args.path]
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
  '<!doctype html><html class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="margin:0"><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer(async (req, res) => {
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
              `@font-face{font-family:Satoshi;src:url(/satoshi.woff2)}@font-face{font-family:Clash;src:url(/clash.woff2)}:root{--font-satoshi:Satoshi;--font-clash-display:Clash}body{font-family:Satoshi,sans-serif}h1{font-family:Clash,sans-serif}`,
          ]
        : ["text/html", html];
  res.writeHead(200, { "Content-Type": `${type}; charset=utf-8` });
  res.end(body);
});
server.listen(3197, "127.0.0.1", () =>
  console.log(
    `Projects review fixture http://127.0.0.1:3197 PID ${process.pid}`,
  ),
);
