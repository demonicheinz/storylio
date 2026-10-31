import { createServer } from "node:http";
import { build } from "esbuild";

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
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "mock-renderer",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, ({ path }) =>
          mocks[path] ? { path, namespace: "fixture" } : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, ({ path }) => ({
          contents: mocks[path],
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
        builder.onLoad({ filter: /\.module\.css$/ }, () => ({
          contents: "export default {};",
          loader: "js",
        }));
      },
    },
  ],
});
const html =
  '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="root"></div><script src="/app.js"></script></body></html>';
createServer((request, response) => {
  const script = request.url === "/app.js";
  response.writeHead(200, {
    "Content-Type": script ? "text/javascript" : "text/html",
    "Cache-Control": "no-store",
  });
  response.end(script ? bundle.outputFiles[0].text : html);
}).listen(3214, "127.0.0.1", () =>
  console.log(`Venom wrapper fixture http://127.0.0.1:3214 PID ${process.pid}`),
);
