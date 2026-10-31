// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function venomFallback(sessionPage) {
  const browser = sessionPage.context().browser(),
    origin = new URL(sessionPage.url()).origin,
    results = [];
  for (const { width, touch } of [
    { width: 1440, touch: false },
    { width: 390, touch: true },
    { width: 320, touch: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width, height: 800 },
      hasTouch: touch,
      isMobile: touch,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    try {
      await page.goto(origin);
      const link = page.locator("[data-venom-link]");
      await link.waitFor();
      await page.evaluate(() => document.fonts.ready);
      const style = await link.evaluate((element) => {
        const css = getComputedStyle(element),
          face = getComputedStyle(element, "::before"),
          rim = getComputedStyle(element, "::after");
        return {
          height: element.getBoundingClientRect().height,
          font: css.fontSize,
          family: css.fontFamily,
          radius: css.borderRadius,
          color: css.color,
          background: face.backgroundImage,
          shadow: face.boxShadow,
          animation: rim.animationName,
        };
      });
      if (
        style.height < 44 ||
        style.font !== "14px" ||
        !style.family.includes("Satoshi") ||
        style.animation !== "none" ||
        !style.background.includes("gradient") ||
        style.shadow === "none"
      )
        throw Error(
          "Fallback geometry/material/motion mismatch: " +
            JSON.stringify(style),
        );
      if (await page.locator("[data-venom-canvas]").count())
        throw Error("Reduced motion loaded GPU renderer");
      const rect = await link.boundingBox();
      await page.screenshot({
        path: `task/venom-fallback/fallback-${width}.png`,
        clip: {
          x: Math.max(0, rect.x - 20),
          y: Math.max(0, rect.y - 20),
          width: Math.min(width - Math.max(0, rect.x - 20), rect.width + 40),
          height: rect.height + 40,
        },
      });
      await page.keyboard.press("Tab");
      await link.focus();
      if (
        (await link.evaluate(
          (element) => getComputedStyle(element).outlineStyle,
        )) === "none"
      )
        throw Error("Fallback keyboard focus is invisible");
      await link.click();
      await page.waitForURL((url) => url.hash === "#target");
      results.push({
        width,
        passed: true,
        height: style.height,
        font: style.font,
        material: true,
        keyboard: true,
        navigation: true,
      });
    } finally {
      await context.close();
    }
  }
  return results;
}
