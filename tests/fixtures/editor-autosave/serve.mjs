// Local browser fixture: real editors, React Hook Form, and Base UI; no auth or DB.
// Run: bun tests/fixtures/editor-autosave/serve.mjs
// Then: bunx --no-install playwright-cli -s=editor-autosave open http://localhost:3197 --config=playwright-cli.config.json
//       bunx --no-install playwright-cli -s=editor-autosave run-code --filename=tests/browser/editor-autosave.js
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve } from "node:path";
import tailwind from "@tailwindcss/postcss";
import { build } from "esbuild";
import postcss from "postcss";

const replacements = {
  "@/features/dashboard/shared/components/mdx-editor": `export const DashboardMdxEditor = () => null;`,
  "next/navigation": `const router = { refresh() { window.editorFixture.refreshes++; }, replace(href) { window.editorFixture.replaced = href; } }; export const usePathname=()=>location.pathname;export const useRouter = () => router;`,
  "next/link": `export default function Link(props) { return <a {...props} />; }`,
  "next/dynamic": `export default () => function Editor({value, onChange, disabled}) { return <textarea aria-label="Content" className="min-h-105 w-full text-base leading-7" value={value} onChange={e => onChange(e.target.value)} disabled={disabled} />; };`,
  "@/components/ui/toast": `export const toast = { add() {} };`,
  "@/features/dashboard/shared/components/image-upload": `export const ImageUpload = () => <p>No cover image</p>;`,
  "@/features/dashboard/projects/components/screenshots-upload": `export const ScreenshotsUpload = () => <p>No screenshots</p>;`,
  "@/features/dashboard/shared/components/date-time-picker": `export const DateTimePicker = ({value, onChange, ...props}) => <input {...props} value={value ?? ""} onChange={e => onChange(e.target.value)} />;`,
};
for (const [plural, entity] of [
  ["posts", "Post"],
  ["projects", "Project"],
]) {
  replacements[`@/features/dashboard/${plural}/actions`] = `
    export const actionAutosave${entity} = (input) => window.editorFixture.save("autosave", input);
    export const actionPublish${entity} = (input) => window.editorFixture.save("publish", input);
    export const actionSave${entity}Draft = (input) => window.editorFixture.save("draft", input);
  `;
}
const bundle = await build({
  entryPoints: ["tests/fixtures/editor-autosave/app.jsx"],
  bundle: true,
  write: false,
  format: "iife",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"development"' },
  plugins: [
    {
      name: "editor-fixture-boundaries",
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, (args) =>
          replacements[args.path]
            ? { path: args.path, namespace: "fixture" }
            : undefined,
        );
        builder.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          contents: replacements[args.path],
          loader: "jsx",
          resolveDir: process.cwd(),
        }));
      },
    },
  ],
});
const css = await postcss([tailwind()]).process(
  await readFile("src/app/globals.css", "utf8"),
  { from: resolve("src/app/globals.css") },
);
const shell = (
  await readFile(
    "src/features/dashboard/shell/dashboard-shell.module.css",
    "utf8",
  )
).replace(/:global\(([^)]+)\)/g, "$1");
const extra = `@font-face { font-family: Satoshi; src: url('/font.woff2'); } :root { --font-sans: Satoshi, sans-serif; --font-heading: Satoshi, sans-serif; } body { margin: 0; }`;
const html = `<!doctype html><html class="dark"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body class="shell"><header class="header">Dashboard fixture</header><main id="root" class="content"></main><script src="/app.js"></script></body></html>`;
createServer(async (request, response) => {
  const path = request.url?.split("?")[0];
  const [type, body] =
    path === "/app.js"
      ? ["text/javascript", bundle.outputFiles[0].text]
      : path === "/style.css"
        ? ["text/css", css.css + shell + extra]
        : path === "/font.woff2"
          ? [
              "font/woff2",
              await readFile("src/assets/fonts/Satoshi-Variable.woff2"),
            ]
          : ["text/html", html];
  response.writeHead(200, { "Content-Type": type });
  response.end(body);
}).listen(3197, "127.0.0.1", () =>
  console.log("Editor fixture: http://localhost:3197"),
);
