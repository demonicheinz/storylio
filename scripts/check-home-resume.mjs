// Run after a production build, with the same read-only database environment.
// shortcut: this check uses Next internals; review it when upgrading Next.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import NextServerModule from "next/dist/server/next-server.js";

const NextServer = NextServerModule.default ?? NextServerModule;
const { config } = JSON.parse(
  await readFile(".next/required-server-files.json", "utf8"),
);
const { postponed } = JSON.parse(
  await readFile(".next/server/app/index.meta", "utf8"),
);
assert.equal(
  typeof postponed,
  "string",
  "Build must contain a partially prerendered Home shell",
);
assert.ok(postponed.length, "Home postponed state is empty");

// Diagnostic failures must not be reported to the real Sentry project.
process.env.NEXT_PUBLIC_SENTRY_ENABLED = "false";
const requestErrors = [];
class DiagnosticServer extends NextServer {
  async instrumentationOnRequestError(error) {
    requestErrors.push(error);
  }
}
const app = new DiagnosticServer({
  dir: process.cwd(),
  conf: config,
  dev: false,
  minimalMode: true,
});
const server = createServer(app.getRequestHandler());
try {
  await app.prepare();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  for (const path of ["/", "/index", "/index?note=resume-regression-missing"]) {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method: "POST",
      headers: {
        "next-resume": "1",
        "x-matched-path": "/",
        "content-type": "text/plain",
      },
      body: postponed,
      signal: AbortSignal.timeout(30_000),
    });
    const html = await response.text();
    assert.equal(
      requestErrors.length,
      0,
      `${path}: renderer reported a request error`,
    );
    assert.equal(response.status, 200, `${path}: resume HTTP status`);
    assert.ok(
      !html.includes("$RX("),
      `${path}: resume fell back to client rendering`,
    );
    assert.ok(
      html.includes("$RC("),
      `${path}: no completed suspended boundary`,
    );
    console.log(`${path}: completed server resume without client fallback`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server.closeAllConnections();
  if (server.listening) await new Promise((resolve) => server.close(resolve));
  await app.close();
}
