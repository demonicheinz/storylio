// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async (sessionPage) => {
  const origin = new URL(sessionPage.url()).origin;
  const page = await sessionPage.context().newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const measurements = [];
  let stage = "layout";
  try {
    await page.goto(origin);
    await page.locator("[data-home-page]").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForFunction(() => {
      const root = document.querySelector("[data-home-page]");
      return (
        root &&
        root.getBoundingClientRect().top >= -1 &&
        [...root.parentElement.children].length > 0 &&
        getComputedStyle(root.parentElement).opacity === "1"
      );
    });
    for (const [width, height] of [
      [1440, 1000],
      [1024, 900],
      [768, 1024],
      [390, 844],
      [320, 740],
      [1440, 600],
    ]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForFunction(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      );
      const result = await page.evaluate(() => {
        const grid = document.querySelector("[data-home-grid=projects]");
        const footer = document.querySelector("[data-home-footer]");
        const hero = document.getElementById("home-title");
        const cta = document.querySelector("[data-venom-link]");
        return {
          width: innerWidth,
          height: innerHeight,
          columns: grid
            ? getComputedStyle(grid).gridTemplateColumns.split(" ").length
            : 0,
          projects: grid?.children.length ?? 0,
          h1Size: getComputedStyle(hero).fontSize,
          ctaHeight: cta.getBoundingClientRect().height,
          footerPosition: getComputedStyle(footer).position,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          phaseDescriptions: [
            ...document.querySelectorAll(
              '[aria-labelledby="approach-title"] li p',
            ),
          ].map((p) => ({
            text: p.textContent,
            display: getComputedStyle(p).display,
          })),
        };
      });
      assert(!result.overflow, "Horizontal overflow at " + width);
      assert(result.projects <= 3, "Home project limit");
      assert(
        result.columns === (width >= 1200 ? 3 : width >= 768 ? 2 : 1),
        "Wrong columns at " + width,
      );
      assert(result.ctaHeight >= 44, "CTA target below 44px");
      assert(
        result.phaseDescriptions.every((p) => p.display !== "none"),
        "Approach needs interaction to read",
      );
      if (height < 800 || width < 1024)
        assert(
          result.footerPosition === "relative",
          "Short/mobile footer must follow normal flow",
        );
      measurements.push(result);
      if ((width === 1440 && height === 1000) || width === 390) {
        // Visit lazy media before taking a full-page capture.
        await page.evaluate(async () => {
          for (const image of document.querySelectorAll("[data-home-page] img")) {
            image.loading = "eager";
            await image.decode().catch(() => {});
          }
        });
        await page.waitForFunction(() => {
          const link = document.querySelector("[data-venom-link]");
          return link?.dataset.venomReady === "true" || !document.querySelector("[data-venom-canvas]");
        });
        await page.waitForFunction(() => document.querySelector('[data-home-hero]')?.dataset.introComplete === 'true');
        await page.waitForTimeout(300); // Finish the CSS-to-WebGL crossfade.
        await page.screenshot({
          path: ".playwright-cli/home-redesign-" + width + "-hero.png",
        });
        await page.screenshot({
          path: ".playwright-cli/home-redesign-" + width + "-full.png",
          fullPage: true,
        });
        await page
          .locator("[data-home-footer-wrapper]")
          .evaluate((el) =>
            el.scrollIntoView({ block: "end", behavior: "instant" }),
          );
        await page.screenshot({
          path: ".playwright-cli/home-redesign-" + width + "-footer.png",
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const reducedMotion of ["no-preference", "reduce"]) {
      stage = "anchor " + reducedMotion;
      await page.emulateMedia({ reducedMotion });
      const targetY = await page.evaluate(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        const samples = [];
        const record = () => samples.push(window.scrollY);
        window.addEventListener("scroll", record);
        window.__finishScrollCheck = () => {
          window.removeEventListener("scroll", record);
          delete window.__finishScrollCheck;
          return samples;
        };
        return document.getElementById("selected-projects").getBoundingClientRect().top;
      });
      const behavior = await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior);
      const lenisActive = await page.locator('html.lenis').count() > 0;
      assert(behavior === (reducedMotion === "reduce" || lenisActive ? "auto" : "smooth"), "Competing smoothing or incorrect motion preference for anchors");
      await page.locator('a[href="#selected-projects"]').click();
      await page.waitForFunction(y => Math.abs(scrollY - y) < 2, targetY);
      const samples = await page.evaluate(() => window.__finishScrollCheck());
      const intermediate = samples.some(y => y > 1 && y < targetY - 2);
      assert(reducedMotion === "reduce" ? !intermediate : intermediate, "Anchor did not follow motion preference");
      assert(await page.getByRole("button", { name: "Scroll to top", exact: true }).count() === 0, "Home renders a duplicate floating top control");
      // Let the interpolator finish before the test performs a native scroll jump.
      await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-scrolling'));
      await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      stage = "footer top " + reducedMotion;
      await page.locator('a[href="#home-title"]').click();
      await page.waitForFunction(() => scrollY < 1);
      measurements.push({ reducedMotion, behavior, intermediate, backToTop: true });
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    stage = "remaining Home regression";
    await page.evaluate(() =>
      document.documentElement.classList.remove("dark"),
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: ".playwright-cli/home-redesign-light.png",
      fullPage: true,
    });
    assert(
      (await page
        .locator("[data-home-footer]")
        .evaluate((el) => getComputedStyle(el).position)) === "relative",
      "Reduced motion curtain still fixed",
    );
    await page.evaluate(() => document.documentElement.classList.add("dark"));
    // Keyboard focus must reveal the entire footer, even while it is partially revealed.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page
      .locator("[data-home-footer-wrapper]")
      .evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    const footerLink = page
      .getByRole("navigation", { name: "Footer navigation" })
      .getByRole("link", { name: "Projects", exact: true });
    await footerLink.focus();
    await page.keyboard.press("ArrowRight");
    const focus = await footerLink.evaluate((el) => {
      const box = el.getBoundingClientRect(),
        wrapper = document
          .querySelector("[data-home-footer-wrapper]")
          .getBoundingClientRect();
      return {
        visible:
          box.top >= Math.max(0, wrapper.top) && box.bottom <= innerHeight,
        outline: getComputedStyle(el).outlineStyle,
      };
    });
    assert(
      focus.visible && focus.outline !== "none",
      "Footer keyboard focus is clipped/invisible",
    );
    await footerLink.click();
    await page.waitForURL(origin + "/projects");
    assert(
      (await page.locator("[data-home-footer]").count()) === 0,
      "Home footer leaked to Projects",
    );
    assert(
      (await page.locator("footer").count()) === 1,
      "Duplicate footer on Projects",
    );
    await page.goBack();
    await page.locator("[data-home-page]").waitFor();
    assert(
      (await page.locator("footer").count()) === 1,
      "Duplicate footer on Home after Back",
    );
    const missing = await page.request.get(
      origin + "/blog/home-redesign-missing-post",
    );
    assert(missing.status() === 404, "Missing post lost HTTP 404");
    const touchContext = await page.context().browser().newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    try {
      const touch = await touchContext.newPage();
      touch.on("pageerror", error => errors.push(error.message));
      await touch.goto(origin);
      await touch.locator("[data-home-page]").waitFor();
      await touch.evaluate(() => document.fonts.ready);
      await touch.locator('[aria-labelledby="home-title"] img').evaluate(image => image.decode());
      await touch.waitForFunction(() => getComputedStyle(document.querySelector("[data-home-page]").parentElement).opacity === "1");
      assert(await touch.locator("[data-venom-canvas]").count() === 0, "Touch loaded the Venom renderer");
      await touch.screenshot({ path: ".playwright-cli/home-redesign-touch.png" });
      await touch.locator("[data-venom-link]").tap();
      await touch.waitForURL(origin + "/#selected-projects");
      await touch.waitForFunction(() => Math.abs(document.getElementById("selected-projects").getBoundingClientRect().top) < 2);
    } finally { await touchContext.close(); }
    const fallback = await page.context().newPage();
    try {
      await fallback.route("**/_next/image?**", route => route.fulfill({ status: 404, body: "Unavailable" }));
      await fallback.goto(origin);
      await fallback.locator("#selected-projects").scrollIntoViewIfNeeded();
      await fallback.getByText("Project preview unavailable").first().waitFor();
    } finally { await fallback.close(); }
    const staticContext = await page.context().browser().newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 1000 } });
    try {
      const staticPage = await staticContext.newPage();
      await staticPage.goto(origin);
      // Next streams this SSR markup into hidden slots until its bootstrap runs.
      // Verify markup/fallback styles; full no-JS navigation is outside this redesign.
      await staticPage.locator("#home-title").waitFor({ state: "attached" });
      await staticPage.locator("[data-home-footer] h2").waitFor({ state: "attached" });
      assert(await staticPage.locator("[data-home-footer]").evaluate(el => getComputedStyle(el).position) === "relative", "SSR footer is fixed without JS");
      assert(await staticPage.locator("[data-venom-link]").evaluate(el => getComputedStyle(el).color) !== "rgba(0, 0, 0, 0)", "SSR CTA label is hidden");
    } finally { await staticContext.close(); }
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      measurements,
      focus,
      missingStatus: missing.status(),
      touch: true,
      failedCover: true,
      serverMarkup: true,
      errors,
    };
  } catch (error) {
    await page.screenshot({ path: ".playwright-cli/home-redesign-failure.png" });
    error.message += "\nStage: " + stage + "\nURL: " + page.url() + "\nHeadings: " + JSON.stringify(await page.locator("h1").allTextContents()) + "\nScroll: " + await page.evaluate(() => JSON.stringify({y:scrollY,target:document.getElementById("selected-projects")?.getBoundingClientRect().top}));
    throw error;
  } finally {
    await page.close();
  }
}
