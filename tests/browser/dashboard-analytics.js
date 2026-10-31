// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function dashboardAnalytics(page) {
  const origin = "http://127.0.0.1:3202";
  const context = await page
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const review = await context.newPage();
  const errors = [];
  review.on("pageerror", (error) => errors.push(error.message));
  const check = (value, message) => {
    if (!value) throw new Error(message);
  };
  const results = [];
  const assertFitsViewport = async (label) =>
    check(
      await review.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `${label}: horizontal overflow`,
    );
  try {
    for (const width of [1440, 1024, 768, 390, 360, 320]) {
      await review.setViewportSize({ width, height: 900 });
      await review.goto(origin);
      await review
        .getByRole("heading", { name: "Top posts", exact: true })
        .waitFor();
      await review.evaluate(() => document.fonts.ready);
      check(
        (await review
          .getByRole("tab", { name: "Content", exact: true })
          .getAttribute("aria-selected")) === "true",
        "Content is not the default source",
      );
      check(
        (await review
          .getByRole("heading", { name: "Umami traffic", exact: true })
          .count()) === 0,
        "Inactive traffic exposed",
      );
      check(
        (await review
          .getByRole("link", {
            name: "Building Storylio With Server-first Pages",
            exact: true,
          })
          .count()) === 1,
        "Duplicated ranking identity",
      );
      await assertFitsViewport(`${width} content`);
      await review.screenshot({
        path: `task/dashboard-analytics-review/updated-content-${width}.png`,
        fullPage: true,
      });
      await review
        .getByRole("tab", { name: "Web traffic", exact: true })
        .click();
      await review
        .getByRole("heading", { name: "Umami traffic", exact: true })
        .waitFor();
      await assertFitsViewport(`${width} traffic`);
      const refresh = review.getByRole("button", {
        name: "Refresh Umami",
        exact: true,
      });
      check(
        (await refresh.boundingBox()).height >= 44,
        "Refresh target is shorter than44px",
      );
      await review.screenshot({
        path: `task/dashboard-analytics-review/updated-traffic-${width}.png`,
        fullPage: true,
      });
      results.push({ width, contentOverflow: false, trafficOverflow: false });
    }
    await review.getByRole("tab", { name: "Content", exact: true }).click();
    const chart = review.getByRole("application", {
      name: "Daily content views over 30 UTC calendar days",
      exact: true,
    });
    await chart.focus();
    await chart.press("ArrowRight");
    await review
      .locator('.recharts-tooltip-wrapper [role="status"]')
      .filter({ hasText: "views" })
      .waitFor();
    await review.getByText("View daily values", { exact: true }).click();
    check(
      (await review
        .getByRole("table", { name: "Daily views (UTC)" })
        .locator("tbody tr")
        .count()) === 30,
      "Daily values are incomplete",
    );
    await review.getByText("Recent activity", { exact: true }).click();
    await assertFitsViewport("Expanded mobile details");
    await review.getByRole("tab", { name: "Content", exact: true }).focus();
    await review.keyboard.press("ArrowRight");
    if (
      (await review
        .getByRole("tab", { name: "Web traffic", exact: true })
        .getAttribute("aria-selected")) !== "true"
    )
      await review.keyboard.press("Enter");
    await review
      .getByRole("heading", { name: "Umami traffic", exact: true })
      .waitFor();
    await review.evaluate(() => {
      window.analyticsReject = true;
    });
    await review
      .getByRole("button", { name: "Refresh Umami", exact: true })
      .click();
    await review
      .getByRole("status")
      .filter({ hasText: "Umami refresh failed" })
      .waitFor();
    check(
      (await review.getByText("625", { exact: true }).count()) === 1,
      "Refresh failure discarded last data",
    );
    await review.screenshot({
      path: "task/dashboard-analytics-review/updated-traffic-stale-320.png",
      fullPage: true,
    });
    await review.evaluate(() => {
      window.analyticsReject = false;
      window.analyticsUmami.details.topPages = { status: "error" };
      window.analyticsUmami.topPages = [];
    });
    await review
      .getByRole("button", { name: "Refresh Umami", exact: true })
      .click();
    await review.getByText(/Top pages could not be refreshed/i).waitFor();
    check(
      (await review
        .getByText(
          "/blog/a-long-path-that-remains-readable-and-accessible-on-mobile-devices",
          { exact: true },
        )
        .count()) === 1,
      "Partial failure lost last detail",
    );
    await review.evaluate(() => {
      window.analyticsUmami.details.topPages = { status: "empty" };
      window.analyticsUmami.topPages = [];
    });
    await review
      .getByRole("button", { name: "Refresh Umami", exact: true })
      .click();
    await review.getByText(/No page metrics/).waitFor();
    await review.evaluate(() => {
      window.analyticsHold = true;
    });
    await review
      .getByRole("button", { name: "Refresh Umami", exact: true })
      .click();
    check(
      await review
        .getByRole("button", { name: "Refresh Umami", exact: true })
        .isDisabled(),
      "Pending refresh is not locked",
    );
    await review.evaluate(() => {
      window.analyticsHold = false;
      window.analyticsRelease();
    });
    await review
      .getByRole("button", { name: "Refresh Umami", exact: true })
      .waitFor({ state: "visible" });
    await review.getByRole("tab", { name: "Content", exact: true }).click();
    check(
      (await review
        .locator("details")
        .filter({ has: review.getByText("View daily values", { exact: true }) })
        .getAttribute("open")) !== null,
      "Tab changes lost open daily values",
    );
    await review.goto(`${origin}/?empty`);
    await review.getByText("No recent views", { exact: true }).waitFor();
    await assertFitsViewport("Empty content");
    await review.screenshot({
      path: "task/dashboard-analytics-review/updated-empty-320.png",
      fullPage: true,
    });
    await review.getByRole("tab", { name: "Web traffic", exact: true }).click();
    await review
      .getByRole("status")
      .filter({ hasText: "not configured" })
      .waitFor();
    check(
      (await review
        .getByRole("button", { name: "Refresh Umami", exact: true })
        .count()) === 0,
      "Unconfigured provider offers a retry",
    );
    await review.goto(`${origin}/?loading`);
    await review
      .getByRole("status")
      .filter({ hasText: "Loading content analytics" })
      .waitFor();
    check(
      await review
        .locator('[data-slot="skeleton"]')
        .evaluateAll((nodes) =>
          nodes.every(
            (node) => getComputedStyle(node).animationName === "none",
          ),
        ),
      "Reduced motion skeleton animates",
    );
    await assertFitsViewport("Loading");
    await review.screenshot({
      path: "task/dashboard-analytics-review/updated-loading-320.png",
      fullPage: true,
    });
    check(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
    return {
      passed: true,
      results,
      checks: [
        "source tabs and keyboard",
        "30 daily values and chart keyboard tooltip",
        "responsive content/traffic",
        "retained data on refresh failure",
        "partial failure vs empty",
        "pending lock",
        "preserved disclosure state",
        "zero and unconfigured",
        "reduced-motion loading",
      ],
      errors,
    };
  } finally {
    await context.close();
  }
}
