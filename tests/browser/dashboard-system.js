// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function dashboardSystem(sessionPage) {
  const origin = new URL(sessionPage.url()).origin;
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const errors = [];
  const checks = [];
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydration|aria-hidden|encountered runtime|encountered uncached/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  await page.route("**/api/auth/get-session**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "owner",
          email: "owner@example.test",
          name: "Example owner",
          image: null,
          twoFactorEnabled: false,
        },
        session: {
          id: "fixture",
          token: "fixture-token",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    }),
  );
  const visit = async (view) => {
    await page.goto(`${origin}/dashboard-overview-fixture-check?view=${view}`);
    if (view === "overview")
      await page
        .getByRole("heading", { name: "On your site", exact: true })
        .waitFor();
    else if (view === "posts" || view === "projects")
      await page
        .getByRole("textbox", { name: `Search ${view}`, exact: true })
        .waitFor();
    else if (view === "gallery")
      await page
        .getByRole("textbox", { name: "Search gallery items", exact: true })
        .waitFor();
    else if (view === "media")
      await page
        .getByRole("textbox", { name: "Search media", exact: true })
        .waitFor();
    else if (view === "home")
      await page.getByRole("tab", { name: "Hero", exact: true }).waitFor();
    else if (view === "about")
      await page
        .getByRole("button", { name: "Save Content", exact: true })
        .waitFor();
    else if (view === "settings")
      await page
        .getByRole("textbox", { name: "Display Name", exact: true })
        .waitFor();
    else
      await page.getByRole("textbox", { name: "Title", exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
  };
  try {
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      for (const view of [
        "overview",
        "posts",
        "projects",
        "gallery",
        "media",
        "home",
        "about",
        "settings",
        "post-editor",
        "project-editor",
      ]) {
        await visit(view);
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          title: [...document.querySelectorAll("h1")]
            .filter((el) => el.getBoundingClientRect().height > 0)
            .map((el) => el.textContent),
          targets: [
            ...document.querySelectorAll(
              'button[aria-label^="Open actions for"]',
            ),
          ]
            .filter((el) => el.getBoundingClientRect().height > 0)
            .map((el) => ({
              w: el.getBoundingClientRect().width,
              h: el.getBoundingClientRect().height,
            })),
        }));
        assert(!layout.overflow, `${view} overflows at ${width}`);
        assert(
          layout.title.length === 1,
          `${view} missing/duplicate page title at ${width}`,
        );
        if (width < 768)
          assert(
            layout.targets.every((t) => t.w >= 44 && t.h >= 44),
            `${view} has small mobile menu targets`,
          );
        checks.push({ view, width, ...layout });
        if (
          (width === 1440 || width === 390) &&
          [
            "overview",
            "posts",
            "projects",
            "gallery",
            "home",
            "settings",
            "project-editor",
          ].includes(view)
        )
          await page.screenshot({
            path: `task/dashboard-system/${view}-${width}.png`,
            fullPage: true,
            caret: "initial",
          });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await visit("overview");
    await page.getByRole("button", { name: "New", exact: true }).click();
    assert(
      (await page
        .getByRole("menuitem", { name: "Project", exact: true })
        .count()) === 1,
      "Duplicate project creation action",
    );
    const popup = await page.getByRole("menu").evaluate((el) => ({
      radius: parseFloat(getComputedStyle(el).borderRadius),
      bg: getComputedStyle(el).backgroundColor,
    }));
    assert(popup.radius <= 16, "Menu retains preset radius");
    assert(
      !popup.bg.includes("/ 0.7") && !popup.bg.includes("rgba("),
      "Menu is translucent",
    );
    await page.keyboard.press("Escape");
    assert(
      await page
        .getByRole("button", { name: "New", exact: true })
        .evaluate((el) => el === document.activeElement),
      "New menu lost focus",
    );
    await visit("posts");
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .press("Escape");
    await page.waitForFunction(
      () => !document.querySelector('[data-slot="drawer-popup"]'),
    );
    assert(
      await page
        .getByRole("button", { name: "Filters", exact: true })
        .evaluate((el) => el === document.activeElement),
      "Filter drawer lost opener focus",
    );
    await visit("settings");
    const name = page.getByRole("textbox", {
      name: "Display Name",
      exact: true,
    });
    await name.fill("Changed example owner");
    await page
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    assert(
      (await name.inputValue()) === "Example owner",
      "Discard did not restore profile",
    );
    await visit("project-editor");
    const title = page.getByRole("textbox", { name: "Title", exact: true });
    const normalBorder = await title.evaluate(
      (el) => getComputedStyle(el).borderColor,
    );
    await page
      .getByRole("button", { name: "Save Draft", exact: false })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("#title")?.getAttribute("aria-invalid") ===
        "true",
    );
    assert(
      (await title.evaluate((el) => getComputedStyle(el).borderColor)) !==
        normalBorder,
      "Invalid input border was overridden",
    );
    await visit("home");
    await page.getByRole("tab", { name: "Tech stack", exact: true }).click();
    await page
      .getByRole("tab", { name: "Tech stack", exact: true })
      .press("ArrowLeft");
    assert(
      await page
        .getByRole("tab", { name: "Approach", exact: true })
        .evaluate((el) => el === document.activeElement),
      "Tab arrow navigation failed",
    );
    assert(errors.length === 0, errors.join("\n"));
    return { passed: true, checks: checks.length, popup, errors };
  } finally {
    await context.close();
  }
}
