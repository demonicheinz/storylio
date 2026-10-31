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
    {
      await page.goto(`${origin}/projects?keep=filter-test`);
      const trigger = page.getByRole("button", {
        name: "Filter stack",
        exact: true,
      });
      await trigger.waitFor();
      await page.waitForTimeout(700);
      if (
        requests.some(
          (url) => url.pathname === "/projects" && url.searchParams.has("tech"),
        )
      )
        throw new Error("Project filters prefetched before intent");
      await trigger.click();
      const input = page.getByRole("combobox", { name: "Search technologies" });
      await input.fill("Next.js");
      // Router prefetch can reuse the existing partial shell without a request.
      // Opening/searching must not navigate; result data may still load on select.
      if (new URL(page.url()).searchParams.has("tech"))
        throw new Error("Project search navigated");
      const scrollBefore = await page.evaluate(() => scrollY);
      await page.getByRole("option", { name: "Next.js", exact: true }).click();
      await page.waitForURL((url) =>
        matches(url, "/projects", "tech", "Next.js"),
      );
      await page.keyboard.press("Escape");
      if (Math.abs((await page.evaluate(() => scrollY)) - scrollBefore) > 2)
        throw new Error("Project selection changed scroll");
      await page
        .getByRole("button", { name: "Reset stack", exact: true })
        .click();
      await page.waitForURL((url) => matches(url, "/projects", "tech", null));
      results.push({
        path: "/projects",
        intentDoesNotNavigate: true,
        queryPreserved: true,
        scrollPreserved: true,
      });
    }
    {
      await page.goto(`${origin}/blog?keep=filter-test&page=3`);
      const trigger = page.getByRole("button", { name: "Filter topic", exact: true });
      await trigger.click();
      const option = page.getByRole("listbox", { name: "Topics", exact: true }).getByRole("option").first();
      // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
      const value = (await option.innerText()).trim();
      const scrollBefore = await page.evaluate(() => scrollY);
      await option.click();
      await page.waitForURL(url => matches(url, "/blog", "tag", value));
      if (new URL(page.url()).searchParams.has("page")) throw new Error("Topic did not reset page");
      if (Math.abs(await page.evaluate(() => scrollY) - scrollBefore) > 2)
        throw new Error("Topic changed scroll position");
      await page.getByRole("button", { name: "Reset topic", exact: true }).click();
      await page.waitForURL(url => matches(url, "/blog", "tag", null));
      results.push({ path: "/blog", singleTopic: true, queryPreserved: true, scrollPreserved: true });
    }
    return results;
  } finally {
    page.off("request", record);
    // This isolated test session owns the page routes; drain delayed handlers
    // before removing them so route.continue() cannot race with cleanup.
    await page.unrouteAll({ behavior: "wait" });
  }
}
