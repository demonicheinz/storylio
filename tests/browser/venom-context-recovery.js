async function venomContextRecovery(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const locations = new WeakMap(),
      original = WebGL2RenderingContext.prototype.getUniformLocation;
    WebGL2RenderingContext.prototype.getUniformLocation = function (
      program,
      name,
    ) {
      const location = original.call(this, program, name);
      if (location) locations.set(location, name);
      return location;
    };
    const uniform = WebGL2RenderingContext.prototype.uniform1f;
    WebGL2RenderingContext.prototype.uniform1f = function (location, value) {
      if (
        this.canvas.dataset.venomCanvas &&
        locations.get(location) === "uLabelAmt"
      )
        (window.recoveryLabels ??= []).push(value);
      return uniform.call(this, location, value);
    };
    const create = WebGL2RenderingContext.prototype.createProgram;
    WebGL2RenderingContext.prototype.createProgram = function () {
      if (this.canvas.dataset.venomCanvas)
        window.recoveryBuilds = (window.recoveryBuilds ?? 0) + 1;
      return create.call(this);
    };
  });
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const ready = () => page.locator('[data-venom-ready="true"]').waitFor();
  const lose = () =>
    page.evaluate(() => {
      const canvas = document.querySelector("[data-venom-canvas]");
      window.recoveryExtension = canvas
        .getContext("webgl2")
        .getExtension("WEBGL_lose_context");
      window.recoveryExtension.loseContext();
    });
  try {
    await page.goto(origin);
    await ready();
    for (let cycle = 0; cycle < 2; cycle++) {
      const before = await page.evaluate(() => window.recoveryBuilds);
      await lose();
      await page.waitForFunction(
        () => !document.querySelector("[data-venom-ready]"),
      );
      assert(
        (await page.locator("[data-venom-canvas]").count()) === 1,
        "Lost canvas was removed before restore",
      );
      assert(
        (await page
          .locator("[data-venom-link]")
          .evaluate((el) => getComputedStyle(el).color)) !== "rgba(0, 0, 0, 0)",
        "Fallback label invisible",
      );
      if (cycle === 1)
        await page.evaluate(() => window.dispatchEvent(new Event("blur")));
      await page.evaluate(() => {
        window.recoveryLabels = [];
        window.recoveryExtension.restoreContext();
      });
      if (cycle === 1) {
        await page.waitForFunction(
          () =>
            document.querySelector("[data-venom-canvas]")?.dataset
              .venomState === "paused-hidden",
        );
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      }
      await ready();
      assert(
        (await page.evaluate(() => window.recoveryBuilds)) === before + 3,
        "Restore did not build exactly one three-pass renderer",
      );
      assert(
        await page.evaluate(
          () =>
            window.recoveryLabels.length > 0 &&
            window.recoveryLabels.every((value) => value === 1),
        ),
        "Recovery replayed label entrance",
      );
      assert(
        (await page.locator("[data-venom-canvas]").count()) === 1,
        "Restore duplicated canvas",
      );
      assert(
        (await page
          .locator("[data-venom-canvas]")
          .evaluate((el) => getComputedStyle(el).transitionDuration)) === "0s",
        "Restore replayed initial crossfade",
      );
    }
    await page
      .getByRole("button", { name: "Unmount CTA", exact: true })
      .click();
    await page.waitForFunction(
      () => !document.querySelector("[data-venom-canvas]"),
    );
    assert(
      await page.evaluate(
        () =>
          !document.documentElement.hasAttribute("data-storylio-venom-cursor"),
      ),
      "Unmount retained cursor ownership",
    );
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      checks: [
        "two GPU loss/restore cycles",
        "readable fallback",
        "single three-pass rebuild",
        "blurred restore stays paused",
        "full label from first recovered frame",
        "no startup crossfade",
        "unmount cursor cleanup",
      ],
    };
  } finally {
    await context.close();
  }
}
