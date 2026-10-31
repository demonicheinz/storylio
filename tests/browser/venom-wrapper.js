// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function venomWrapper(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  try {
    for (const mode of ["throw", "null", "ok"]) {
      await page.goto(origin);
      await page
        .getByRole("button", { name: "Unmount CTA", exact: true })
        .click();
      await page.locator("[data-venom-link]").waitFor({ state: "hidden" });
      await page.evaluate((mode) => {
        window.venomFixture.mode = mode;
      }, mode);
      await page
        .getByRole("button", { name: "Mount CTA", exact: true })
        .click();
      await page.waitForFunction(() => window.venomFixture.created > 0);
      await page.waitForTimeout(100);
      if (mode !== "ok")
        assert(
          (await page.locator("[data-venom-canvas]").count()) === 0,
          `${mode}: init failure left orphan canvas`,
        );
      else await page.locator('[data-venom-ready="true"]').waitFor();
      await page
        .getByRole("button", { name: "Unmount CTA", exact: true })
        .click();
      await page.waitForTimeout(80);
      assert(
        (await page.locator("[data-venom-canvas]").count()) === 0,
        "Unmount left canvas",
      );
    }
    await page.goto(origin);
    await page
      .getByRole("button", { name: "Unmount CTA", exact: true })
      .click();
    await page.evaluate(() => {
      window.venomFixture.pending = true;
      window.venomFixture.release = null;
    });
    await page.getByRole("button", { name: "Mount CTA", exact: true }).click();
    await page.waitForFunction(() => !!window.venomFixture.release);
    const created = await page.evaluate(() => window.venomFixture.created);
    await page
      .getByRole("button", { name: "Unmount CTA", exact: true })
      .click();
    await page.evaluate(() => window.venomFixture.release());
    await page.waitForTimeout(80);
    assert(
      (await page.evaluate(() => window.venomFixture.created)) === created,
      "Late prepare created an engine after unmount",
    );
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      checks: [
        "throw cleanup",
        "null fallback",
        "StrictMode mount",
        "late preparation cancellation",
      ],
    };
  } finally {
    await context.close();
  }
}
