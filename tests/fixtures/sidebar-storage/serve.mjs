import { createServer } from "node:http";
import { build } from "esbuild";

const bundle = await build({
  entryPoints: ["tests/fixtures/sidebar-storage/app.jsx"],
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "sidebar-fixture-css",
      setup(builder) {
        builder.onLoad({ filter: /\.module\.css$/ }, () => ({
          contents: "export default {};",
          loader: "js",
        }));
      },
    },
  ],
});
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Sidebar storage regression</title></head><body><div id="root"></div><script src="/app.js"></script></body></html>`;
const server = createServer((request, response) => {
  const script = request.url === "/app.js";
  response.writeHead(200, {
    "Content-Type": script ? "text/javascript" : "text/html",
    "Cache-Control": "no-store",
  });
  response.end(script ? bundle.outputFiles[0].text : html);
});
server.listen(3198, "127.0.0.1", () => {
  console.log(`Sidebar fixture: http://127.0.0.1:3198 (PID ${process.pid})`);
});
process.on("SIGINT", () => {
  server.close();
  server.closeAllConnections();
});
