async function sidebarMotion(page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => localStorage.removeItem("storylio.sidebar"));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(new URL(page.url()).origin);
  const toggle = page
    .getByRole("button", { name: "Toggle Sidebar", exact: true })
    .first();
  await page.locator('[data-slot="sidebar-inner"]').waitFor();
  const samples = await page.evaluate(async () => {
    const rail = document.querySelector('[data-slot="sidebar-container"]');
    const button = document.querySelector('[data-sidebar="menu-button"]');
    const frames = [];
    const record = () =>
      frames.push({
        width: rail.getBoundingClientRect().width,
        iconX: button.firstElementChild.getBoundingClientRect().x,
        height: button.getBoundingClientRect().height,
      });
    record();
    document.querySelector('[data-sidebar="trigger"]').click();
    const start = performance.now();
    while (performance.now() - start < 360) {
      await new Promise(requestAnimationFrame);
      record();
    }
    return frames;
  });
  if (
    Math.max(...samples.map((s) => s.iconX)) -
      Math.min(...samples.map((s) => s.iconX)) >
    1
  )
    throw new Error("Icon jumps during collapse");
  if (new Set(samples.map((s) => s.height)).size !== 1)
    throw new Error("Logo row height changes during collapse");
  if (!samples.some((s) => s.width > 70 && s.width < 250))
    throw new Error("Missing intermediate animation frames");
  await toggle.click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const duration = await page
    .locator('[data-slot="sidebar-container"]')
    .evaluate((el) => getComputedStyle(el).transitionProperty);
  if (duration !== "none")
    throw new Error(`Reduced motion duration: ${duration}`);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  return {
    passed: true,
    frameCount: samples.length,
    samples,
    reducedMotion: duration,
  };
}
