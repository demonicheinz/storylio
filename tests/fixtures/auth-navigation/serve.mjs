import { createServer } from "node:http";
import { resolve } from "node:path";
import { build } from "esbuild";

const stubs = {
  "next/navigation": `export const useRouter=()=>window.authFixture.router; export const useSearchParams=()=>new URLSearchParams(location.search);`,
  "next/link": `export default function Link({href,children,...props}) { return <a href={href} {...props}>{children}</a>; }`,
  "@/components/common/logo": `export const Logo=()=> <span>Storylio</span>;`,
  "@/components/common/profile-avatar": `export const ProfileAvatar=()=> <span aria-hidden="true"/>;`,
};
const bundle = await build({
  entryPoints: ["tests/fixtures/auth-navigation/app.jsx"],
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "auth-navigation-fixture",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, ({ path }) =>
          path === "@/lib/auth-client"
            ? { path: resolve("tests/fixtures/auth-navigation/auth-mock.jsx") }
            : stubs[path]
              ? { path, namespace: "mock" }
              : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "mock" }, ({ path }) => ({
          contents: stubs[path],
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
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>Auth navigation regression</title><body><div id="root"></div><script src="/app.js"></script></body></html>';
const server = createServer((request, response) => {
  const script = request.url === "/app.js";
  response.writeHead(200, {
    "Content-Type": script ? "text/javascript" : "text/html",
    "Cache-Control": "no-store",
  });
  response.end(script ? bundle.outputFiles[0].text : html);
});
server.listen(3204, "127.0.0.1", () => {
  console.log(`Auth fixture http://127.0.0.1:3204 (PID ${process.pid})`);
});
process.on("SIGINT", () => {
  server.close();
  server.closeAllConnections();
});
