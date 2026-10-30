async function postScheduling(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ timezoneId: "Asia/Bangkok", reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const results = [];
  try {
    await page.clock.install();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/?editor=scheduled`);
    await page
      .getByRole("textbox", { name: "Post content", exact: true })
      .waitFor();
    await page.getByText("Scheduled", { exact: true }).first().waitFor();
    const before = await page.evaluate(() => window.persistedPost.publishedAt);
    const trigger = page.getByRole("button", {
      name: "Publication date and time",
      exact: true,
    });
    await trigger.click();
    const picker = page.getByRole("dialog", {
      name: "Choose date and time",
      exact: true,
    });
    await picker.waitFor();
    const rect = await picker.evaluate((el) => ({
      top: el.getBoundingClientRect().top,
      bottom: el.getBoundingClientRect().bottom,
      viewport: innerHeight,
    }));
    assert(
      rect.top >= 0 && rect.bottom <= rect.viewport,
      "Picker still exceeds viewport",
    );
    await page
      .getByRole("button", { name: "Next month", exact: true })
      .waitFor();
    await page
      .getByRole("combobox", { name: "Hour", exact: true })
      .selectOption("13");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("Changed content with pending schedule");
    await page.clock.fastForward(30_100);
    await page.waitForFunction(() =>
      window.postCalls?.some((call) => call.name === "autosave"),
    );
    assert(
      (await page.evaluate(() => window.persistedPost.publishedAt)) === before,
      "Autosave modified publication date",
    );
    await page.getByText("Unsaved changes", { exact: true }).waitFor();
    assert(
      await page
        .getByRole("button", { name: "Save schedule", exact: true })
        .isVisible(),
      "Pending schedule not explicit",
    );
    await page
      .getByRole("button", { name: "Save schedule", exact: true })
      .click();
    await page.getByText("All changes saved", { exact: true }).waitFor();
    const after = await page.evaluate(() => window.persistedPost.publishedAt);
    assert(
      after !== before && Number.isFinite(Date.parse(after)),
      "Explicit schedule did not save",
    );
    results.push({ autosavePreserved: before, explicitSchedule: after });
    await page
      .getByRole("button", {
        name: "Use current time (publish now)",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Publish now", exact: true })
      .click();
    await page.getByText("All changes saved", { exact: true }).waitFor();
    assert(
      await page.evaluate(
        () =>
          new Date(window.persistedPost.publishedAt).getTime() <= Date.now(),
      ),
      "Publish now did not clear future scheduling",
    );
    await page.evaluate(() => (window.confirm = () => true));
    await page
      .getByRole("button", { name: "Publishing options", exact: true })
      .click();
    await page
      .getByRole("menuitem", { name: "Move to draft…", exact: true })
      .click();
    await page.getByText("All changes saved", { exact: true }).waitFor();
    assert(
      (await page.evaluate(() => window.persistedPost)).publishedAt === null,
      "Withdrawing publication retained its date",
    );
    await trigger.click();
    await picker.waitFor();
    await page.getByRole("button", { name: "Next month", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Hour", exact: true })
      .selectOption("14");
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.getByText("Unsaved changes", { exact: true }).waitFor();
    const draft = await page.evaluate(() => ({
      stored: window.persistedPost,
      plan: sessionStorage.getItem("storylio:post-schedule:saved"),
    }));
    assert(
      draft.stored.publishedAt === null && draft.plan,
      "Inactive draft plan was either activated or lost",
    );
    await page.goto(`${origin}/?picker`);
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 700 });
      const button = page.getByRole("button", {
        name: "Publication date",
        exact: true,
      });
      await button.click();
      await picker.waitFor();
      const bounds = await picker.evaluate((el) => ({
        top: el.getBoundingClientRect().top,
        bottom: el.getBoundingClientRect().bottom,
        left: el.getBoundingClientRect().left,
        right: el.getBoundingClientRect().right,
        height: innerHeight,
        width: innerWidth,
      }));
      assert(
        bounds.top >= 0 &&
          bounds.bottom <= bounds.height &&
          bounds.left >= 0 &&
          bounds.right <= bounds.width,
        `Picker collision ${width}: ${JSON.stringify(bounds)}`,
      );
      await page.screenshot({
        path: `task/dashboard-posts-review/updated-picker-${width}.png`,
      });
      await page.keyboard.press("Escape");
      await picker.waitFor({ state: "hidden" });
      assert(
        await button.evaluate((el) => el === document.activeElement),
        "Picker did not restore focus",
      );
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${origin}/?due`);
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: "Scheduled", exact: true }).click();
    await page.getByRole("link", { name: "Post 2", exact: true }).waitFor();
    await page.clock.fastForward(61_000);
    await page
      .getByRole("link", { name: "Post 2", exact: true })
      .waitFor({ state: "hidden" });
    return {
      passed: true,
      results,
      checks: [
        "viewport collision",
        "named controls",
        "autosave preserves intent",
        "explicit schedule",
        "publish now",
        "Escape focus return",
      ],
    };
  } finally {
    await context.close();
  }
}
