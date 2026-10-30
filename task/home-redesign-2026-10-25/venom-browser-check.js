async (page) => {
  const errors = [];
  const onError = (e) => errors.push(e.message);
  page.on("pageerror", onError);
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const states = [];
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.reload();
    await page.evaluate(() => document.fonts.ready);
    const button = page.getByRole("button", { name: "let’s collaborate" });
    const box = await button.boundingBox();
    const cx = box.x + box.width / 2,
      cy = box.y + box.height / 2;
    await page.screenshot({
      path: "task/home-redesign-2026-10-25/venom-revised-idle.png",
    });
    for (const [direction, x, y] of [
      ["right", cx + box.width / 2 + 170, cy],
      ["top", cx, cy - 210],
      ["left", cx - box.width / 2 - 170, cy],
      ["bottom", cx + 90, cy + 220],
    ]) {
      await button.hover();
      await page.mouse.move(x, y, { steps: 18 });
      await page.waitForTimeout(550);
      const state = await page.evaluate(() => {
        const button = document.querySelector("button");
        const svg = document.querySelector("svg");
        const path = svg.querySelector("g > path:nth-child(5)");
        const numbers = path
          .getAttribute("d")
          .match(/-?\d+(?:\.\d+)?/g)
          .map(Number);
        return {
          root: { x: numbers[0], y: numbers[1] },
          visible: Number(svg.querySelector("g").style.opacity),
          transform: getComputedStyle(button).transform,
          cursor: getComputedStyle(button).cursor,
          rootCursor: document.documentElement.style.cursor,
          bodyCursor: document.body.style.cursor,
          customHands: svg.querySelectorAll("g g").length,
          finite: !/NaN|Infinity/.test(path.getAttribute("d")),
        };
      });
      assert(
        state.visible > 0.9 && state.finite,
        direction + ": no valid tendrils",
      );
      assert(state.transform === "none", direction + ": button tilts/scales");
      assert(
        state.cursor === "pointer" &&
          !state.rootCursor &&
          !state.bodyCursor &&
          !state.customHands,
        "native cursor replaced",
      );
      if (direction === "right")
        assert(state.root.x > box.x + box.width - 5, "right root wrong");
      if (direction === "left")
        assert(state.root.x < box.x + 5, "left root wrong");
      if (direction === "top")
        assert(state.root.y < box.y + 5, "top root wrong");
      if (direction === "bottom")
        assert(state.root.y > box.y + box.height - 5, "bottom root wrong");
      states.push({ direction, ...state });
      await page.screenshot({
        path: `task/home-redesign-2026-10-25/venom-revised-${direction}.png`,
      });
    }
    // Both attached fibres and short feelers must keep moving with a still cursor.
    await page.waitForTimeout(1000);
    const geometry = () =>
      page.locator("svg").first().locator("g > path").first().getAttribute("d");
    const resting = await geometry();
    await page.waitForTimeout(300);
    assert(
      (await geometry()) !== resting,
      "attached fibres freeze with a still cursor",
    );
    const short = page.locator("svg").first().locator('[data-tendril="free"]');
    assert((await short.count()) === 6, "missing short feelers");
    const shortBefore = await short.first().getAttribute("d");
    await page.waitForTimeout(350);
    assert(
      (await short.first().getAttribute("d")) !== shortBefore,
      "short feelers are static",
    );
    const shortSizes = await short.evaluateAll((paths) =>
      paths.map((path) => {
        const r = path.getBBox();
        return Math.hypot(r.width, r.height);
      }),
    );
    assert(
      shortSizes.every((size) => size > 10 && size < 90),
      "free feelers are not short",
    );
    await page.mouse.move(cx + 140, cy + 180, { steps: 5 });
    await page.waitForTimeout(300);
    assert((await geometry()) !== resting, "movement did not resume");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    assert(
      (await page
        .locator("svg")
        .first()
        .evaluate((el) => getComputedStyle(el).display)) === "none",
      "live reduced motion not hidden",
    );
    assert(
      (await page
        .locator("svg > g")
        .first()
        .evaluate((el) => el.style.opacity)) === "0",
      "live reduced motion did not stop",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await button.hover();
    await page.mouse.move(650, 680, { steps: 15 });
    await page.waitForTimeout(300);
    await page.mouse.move(1400, 30);
    await page.waitForTimeout(1100);
    assert(
      (await page
        .locator("svg > g")
        .first()
        .evaluate((el) => el.style.opacity)) === "0",
      "distance release failed",
    );
    await button.focus();
    await page.keyboard.press("Enter");
    assert(
      (await page.locator("output").textContent()).includes("1"),
      "keyboard activation failed",
    );
    assert(
      (await button.evaluate((el) => getComputedStyle(el).outlineStyle)) !==
        "none",
      "keyboard focus not visible",
    );
    const dark = page.getByRole("button", { name: "About me ↗" });
    const darkBox = await dark.boundingBox();
    await dark.hover();
    await page.mouse.move(
      darkBox.x + darkBox.width / 2 + 140,
      darkBox.y + 230,
      { steps: 18 },
    );
    await page.waitForTimeout(600);
    await page.screenshot({
      path: "task/home-redesign-2026-10-25/venom-revised-dark.png",
    });
    const touchContext = await page
      .context()
      .browser()
      .newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
    const touch = await touchContext.newPage();
    try {
      await touch.goto("http://127.0.0.1:3104");
      const touchButton = touch.getByRole("button", {
        name: "let’s collaborate",
      });
      await touchButton.tap();
      assert(
        (await touch.locator("output").textContent()).includes("1"),
        "touch activation failed",
      );
      assert(
        (await touchButton.evaluate(
          (el) => getComputedStyle(el).touchAction,
        )) === "manipulation",
        "touch scroll blocked",
      );
      assert(
        (await touch
          .locator("svg > g")
          .first()
          .evaluate((el) => el.style.opacity)) === "0",
        "touch activates tendrils",
      );
      assert(
        await touch.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "mobile horizontal overflow",
      );
      await touch.screenshot({
        path: "task/home-redesign-2026-10-25/venom-revised-mobile.png",
      });
    } finally {
      await touchContext.close();
    }
    assert(!errors.length, "runtime errors: " + errors.join(";"));
    return {
      states,
      continuousMotion: true,
      shortFeelers: shortSizes,
      liveReducedMotion: true,
      distanceRelease: true,
      keyboard: true,
      touch: true,
      errors,
    };
  } finally {
    page.off("pageerror", onError);
  }
};
