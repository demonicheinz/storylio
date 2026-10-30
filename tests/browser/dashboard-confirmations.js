async function dashboardConfirmations(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  const native = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.text().includes("Blocked aria-hidden"))
      errors.push(message.text());
  });
  page.on("dialog", async (dialog) => {
    native.push(dialog.type());
    await dialog.dismiss();
  });
  try {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      await page.goto("http://127.0.0.1:3201");
      const name =
        "long-descriptive-filename-for-an-interface-design-image-with-context.webp";
      await page
        .getByRole("button", { name: `Open actions for ${name}`, exact: true })
        .filter({ visible: true })
        .click();
      await page.getByRole("menuitem", { name: "Rename", exact: true }).click();
      const rename = page.getByRole("dialog", {
        name: "Rename media",
        exact: true,
      });
      const input = rename.getByRole("textbox", {
        name: "File name",
        exact: true,
      });
      await input.fill("Unsaved name.webp");
      await page.keyboard.press("Escape");
      const confirm = page.getByRole("alertdialog", {
        name: "Discard unsaved changes?",
        exact: true,
      });
      await confirm.waitFor();
      await page.screenshot({
        path: `task/code-standardization/confirmation-discard-${width}.png`,
      });
      const keep = confirm.getByRole("button", {
        name: "Keep editing",
        exact: true,
      });
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Keep editing",
      );
      await page.keyboard.press("Escape");
      await confirm.waitFor({ state: "hidden" });
      if (
        !(await input.evaluate((element) => element === document.activeElement))
      )
        throw Error("Cancel did not restore focus to the dirty field");
      if ((await input.inputValue()) !== "Unsaved name.webp")
        throw Error("Escape discarded parent draft");
      await page.keyboard.press("Escape");
      await confirm.waitFor();
      await keep.click();
      await confirm.waitFor({ state: "hidden" });
      if (!(await rename.isVisible()))
        throw Error("Cancel closed the parent dialog");
      await page.keyboard.press("Escape");
      await confirm.waitFor();
      await confirm
        .getByRole("button", { name: "Discard changes", exact: true })
        .click();
      await rename.waitFor({ state: "hidden" });
      if (
        await page.evaluate(() =>
          window.mediaCalls.some((call) => call.name === "rename"),
        )
      )
        throw Error("Discard submitted a rename");
    }
    await page.goto("http://127.0.0.1:3205/?kind=confirmation");
    const before = await page.evaluate(() => {
      const event = new Event("beforeunload", { cancelable: true });
      window.dispatchEvent(event);
      return event.defaultPrevented;
    });
    if (!before)
      throw Error("Native unload protection was removed from dirty drafts");
    await page
      .getByRole("link", { name: "Same-page anchor", exact: true })
      .click();
    if (await page.getByRole("alertdialog").count())
      throw Error("Same-page anchor opened confirmation");
    await page.getByRole("link", { name: "Leave editor", exact: true }).click();
    const leave = page.getByRole("alertdialog", {
      name: "Leave this page?",
      exact: true,
    });
    await leave.waitFor();
    if ((await page.locator("[data-navigation-count]").textContent()) !== "0")
      throw Error("Navigation occurred before a decision");
    await leave
      .getByRole("button", { name: "Keep editing", exact: true })
      .click();
    await leave.waitFor({ state: "hidden" });
    if (
      (await page
        .getByRole("textbox", { name: "Fixture draft" })
        .inputValue()) !== "Keep this draft"
    )
      throw Error("Cancel lost the draft");
    await page.getByRole("link", { name: "Leave editor", exact: true }).click();
    await leave
      .getByRole("button", { name: "Leave page", exact: true })
      .click();
    await page.waitForFunction(
      () =>
        document.querySelector("[data-navigation-count]").textContent === "1",
    );
    if (await page.getByRole("alertdialog").count())
      throw Error("Multiple dirty guards asked twice");
    await page.getByRole("button", { name: "Mark saved", exact: true }).click();
    if (
      await page.evaluate(() => {
        const event = new Event("beforeunload", { cancelable: true });
        window.dispatchEvent(event);
        return event.defaultPrevented;
      })
    )
      throw Error("Clean editor retained unload protection");
    await page.getByRole("link", { name: "Leave editor", exact: true }).click();
    if ((await page.locator("[data-navigation-count]").textContent()) !== "2")
      throw Error("Clean navigation was blocked");
    if (native.length)
      throw Error("Native dialogs appeared: " + native.join(", "));
    if (errors.length) throw Error(errors.join("; "));
    return {
      passed: true,
      checks: [
        "nested discard",
        "Escape keeps draft",
        "Cancel keeps parent",
        "Confirm discards",
        "cancel initial focus",
        "no native dialogs",
        "guarded link replay once",
        "duplicate dirty guards coalesced",
        "native unload protection retained",
      ],
    };
  } finally {
    await context.close();
  }
}
