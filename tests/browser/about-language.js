// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin = new URL(page.url()).origin;
  const navigationRequests = [];
  const isLanguagePrefetch = (response, language) => {
    const request = response.request();
    const url = new URL(request.url());
    return url.origin === origin && url.pathname === "/about" &&
      url.searchParams.get("lang") === language &&
      request.headers().rsc === "1";
  };
  const recordNavigation = (request) => {
    const url = new URL(request.url());
    if (url.origin === origin && url.pathname === "/about" &&
        request.headers().rsc === "1" &&
        request.headers()["next-router-prefetch"] === undefined) {
      navigationRequests.push(url.searchParams.get("lang"));
    }
  };
  const delayRsc = async (route) => {
    if (route.request().headers().rsc === "1") {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
    await route.continue();
  };
  await page.route("**/*", delayRsc);
  try {
    // Runtime full prefetch can omit next-router-prefetch. Observe it before
    // any click; do not wait for a potentially long-lived RSC stream to close.
    const indonesian = page.waitForResponse((response) => isLanguagePrefetch(response, "id"), { timeout: 15000 });
    await page.goto(`${origin}/about?lang=en`);
    await page.getByRole("link", { name: "Indonesian", exact: true }).scrollIntoViewIfNeeded();
    const response = await indonesian;
    if (!response.ok()) throw new Error("Indonesian prefetch failed");
    // The response event only confirms headers. Allow the delayed prefetch
    // payload to reach the router cache before timing an interaction.
    await page.waitForTimeout(1000);

    page.on("request", recordNavigation);
    const results = [];
    for (const [language, label, heading] of [
      ["id", "Indonesian", "Cara Saya Bekerja"],
      ["en", "English", "How I Work"],
      ["id", "Indonesian", "Cara Saya Bekerja"],
    ]) {
      const link = page.getByRole("link", { name: label, exact: true });
      await link.scrollIntoViewIfNeeded();
      const scrollBefore = await page.evaluate(() => scrollY);
      const before = navigationRequests.length;
      const started = Date.now();
      await link.click({ timeout: 15000 });
      await page.waitForURL((url) => url.searchParams.get("lang") === language, { timeout: 15000 });
      await page.getByRole("heading", { name: heading, exact: true }).waitFor({ state: "attached", timeout: 15000 });
      if (await page.getByRole("link", { name: label, exact: true }).getAttribute("aria-current") !== "page") {
        throw new Error("Active language indicator is stale");
      }
      const scrollAfter = await page.evaluate(() => scrollY);
      const requests = navigationRequests.length - before;
      const elapsedMs = Date.now() - started;
      results.push({ language, elapsedMs, navigationRequests: requests });
      if (requests !== 0 || elapsedMs >= 800) throw new Error(`Language switch waited on the server: ${JSON.stringify(results)}`);
      if (Math.abs(scrollAfter - scrollBefore) > 2) throw new Error("Language switch changed scroll position");
    }
    return { injectedRscDelayMs: 800, results };
  } finally {
    page.off("request", recordNavigation);
    await page.unrouteAll({ behavior: "wait" });
  }
}
