// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin = new URL(page.url()).origin;
  const requests = [];
  const record = request => {
    if (request.headers().rsc === "1") requests.push(new URL(request.url()));
  };
  const delay = async route => {
    if (route.request().headers().rsc === "1") await new Promise(resolve => setTimeout(resolve, 500));
    await route.continue();
  };
  const matches = (url, path, param, value) => url.origin === origin &&
    url.pathname === path && url.searchParams.get(param) === value &&
    url.searchParams.get("keep") === "filter-test";
  page.on("request", record);
  await page.route("**/*", delay);
  try {
    const results = [];
    for (const [path, param, label] of [
      ["/projects", "tech", "Filter projects by stack"],
      ["/blog", "tag", "Filter writing by topic"],
    ]) {
      const start = requests.length;
      await page.goto(`${origin}${path}?keep=filter-test`);
      const bar = page.getByRole("navigation", { name: label, exact: true });
      const option = bar.locator("a,button").nth(1);
      await option.waitFor();
      const value = (await option.innerText()).trim();
      await page.waitForTimeout(1000);
      if (requests.slice(start).some(url => url.pathname === path && url.searchParams.has(param))) {
        throw new Error("Filters prefetched before intent: " + path);
      }
      const prefetched = page.waitForResponse(response => matches(new URL(response.url()), path, param, value), { timeout: 5000 });
      await option.hover();
      if (!(await prefetched).ok()) throw new Error("Hover prefetch failed: " + path);
      if (new URL(page.url()).searchParams.has(param)) throw new Error("Hover navigated");
      const before = requests.length;
      const scrollBefore = await page.evaluate(() => scrollY);
      await option.click();
      await page.waitForURL(url => matches(url, path, param, value), { timeout: 10000 });
      await bar.locator('[aria-current="page"]').filter({ hasText: value }).waitFor({ timeout: 10000 });
      if (requests.slice(before).some(url => matches(url, path, param, value))) throw new Error("Click did not reuse hover prefetch");
      if (Math.abs(await page.evaluate(() => scrollY) - scrollBefore) > 2) throw new Error("Filter changed scroll position");

      const keyboardOption = bar.getByRole("link").nth(2);
      await keyboardOption.waitFor({ timeout: 5000 });
      const keyboardValue = (await keyboardOption.innerText()).trim();
      const focusPrefetch = page.waitForResponse(response => matches(new URL(response.url()), path, param, keyboardValue), { timeout: 5000 });
      await keyboardOption.focus();
      if (!(await focusPrefetch).ok()) throw new Error("Focus prefetch failed: " + path);
      if (new URL(page.url()).searchParams.get(param) !== value) throw new Error("Focus navigated");
      const beforeFocusClick = requests.length;
      await keyboardOption.press("Enter");
      await page.waitForURL(url => matches(url, path, param, keyboardValue), { timeout: 10000 });
      await bar.locator('[aria-current="page"]').filter({ hasText: keyboardValue }).waitFor({ timeout: 10000 });
      if (requests.slice(beforeFocusClick).some(url => matches(url, path, param, keyboardValue))) throw new Error("Click did not reuse focus prefetch");

      // All may be cached, or focusing it may start a fresh prefetch.
      // Check reset behavior without assuming the destination stayed cached.
      const all = bar.getByRole("link", { name: "All", exact: true });
      await all.focus();
      if (new URL(page.url()).searchParams.get(param) !== keyboardValue) throw new Error("Focusing All navigated");
      await all.press("Enter");
      await page.waitForURL(url => matches(url, path, param, null), { timeout: 10000 });
      await bar.locator('[aria-current="page"]').filter({ hasText: "All" }).waitFor({ timeout: 10000 });
      results.push({ path, value, keyboardValue, hover: "passed", focus: "passed", queryPreserved: true });
    }
    return results;
  } finally {
    page.off("request", record);
    // This isolated test session owns the page routes; drain delayed handlers
    // before removing them so route.continue() cannot race with cleanup.
    await page.unrouteAll({ behavior: "wait" });
  }
}
