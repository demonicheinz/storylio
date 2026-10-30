async function dashboardOverview(sessionPage) {
  const origin = new URL(sessionPage.url()).origin;
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrated|hydration failed|encountered runtime data|encountered uncached data/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const result = [];
  let stage = "initial";
  await page.route("**/api/auth/get-session**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "owner",
          email: "owner@example.test",
          name: "Owner",
          image: null,
        },
        session: {
          id: "fixture-session",
          token: "fixture-token",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    }),
  );
  try {
    await page.goto(origin + "/dashboard-overview-fixture-check");
    for (const [width, height] of [
      [1440, 1000],
      [1024, 900],
      [768, 1024],
      [390, 844],
      [320, 740],
      [844, 390],
    ]) {
      stage = `viewport ${width}`;
      await page.setViewportSize({ width, height });
      await page
        .getByRole("heading", { name: "Overview", exact: true })
        .waitFor();
      await page
        .getByRole("heading", { name: "On your site", exact: true })
        .waitFor();
      await page.waitForFunction(
        (size) =>
          innerWidth < 768 ||
          document
            .querySelector('[data-slot="sidebar"]')
            ?.getAttribute("data-state") ===
            (size >= 1024 ? "expanded" : "collapsed"),
        width,
      );
      const dimensions = await page.evaluate(() => ({
        width: innerWidth,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        sidebar: document
          .querySelector('[data-slot="sidebar"]')
          ?.getAttribute("data-state"),
        h1: getComputedStyle(document.querySelector("h1")).fontSize,
        headings: [...document.querySelectorAll("h2")].map(
          (el) => el.textContent,
        ),
        actions: [
          ...document.querySelectorAll(
            'button[aria-label^="Open actions for"]',
          ),
        ].map((el) => ({
          width: el.getBoundingClientRect().width,
          height: el.getBoundingClientRect().height,
        })),
        metadata: [...document.querySelectorAll("time")].map((el) =>
          parseFloat(getComputedStyle(el).fontSize),
        ),
      }));
      assert(!dimensions.overflow, "Horizontal overflow at " + width);
      assert(
        dimensions.headings.includes("Work in progress") &&
          dimensions.headings.includes("Writing"),
        "Section heading semantics absent",
      );
      assert(
        dimensions.actions.every(
          (item) => item.width >= 44 && item.height >= 44,
        ),
        "Context target too small",
      );
      assert(
        dimensions.metadata.every((size) => size >= 12),
        "Metadata too small",
      );
      assert(
        (await page.getByText("Missing covers", { exact: true }).count()) === 0,
        "Optional cover warning remains",
      );
      assert(
        (await page
          .getByText("Visible testimonials", { exact: true })
          .count()) === 0,
        "Legacy testimonial indicator remains",
      );
      result.push(dimensions);
      if (width === 1440 || width === 390 || width === 768)
        await page.screenshot({
          path: `task/dashboard-polish/overview-${width}.png`,
          fullPage: true,
          caret: "initial",
        });
    }
    await page.setViewportSize({ width: 390, height: 844 });
    stage = "menus";
    await page.getByRole("button", { name: "New", exact: true }).click();
    await page
      .getByRole("menuitem", { name: "Gallery item", exact: true })
      .waitFor();
    await page.keyboard.press("Escape");
    assert(
      (await page
        .getByRole("button", { name: "New", exact: true })
        .getAttribute("aria-expanded")) === "false",
      "New menu did not dismiss",
    );
    const menu = page.getByRole("button", {
      name: "Open actions for Giving the stack one row",
      exact: true,
    });
    await menu.click();
    const note = page.getByRole("menuitem", {
      name: "View on site",
      exact: true,
    });
    assert(
      (await note.getAttribute("href")) === "/blog?tag=notes&note=one-row",
      "Note preview does not open note dialog permalink",
    );
    await page.keyboard.press("Escape");
    assert(
      (await page
        .getByRole("link")
        .filter({ hasText: "Draft writing" })
        .getAttribute("href")) === "/dashboard/posts?status=draft",
      "Draft link not filtered",
    );
    await page.goto(
      origin + "/dashboard-overview-fixture-check?view=posts&status=draft",
    );
    stage = "post filter";
    await page.getByRole("heading", { name: "Posts", exact: true }).waitFor();
    await page
      .getByRole("heading", {
        name: "A longer draft title that stays readable on a narrow screen",
        exact: true,
      })
      .waitFor();
    assert(
      !(await page
        .getByRole("heading", { name: "Giving the stack one row", exact: true })
        .count()),
      "Published note leaked into draft filter",
    );
    await page.goto(
      origin +
        "/dashboard-overview-fixture-check?view=projects&status=published&featured=featured",
    );
    stage = "project filter";
    await page
      .getByRole("heading", { name: "Projects", exact: true })
      .waitFor();
    await page
      .getByRole("heading", {
        name: "Storylio — a portfolio and publishing system",
        exact: true,
      })
      .waitFor();
    assert(
      !(await page
        .getByRole("heading", { name: "Nebula Commerce", exact: true })
        .count()),
      "Draft project leaked into featured filter",
    );
    await page.goto(
      origin +
        "/dashboard-overview-fixture-check?view=gallery&visibility=hidden",
    );
    stage = "gallery filter";
    await page.getByRole("heading", { name: "Gallery", exact: true }).waitFor();
    await page.getByText("Hidden example", { exact: true }).first().waitFor();
    assert(
      !(await page.getByText("Visible example", { exact: true }).count()),
      "Visible photo leaked into hidden filter",
    );
    await page.goto(origin + "/dashboard-overview-fixture-check");
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-slot="sidebar"]')
          ?.getAttribute("data-state") === "collapsed",
    );
    stage = "sidebar toggle";
    await page
      .getByRole("button", { name: "Toggle Sidebar", exact: true })
      .first()
      .click();
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-slot="sidebar"]')
          ?.getAttribute("data-state") === "expanded",
    );
    await page.reload();
    stage = "sidebar persistence";
    await page.waitForFunction(
      () =>
        document
          .querySelector('[data-slot="sidebar"]')
          ?.getAttribute("data-state") === "expanded",
    );
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      viewports: result,
      filters: true,
      menus: true,
      sidebarPreference: true,
      errors,
    };
  } catch (error) {
    error.message +=
      ` Stage: ${stage}; ` +
      JSON.stringify(
        await page.evaluate(() => ({
          width: innerWidth,
          state: document
            .querySelector('[data-slot="sidebar"]')
            ?.getAttribute("data-state"),
          preference: localStorage.getItem("storylio.sidebar"),
        })),
      );
    throw error;
  } finally {
    await context.close();
  }
}
