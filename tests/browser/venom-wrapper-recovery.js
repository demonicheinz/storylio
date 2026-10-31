async function venomWrapperRecovery(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const lose = () =>
    page.evaluate(() => {
      const canvas = document.querySelector("[data-venom-canvas]");
      const event = new Event("webglcontextlost", { cancelable: true });
      canvas.dispatchEvent(event);
      return event.defaultPrevented;
    });
  try {
    await page.goto(origin);
    await page.locator('[data-venom-ready="true"]').waitFor();
    const initial = await page.evaluate(() => window.venomFixture.created);
    assert(await lose(), "Loss did not permit browser restoration");
    await page.evaluate(() => {
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("focus"));
    });
    assert(
      (await page.evaluate(() => window.venomFixture.created)) === initial,
      "Focus created a duplicate while awaiting restore",
    );
    await page.evaluate(() =>
      document
        .querySelector("[data-venom-canvas]")
        .dispatchEvent(new Event("webglcontextrestored")),
    );
    await page.locator('[data-venom-ready="true"]').waitFor();
    assert(
      (await page.evaluate(() => window.venomFixture.created)) === initial + 1,
      "Restore did not rebuild exactly once",
    );
    assert(
      (await page.locator("[data-venom-canvas]").count()) === 1,
      "Restore duplicated canvas",
    );
    await lose();
    await page.evaluate(() => {
      window.venomFixture.mode = "throw";
      document
        .querySelector("[data-venom-canvas]")
        .dispatchEvent(new Event("webglcontextrestored"));
    });
    assert(
      (await page.locator("[data-venom-canvas]").count()) === 0,
      "Failed restore left canvas",
    );
    assert(
      (await page.locator("[data-venom-ready]").count()) === 0,
      "Failed restore hid fallback",
    );
    await page.goto(origin);
    await page.locator('[data-venom-ready="true"]').waitFor();
    await lose();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForFunction(
      () => !document.querySelector("[data-venom-canvas]"),
    );
    assert(
      (await page.locator("[data-venom-ready]").count()) === 0,
      "Preference disposal hid fallback",
    );
    return {
      passed: true,
      checks: [
        "single restore",
        "no duplicate on focus",
        "failed restore fallback",
        "preference disposal during loss",
      ],
    };
  } finally {
    await context.close();
  }
}
