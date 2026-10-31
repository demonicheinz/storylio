// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function sidebarMobile(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const results = [];
  try {
    for (const width of [767, 640, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      await page
        .getByRole("button", { name: "Toggle Sidebar", exact: true })
        .first()
        .click();
      const sidebar = page.locator('[data-mobile="true"][data-slot="sidebar"]');
      await sidebar.waitFor();
      await page.waitForTimeout(350);
      const geometry = await sidebar.evaluate((el) => ({
        width: innerWidth,
        panel: el.getBoundingClientRect().toJSON(),
        rows: [...el.querySelectorAll('[data-sidebar="menu-button"]')].map(
          (button) => {
            const first = button.firstElementChild.getBoundingClientRect(),
              label = button.children[1].getBoundingClientRect(),
              row = button.getBoundingClientRect();
            return {
              name: button.getAttribute("aria-label"),
              height: row.height,
              first: first.toJSON(),
              label: label.toJSON(),
              centerDelta: Math.abs(
                first.top + first.height / 2 - label.top - label.height / 2,
              ),
            };
          },
        ),
      }));
      if (
        geometry.rows.some(
          (row) =>
            row.centerDelta > 1 ||
            row.label.left < row.first.right ||
            row.height < 44,
        )
      )
        throw Error(`Mobile sidebar wrapping: ${JSON.stringify(geometry)}`);
      if (geometry.panel.left < 0 || geometry.panel.right > width)
        throw Error("Sidebar extends beyond viewport");
      results.push(geometry);
      await page.screenshot({
        path: `task/sidebar-alignment/mobile-${width}.png`,
      });
      await page.keyboard.press("Escape");
      await sidebar.waitFor({ state: "hidden" });
    }
    return { passed: true, results };
  } finally {
    await context.close();
  }
}
