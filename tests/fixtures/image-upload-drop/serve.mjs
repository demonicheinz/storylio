import { createServer } from "node:http";
import { build } from "esbuild";

const replacements = {
  "next/image": `export default function Image({src,fill,priority,...props}){return <img src={src} {...props}/>;}`,
  "@/features/dashboard/shared/utils/upload": `export function uploadFile(){window.uploadFixture.calls++;return new Promise(resolve=>window.uploadFixture.resolve=()=>resolve({url:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZ1sAAAAASUVORK5CYII=',width:1,height:1,size:68,aspectRatio:1,blurDataUrl:null}));}`,
};
const result = await build({
  entryPoints: ["tests/fixtures/image-upload-drop/app.jsx"],
  bundle: true,
  write: false,
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
      },
    },
  ],
});
const html =
  '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer((req, res) => {
  const script = req.url === "/app.js";
  res.writeHead(200, {
    "Content-Type": script ? "text/javascript" : "text/html",
  });
  res.end(script ? result.outputFiles[0].text : html);
});
server.listen(3196, "127.0.0.1", () =>
  console.log(`Upload fixture http://127.0.0.1:3196 PID ${process.pid}`),
);
