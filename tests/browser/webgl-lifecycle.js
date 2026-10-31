// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function webglLifecycle(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const origin = new URL(sessionPage.url()).origin;
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const nativeAdd = EventTarget.prototype.addEventListener;
    const nativeRemove = EventTarget.prototype.removeEventListener;
    const registrations = new Map();
    const eventTypes = new Set([
      "blur",
      "focus",
      "visibilitychange",
      "pointermove",
      "pointerover",
      "pointerleave",
      "webglcontextlost",
      "webglcontextrestored",
      "change",
    ]);
    const tracked = (target, type) =>
      eventTypes.has(type) &&
      (target === window ||
        target === document ||
        target instanceof HTMLCanvasElement ||
        target instanceof HTMLUListElement ||
        target instanceof MediaQueryList);
    EventTarget.prototype.addEventListener = function (
      type,
      listener,
      options,
    ) {
      if (listener && tracked(this, type)) {
        const groups = registrations.get(this) ?? new Map();
        registrations.set(this, groups);
        const key = `${type}:${typeof options === "boolean" ? options : !!options?.capture}`;
        const entries = groups.get(key) ?? new Set();
        groups.set(key, entries);
        entries.add(listener);
      }
      return nativeAdd.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      type,
      listener,
      options,
    ) {
      const key = `${type}:${typeof options === "boolean" ? options : !!options?.capture}`;
      registrations.get(this)?.get(key)?.delete(listener);
      return nativeRemove.call(this, type, listener, options);
    };
    const observers = new Set();
    const observerDetails = new Map();
    for (const name of [
      "ResizeObserver",
      "IntersectionObserver",
      "MutationObserver",
    ]) {
      const Native = window[name];
      window[name] = class extends Native {
        observe(...args) {
          const stack = new Error().stack ?? "";
          if (!stack.includes("InjectedScript")) observers.add(this);
          observerDetails.set(this, { name, stack });
          return super.observe(...args);
        }
        disconnect() {
          observers.delete(this);
          return super.disconnect();
        }
      };
    }
    const canvases = [];
    const wrapped = new WeakSet();
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, options) {
      if (
        new URLSearchParams(location.search).get("fault") === "no-gl" &&
        type.startsWith("webgl")
      )
        return null;
      const gl = getContext.call(this, type, options);
      if (!gl || !type.startsWith("webgl") || wrapped.has(gl)) return gl;
      wrapped.add(gl);
      const state = {
        canvas: this,
        type,
        draws: 0,
        invalidDraws: 0,
        programs: new Set(),
        shaders: new Set(),
        buffers: new Set(),
      };
      canvases.push(state);
      const draw = gl.drawArrays.bind(gl);
      gl.drawArrays = (...args) => {
        state.draws++;
        if (!this.isConnected || gl.isContextLost()) state.invalidDraws++;
        return draw(...args);
      };
      for (const [create, remove, resources] of [
        ["createProgram", "deleteProgram", state.programs],
        ["createShader", "deleteShader", state.shaders],
        ["createBuffer", "deleteBuffer", state.buffers],
      ]) {
        const allocate = gl[create].bind(gl),
          release = gl[remove].bind(gl);
        gl[create] = (...args) => {
          if (
            create === "createBuffer" &&
            (new URLSearchParams(location.search).get("fault") === "buffer" ||
              window.webglFault === type)
          )
            return null;
          const value = allocate(...args);
          if (value) resources.add(value);
          return value;
        };
        gl[remove] = (value) => {
          resources.delete(value);
          return release(value);
        };
      }
      nativeAdd.call(this, "webglcontextlost", () => {
        state.programs.clear();
        state.shaders.clear();
        state.buffers.clear();
      });
      return gl;
    };
    const frames = new Set();
    const request = window.requestAnimationFrame.bind(window),
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
    window.webglAudit = () => ({
      pending: frames.size,
      observers: observers.size,
      observerDetails: [...observers].map((observer) =>
        observerDetails.get(observer),
      ),
      listeners: [...registrations.values()].reduce(
        (count, groups) =>
          count +
          [...groups.values()].reduce((sum, entries) => sum + entries.size, 0),
        0,
      ),
      canvases: canvases.map((state) => ({
        type: state.type,
        connected: state.canvas.isConnected,
        draws: state.draws,
        invalidDraws: state.invalidDraws,
        programs: state.programs.size,
        shaders: state.shaders.size,
        buffers: state.buffers.size,
      })),
    });
  });
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const state = () => page.evaluate(() => window.webglAudit());
  const nav = () =>
    page.getByRole("navigation", { name: "Lifecycle navigation" });
  const ready = async () => {
    await nav().waitFor();
    await page.waitForFunction(
      () =>
        window
          .webglAudit()
          .canvases.filter((state) => state.connected && state.draws > 0)
          .length === 2,
      null,
      { polling: 30 },
    );
  };
  try {
    await page.goto(origin);
    await ready();
    await nav().getByRole("button", { name: "Beta", exact: true }).click();
    await page.waitForTimeout(80);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    const paused = await state();
    await page.waitForTimeout(160);
    const held = await state();
    assert(held.pending === 0, "Blur retains a scheduled animation loop");
    assert(
      JSON.stringify(held.canvases.map((canvas) => canvas.draws)) ===
        JSON.stringify(paused.canvases.map((canvas) => canvas.draws)),
      "An engine redraws while blurred",
    );
    await page.evaluate(() => {
      window.dispatchEvent(new Event("focus"));
      window.dispatchEvent(new Event("focus"));
    });
    await page.waitForFunction(
      () =>
        window
          .webglAudit()
          .canvases.every((canvas) => !canvas.connected || canvas.draws > 1),
      null,
      { polling: 30 },
    );
    assert((await state()).pending <= 2, "Focus duplicates animation loops");
    for (const type of ["webgl2", "webgl"]) {
      const supported = await page.evaluate((type) => {
        const canvas =
          type === "webgl2"
            ? document.querySelector("nav canvas")
            : document.querySelector('[data-slot="live-orb"] canvas');
        const gl = canvas.getContext(type);
        window.auditLost = gl.getExtension("WEBGL_lose_context");
        window.auditLost?.loseContext();
        return !!window.auditLost;
      }, type);
      assert(supported, `${type} context-loss extension unavailable`);
      await page.waitForFunction(
        (type) =>
          type === "webgl2"
            ? getComputedStyle(document.querySelector("nav canvas + span"))
                .display === "block"
            : getComputedStyle(
                document.querySelector('[data-slot="live-orb"] canvas'),
              ).visibility === "hidden",
        type,
        { polling: 30 },
      );
      await page.waitForTimeout(60);
      if (type === "webgl2") {
        await nav().getByRole("button", { name: "Gamma", exact: true }).click();
        const width = await page
          .locator("nav canvas + span")
          .evaluate((element) => element.getBoundingClientRect().width);
        assert(width > 0, "Lost-context navigation has no visible static pill");
        assert(
          (await nav()
            .getByRole("button", { name: "Gamma", exact: true })
            .getAttribute("aria-current")) === "page",
          "Lost-context navigation lost its selected item",
        );
      }
      await page.evaluate(() => window.auditLost.restoreContext());
      await page.waitForFunction(
        (type) =>
          type === "webgl2"
            ? getComputedStyle(document.querySelector("nav canvas")).display ===
              "block"
            : getComputedStyle(
                document.querySelector('[data-slot="live-orb"] canvas'),
              ).visibility === "visible",
        type,
        { polling: 30 },
      );
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(150);
    assert(
      (await state()).pending === 0,
      "Reduced motion keeps a continuous frame loop",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await ready();
    await page.evaluate(() =>
      scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.waitForTimeout(150);
    assert((await state()).pending === 0, "Offscreen engines keep rendering");
    await page.evaluate(() => scrollTo(0, 0));
    await ready();
    for (let attempt = 0; attempt < 3; attempt++) {
      await page
        .getByRole("button", { name: "Unmount engines", exact: true })
        .click();
      await nav().waitFor({ state: "hidden" });
      await page.waitForTimeout(80);
      const stopped = await state();
      assert(stopped.pending === 0, "Unmount retains a frame loop");
      assert(
        stopped.observers === 0 && stopped.listeners === 0,
        `Unmount retains observers/listeners: ${JSON.stringify(stopped)}`,
      );
      assert(
        stopped.canvases.every(
          (canvas) =>
            canvas.programs === 0 &&
            canvas.shaders === 0 &&
            canvas.buffers === 0 &&
            canvas.invalidDraws === 0,
        ),
        `Unmount leaks resources or draws to an invalid canvas: ${JSON.stringify(stopped)}`,
      );
      await page
        .getByRole("button", { name: "Mount engines", exact: true })
        .click();
      await ready();
    }
    for (const fault of ["no-gl", "buffer"]) {
      await page.goto(`${origin}/?fault=${fault}`);
      await nav().waitFor();
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector("nav canvas + span"))
            .display === "block",
        null,
        { polling: 30 },
      );
      assert(
        (await page
          .locator('[data-slot="live-orb"] > div[aria-hidden]')
          .count()) === 1,
        `${fault}: Orb fallback is absent`,
      );
      await nav().getByRole("button", { name: "Gamma", exact: true }).click();
      await nav().getByRole("button", { name: "Gamma", exact: true }).focus();
      assert(
        (await nav()
          .getByRole("button", { name: "Gamma", exact: true })
          .getAttribute("aria-current")) === "page",
        `${fault}: Fallback controls fail`,
      );
      await page
        .getByRole("button", { name: "Unmount engines", exact: true })
        .click();
      await page.waitForTimeout(80);
      const failed = await state();
      assert(
        failed.pending === 0 &&
          failed.observers === 0 &&
          failed.listeners === 0 &&
          failed.canvases.every(
            (canvas) => !canvas.programs && !canvas.shaders && !canvas.buffers,
          ),
        `${fault}: Failed setup leaks resources`,
      );
    }
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      checks: [
        "StrictMode mount",
        "blur freeze",
        "single-loop focus resume",
        "both context restores",
        "reduced motion",
        "offscreen pause",
        "repeated mount/unmount resource cleanup",
        "listener/observer cleanup",
        "no-WebGL fallback",
        "partial allocation fallback",
      ],
      errors,
    };
  } finally {
    await context.close();
  }
}
