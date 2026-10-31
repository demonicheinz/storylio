// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function drawerHandle(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const results = [];
  try {
    for (const direction of ["down", "up", "left", "right"]) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${origin}/?handle=${direction}`);
      const dialog = page.getByRole("dialog", {
        name: "Drawer handle fixture",
      });
      await dialog.waitFor();
      await page.waitForTimeout(500);
      const grip = page.locator('[data-slot="drawer-swipe-handle"]');
      const bounds = await grip.evaluate((el) => {
        const r = el.getBoundingClientRect(),
          panel = el.closest('[role="dialog"]').getBoundingClientRect(),
          style = getComputedStyle(el, "::after");
        return {
          x: r.x,
          y: r.y,
          width: r.width,
          height: r.height,
          panel: {
            x: panel.x,
            y: panel.y,
            width: panel.width,
            height: panel.height,
          },
          pillWidth: parseFloat(style.width),
          pillHeight: parseFloat(style.height),
          color: style.backgroundColor,
        };
      });
      const vertical = direction === "down" || direction === "up";
      if (
        vertical
          ? bounds.pillWidth !== 48 ||
            bounds.pillHeight !== 4 ||
            bounds.height !== 32
          : bounds.pillWidth !== 4 ||
            bounds.pillHeight !== 48 ||
            bounds.width !== 32
      )
        throw Error(JSON.stringify({ direction, ...bounds }));
      if (direction === "down")
        await page.screenshot({
          path: "task/dashboard-projects-review/drawer-handle-390.png",
        });
      const x = bounds.x + bounds.width / 2,
        y = bounds.y + bounds.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(
        x + (direction === "left" ? -220 : direction === "right" ? 220 : 0),
        y + (direction === "up" ? -220 : direction === "down" ? 220 : 0),
        { steps: 12 },
      );
      await page.mouse.up();
      await dialog.waitFor({ state: "hidden" });
      results.push({ direction, ...bounds, swipeDismissed: true });
    }
    return { passed: true, results };
  } finally {
    await context.close();
  }
}
