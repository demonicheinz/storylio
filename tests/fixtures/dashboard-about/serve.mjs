import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

import { getMdxSafetyError } from "../../../src/lib/mdx-safety";

const actionNames = [
  "CreateWorkExperience",
  "UpdateWorkExperience",
  "DeleteWorkExperience",
  "ReorderWorkExperiences",
  "CreateEducation",
  "UpdateEducation",
  "DeleteEducation",
  "ReorderEducationItems",
  "CreateSkill",
  "UpdateSkill",
  "DeleteSkill",
  "ReorderSkills",
  "CreateSkillCategory",
  "UpdateSkillCategory",
  "DeleteSkillCategory",
  "ReorderSkillCategories",
];
const replacements = {
  "next/dynamic": `import React,{lazy,Suspense} from 'react'; export default function dynamic(load){const Component=lazy(()=>load().then(defaultExport=>({default:defaultExport})));return props=><Suspense fallback={<p>Loading editor...</p>}><Component {...props}/></Suspense>}`,
  "@/features/dashboard/about/actions": `export async function actionUpdateAboutContent(values){const response=await fetch("/validate-content",{method:"POST",body:JSON.stringify(values)});const result=await response.json();if(result.success)window.aboutSaved=values;return result;}`,
  "@/features/dashboard/about/structured-actions": actionNames
    .map((name) =>
      `export async function action${name}(...args){ window.aboutLastAction={name:'${name}',args}; if(name.startsWith('Reorder')&&window.failAboutReorder)return {success:false,error:'Fixture reorder failure'}; return {success:true,message:'Saved.'}; }`.replace(
        "if(name.startsWith",
        `if('${name}'.startsWith`,
      ),
    )
    .join("\n"),
  "next/navigation": `export const usePathname=()=>'/dashboard/about';export const useRouter=()=>({push(){},refresh(){}});`,
  "next/link": `export default function Link({children,...props}){return <a {...props}>{children}</a>;}`,
  "next/image": `export default function Image({src,unoptimized,fill,priority,...props}){return <img src={typeof src==='string'?src:src.src} {...props}/>;}`,
  "@/lib/auth-client": `export const authClient={useSession:()=>({data:{user:{name:'Example owner',email:'owner@example.test',image:null}}}),signOut:async()=>({})};`,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/dashboard-about/app.jsx"],
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
  if (path === "/validate-content" && req.method === "POST") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const values = JSON.parse(body);
    const fieldErrors = {};
    for (const field of [
      "howIWorkEn",
      "howIWorkId",
      "whatIValueEn",
      "whatIValueId",
    ]) {
      const error = await getMdxSafetyError(values[field] ?? "");
      if (error) fieldErrors[field] = [error];
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        Object.keys(fieldErrors).length
          ? {
              success: false,
              error: "Please fix the highlighted fields.",
              fieldErrors,
            }
          : { success: true, message: "About saved." },
      ),
    );
    return;
  }
  if (path === "/markdown-smoke.md") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(await readFile("tests/fixtures/mdx/markdown-smoke.md"));
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
server.listen(3196, "127.0.0.1", () =>
  console.log(`About fixture http://127.0.0.1:3196 PID ${process.pid}`),
);
