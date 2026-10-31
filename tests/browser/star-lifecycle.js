async function starLifecycle(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const frames = new Set(),
      request = window.requestAnimationFrame.bind(window),
      cancel = window.cancelAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      const id = request((time) => {
        frames.delete(id);
        callback(time);
      });
      frames.add(id);
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      frames.delete(id);
      cancel(id);
    };
    let clears = 0;
    const clear = CanvasRenderingContext2D.prototype.clearRect;
    const tracked = new WeakSet();
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas.closest("[data-star-stage]")) tracked.add(this.canvas);
      if (tracked.has(this.canvas)) clears++;
      return clear.apply(this, args);
    };
    const resizes = [];
    const Native = ResizeObserver;
    window.ResizeObserver = class extends Native {
      constructor(callback) {
        super(callback);
        this.record = { callback, disconnected: false };
        resizes.push(this.record);
      }
      observe(target) {
        this.record.target = target;
        return super.observe(target);
      }
      disconnect() {
        this.record.disconnected = true;
        return super.disconnect();
      }
    };
    window.starAudit = () => ({
      pending: frames.size,
      clears,
      liveResizeObservers: resizes.filter((record) => !record.disconnected)
        .length,
    });
    window.invokeLateResize = () =>
      resizes.forEach((record) =>
        record.callback([{ target: record.target }], {}),
      );
  });
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  try {
    await page.goto(origin);
    await page.waitForFunction(() => window.starAudit().clears > 0);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.waitForTimeout(80);
    assert(
      (await page.evaluate(() => window.starAudit().pending)) === 0,
      "Blur retains RAF",
    );
    const held = await page.evaluate(() => window.starAudit().clears);
    await page.waitForTimeout(120);
    assert(
      (await page.evaluate(() => window.starAudit().clears)) === held,
      "Blur keeps painting",
    );
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
    });
    await page.waitForFunction(() => window.starAudit().pending === 1);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(100);
    assert(
      (await page.evaluate(() => window.starAudit().pending)) === 0,
      "Reduced motion retains RAF",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.waitForFunction(() => window.starAudit().pending === 1);
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForTimeout(120);
    assert(
      (await page.evaluate(() => window.starAudit().pending)) === 0,
      "Offscreen retains RAF",
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => window.starAudit().pending === 1);
    await page
      .getByRole("button", { name: "Unmount stars", exact: true })
      .click();
    await page.waitForTimeout(80);
    const stopped = await page.evaluate(() => window.starAudit());
    assert(
      stopped.pending === 0 && stopped.liveResizeObservers === 0,
      "Unmount retains loop/observer",
    );
    await page.evaluate(() => window.invokeLateResize());
    assert(
      (await page.evaluate(() => window.starAudit().clears)) === stopped.clears,
      "Queued resize paints after unmount",
    );
    await page
      .getByRole("button", { name: "Mount stars", exact: true })
      .click();
    await page.waitForFunction(() => window.starAudit().pending === 1);
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      checks: [
        "blur freeze",
        "single resume loop",
        "live reduced motion",
        "offscreen pause",
        "unmount cleanup",
        "late resize ignored",
        "StrictMode remount",
      ],
    };
  } finally {
    await context.close();
  }
}
