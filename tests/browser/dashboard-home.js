async function dashboardHome(sessionPage) {
  const origin = new URL(sessionPage.url()).origin;
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  const reset = async () => {
    await page.goto(origin);
    await page.getByRole("tab", { name: "Hero", exact: true }).waitFor();
  };
  const calls = () => page.evaluate(() => window.homeFixture.calls);
  const results = [];
  try {
    for (const [width, height] of [
      [1440, 1000],
      [1024, 900],
      [768, 1024],
      [390, 844],
      [360, 800],
      [320, 740],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      await reset();
      assert((await page.getByRole("tab").count()) === 3, "Legacy tab remains");
      for (const tab of ["Hero", "Approach", "Tech stack"]) {
        await page.getByRole("tab", { name: tab, exact: true }).click();
        await page.waitForFunction(
          (name) =>
            [...document.querySelectorAll('[role="tab"]')].some(
              (el) =>
                el.textContent === name &&
                el.getAttribute("aria-selected") === "true",
            ),
          tab,
        );
        await page.evaluate(
          () =>
            new Promise((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(resolve)),
            ),
        );
        if (tab === "Tech stack")
          await page
            .getByRole("heading", { name: "TypeScript", exact: true })
            .waitFor();
        const geometry = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          words: [...document.querySelectorAll("h3")]
            .filter(
              (e) =>
                e.getBoundingClientRect().height > 0 &&
                ["TypeScript", "PostgreSQL", "Next.js", "Node.js"].includes(
                  e.textContent,
                ),
            )
            .map((e) => ({
              name: e.textContent,
              height: e.getBoundingClientRect().height,
              line: parseFloat(getComputedStyle(e).lineHeight),
            })),
          targets: [
            ...document.querySelectorAll(
              'button[aria-label^="Open actions"],button[aria-label^="Drag "]',
            ),
          ]
            .filter((e) => e.getBoundingClientRect().height > 0)
            .map((e) => ({
              w: e.getBoundingClientRect().width,
              h: e.getBoundingClientRect().height,
            })),
        }));
        assert(!geometry.overflow, `${tab}: overflow at ${width}`);
        assert(
          geometry.words.every((w) => w.height <= w.line * 1.2),
          `${tab}: fragmented technology name at ${width}`,
        );
        if (width < 768)
          assert(
            geometry.targets.every((t) => t.w >= 44 && t.h >= 44),
            `${tab}: small touch targets`,
          );
        results.push({ width, tab, ...geometry });
        if ([1440, 360, 320].includes(width))
          await page.screenshot({
            path: `task/dashboard-home-polish/${tab.replaceAll(" ", "-").toLowerCase()}-${width}.png`,
            fullPage: true,
            caret: "initial",
          });
      }
    }
    await page.setViewportSize({ width: 360, height: 800 });
    await reset();
    const headline = page.getByRole("textbox", {
      name: "Headline",
      exact: true,
    });
    await headline.fill("Unsaved headline retained across tabs");
    await page.getByRole("tab", { name: "Approach", exact: true }).click();
    await page.getByRole("tab", { name: "Hero", exact: true }).click();
    assert(
      (await headline.inputValue()) === "Unsaved headline retained across tabs",
      "Tab switch lost draft",
    );

    await page
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    assert(
      (await headline.inputValue()) === "I build thoughtful web applications.",
      "Discard must restore saved headline",
    );
    await page.evaluate(() => {
      window.homeFixture.mode = "failure";
    });
    await headline.fill("Retry headline");
    await page
      .getByRole("button", { name: "Save headline", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: /could not save/i })
      .waitFor();
    assert(
      (await headline.inputValue()) === "Retry headline",
      "Failed save lost draft",
    );
    await page.evaluate(() => {
      window.homeFixture.mode = "success";
    });
    await page
      .getByRole("button", { name: "Save headline", exact: true })
      .click();
    await page.waitForFunction(
      () => window.homeFixture.records.headline === "Retry headline",
    );
    await page.getByRole("tab", { name: "Tech stack", exact: true }).click();
    assert(
      (await page.locator('[data-logo-source="builtin"]:visible').count()) >= 5,
      "Built-in logo previews missing",
    );
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    const up = page.getByRole("button", { name: "Move React up", exact: true });
    await up.click();
    await page.waitForFunction(
      () =>
        window.homeFixture.records.logos.find((r) => r.label === "React")
          .order === 0,
    );
    await page.evaluate(() => {
      window.homeFixture.mode = "failure";
    });
    await page
      .getByRole("button", { name: "Move Next.js up", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: /could not save/i })
      .waitFor();
    assert(
      (await page.locator("h3:visible").first().textContent()) === "React",
      "Failed reorder must roll back",
    );
    await page.evaluate(() => {
      window.homeFixture.mode = "success";
    });
    await page
      .getByRole("button", { name: "Retry order save", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        window.homeFixture.records.logos.find((r) => r.label === "Next.js")
          .order === 0,
    );
    // Exercise the sortable component's optimistic rollback, not only Move up.
    await page.evaluate(() => {
      window.homeFixture.mode = "throw";
    });
    const handle = page.getByRole("button", {
      name: "Drag Next.js to reorder",
      exact: true,
    });
    await handle.focus();
    await page.keyboard.press("Space");
    await page.waitForFunction(
      () =>
        document
          .querySelector('button[aria-label="Drag Next.js to reorder"]')
          ?.getAttribute("aria-pressed") === "true",
    );
    await page.keyboard.press("ArrowDown");
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    await page.keyboard.press("Space");
    await page
      .getByRole("alert")
      .filter({ hasText: "Could not save the order" })
      .waitFor();
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("h3")].filter(
          (el) => el.getBoundingClientRect().height,
        )[0]?.textContent === "Next.js",
    );
    assert(
      (await page.locator("h3:visible").first().textContent()) === "Next.js",
      "Keyboard reorder failure must restore order",
    );
    await page.evaluate(() => {
      window.homeFixture.mode = "success";
    });
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Open actions for TypeScript", exact: true })
      .click();
    await page.getByText("Edit", { exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    const footer = await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .evaluate((el) => ({
        bottom: el.getBoundingClientRect().bottom,
        top: el.getBoundingClientRect().top,
        height: innerHeight,
      }));
    assert(
      footer.top >= 0 && footer.bottom <= footer.height,
      "Dialog Save must stay within viewport",
    );
    await page
      .getByRole("textbox", { name: "Logo name", exact: true })
      .fill("React");

    await page.keyboard.press("Escape");
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-cancel"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    assert(await dialog.isVisible(), "Cancelling discard must preserve dialog");
    assert(
      (await page
        .getByRole("textbox", { name: "Logo name", exact: true })
        .inputValue()) === "React",
      "Discard cancellation lost form",
    );
    await page.evaluate(() => {
      window.homeFixture.mode = "deferred";
    });
    await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await page.waitForFunction(() => window.homeFixture.pending.length === 1);
    await page.keyboard.press("Escape");
    assert(await dialog.isVisible(), "Pending save should not close");
    await page.evaluate(() => window.homeFixture.pending.shift()());
    await dialog.waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Add Logo", exact: true }).click();
    await dialog.waitFor();
    const picker = dialog.getByRole("button", { name: /upload/i }).first();
    await picker.waitFor();
    const chooser = page.waitForEvent("filechooser");
    await picker.focus();
    await page.keyboard.press("Enter");
    await chooser;
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    await page.goto(origin + "/previous");
    await page.getByRole("link", { name: "Open Home", exact: true }).click();
    const restoredHeadline = page.getByRole("textbox", {
      name: "Headline",
      exact: true,
    });
    await restoredHeadline.fill("Headline survives browser history");
    await page.goBack();
    await page
      .getByRole("heading", { name: "Previous page", exact: true })
      .waitFor();
    await page.goForward();
    await restoredHeadline.waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector("#hero-headline")?.value ===
        "Headline survives browser history",
    );
    assert(
      (await restoredHeadline.inputValue()) ===
        "Headline survives browser history",
      "History navigation lost draft",
    );

    await page
      .getByRole("button", { name: "Discard changes", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page.getByRole("tab", { name: "Tech stack", exact: true }).click();
    await page
      .getByRole("button", { name: "Open actions for Next.js", exact: true })
      .click();
    await page.getByText("Edit", { exact: true }).click();
    await page
      .getByRole("textbox", { name: "Logo name", exact: true })
      .fill("React");
    await page.goBack();
    await page
      .getByRole("heading", { name: "Previous page", exact: true })
      .waitFor();
    await page.goForward();
    await page.getByRole("tab", { name: "Tech stack", exact: true }).click();
    await page
      .getByRole("button", { name: "Open actions for Next.js", exact: true })
      .click();
    await page.getByText("Edit", { exact: true }).click();
    await page.waitForFunction(() =>
      [...document.querySelectorAll("input")].some(
        (el) => el.id.endsWith("-label") && el.value === "React",
      ),
    );
    assert(
      (await page
        .getByRole("textbox", { name: "Logo name", exact: true })
        .inputValue()) === "React",
      "History navigation lost section draft",
    );

    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      layouts: results.length,
      heroDraft: true,
      builtinPreviews: true,
      calls: (await calls()).length,
      dialogRecovery: true,
      keyboardUpload: true,
      reorderRetry: true,
      historyDraft: true,
      sectionHistoryDraft: true,
      errors,
    };
  } finally {
    page.on("dialog", (d) => d.accept());
    await context.close();
  }
}
