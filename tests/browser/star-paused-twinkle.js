async function starPausedTwinkle(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    const Native = ResizeObserver;
    window.ResizeObserver = class extends Native {
      constructor(callback) {
        super(callback);
        this.callback = callback;
      }
      observe(target, ...args) {
        if (target.tagName === "CANVAS")
          window.redrawStars = () => this.callback([{ target }], this);
        return super.observe(target, ...args);
      }
    };
  });
  try {
    await page.goto(new URL(sessionPage.url()).origin);
    await page.waitForFunction(() =>
      document.querySelector('canvas[data-star-running="true"]'),
    );
    await page
      .getByRole("button", { name: "Toggle pause", exact: true })
      .click();
    await page.waitForFunction(() =>
      document.querySelector('canvas[data-star-running="false"]'),
    );
    const before = await page
      .locator("[data-star-stage] canvas")
      .evaluate((canvas) => canvas.toDataURL());
    await page.waitForTimeout(700);
    await page.evaluate(() => window.redrawStars());
    const after = await page
      .locator("[data-star-stage] canvas")
      .evaluate((canvas) => canvas.toDataURL());
    if (before !== after)
      throw Error("Paused same-size redraw advances twinkle phase");
    return { passed: true, pausedFrameStable: true };
  } finally {
    await context.close();
  }
}
