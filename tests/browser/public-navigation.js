// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin = new URL(page.url()).origin;
  const requests = [];
  const onRequest = (request) => {
    if (request.headers().rsc === "1") {
      requests.push({
        path: new URL(request.url()).pathname,
        prefetch: request.headers()["next-router-prefetch"] !== undefined,
      });
    }
  };
  const delayRsc = async (route) => {
    // Make a cache miss visible even against a fast local server.
    if (route.request().headers().rsc === "1") {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await route.continue();
  };
  page.on("request", onRequest);
  await page.route("**/*", delayRsc);
  try {
    await page.goto(origin);
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "About", exact: true }).waitFor();
    await page.evaluate(() => {
      window.__publicNavigationProbe = { loading: [], visible: false };
      window.__publicNavigationObserver = new MutationObserver(() => {
        const probe = window.__publicNavigationProbe;
        const visible = !!document.querySelector('[aria-label="Loading page"]');
        if (visible && !probe.visible) probe.loading.push(location.pathname);
        probe.visible = visible;
      });
      window.__publicNavigationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
    const results = [];
    for (let round = 1; round <= 2; round++) {
      for (const name of ["About", "Projects", "Blog", "Gallery", "Home"]) {
        const before = requests.length;
        await page.evaluate(() => { window.__publicNavigationProbe.loading = []; });
        await page.getByRole("link", { name, exact: true }).first().click();
        const path = name === "Home" ? "/" : `/${name.toLowerCase()}`;
        await page.waitForURL((url) => url.pathname === path);
        await page.waitForTimeout(1000);
        await page.locator('[aria-label="Loading page"]').waitFor({ state: "hidden" });
        await page.getByRole("heading", { level: 1 }).first().waitFor();
        const loading = await page.evaluate(() => window.__publicNavigationProbe.loading);
        const navigationRequests = requests.slice(before).filter((request) => !request.prefetch && request.path === path);
        results.push({ round, path, skeletonShown: loading.length > 0, navigationRequests: navigationRequests.length });
        if (round === 2 && (loading.length > 0 || navigationRequests.length > 0)) {
          throw new Error(`Visited public route was not reused: ${JSON.stringify(results)}`);
        }
      }
    }
    return results;
  } finally {
    page.off("request", onRequest);
    await page.unrouteAll({ behavior: "wait" });
    await page.evaluate(() => {
      window.__publicNavigationObserver?.disconnect();
      delete window.__publicNavigationObserver;
      delete window.__publicNavigationProbe;
    });
  }
}
