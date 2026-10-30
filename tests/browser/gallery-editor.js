async function galleryEditor(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = "http://127.0.0.1:3207";
  const errors = [];
  const external = [];
  const prompts = [];
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  page.on("pageerror", (error) => errors.push(error.message));

  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  const dialog = page.getByRole("dialog");
  const caption = () =>
    dialog.getByRole("textbox", { name: "Caption", exact: true });
  const open = async (name = "Edit fixture") => {
    await page.getByRole("button", { name, exact: true }).click();
    await dialog.waitFor();
  };
  const file = {
    name: "fixture.gif",
    mimeType: "image/gif",
    buffer: Buffer.from("GIF89a"),
  };
  const results = [];
  try {
    await page.goto(origin);
    await open();
    assert(
      (await caption().inputValue()) === "Original caption",
      "Edit defaults missing",
    );
    assert(
      (await dialog.getByRole("spinbutton").count()) === 0,
      "Numeric order remains",
    );
    const editId = await caption().getAttribute("id");
    assert(
      (await dialog
        .getByRole("combobox", { name: "Category (required)", exact: true })
        .count()) === 1,
      "Category must be one named input",
    );
    assert(
      (await dialog.locator("datalist option").count()) === 2,
      "Categories should deduplicate",
    );
    await caption().fill("Draft to keep");
    const dismissals = [
      () => dialog.getByRole("button", { name: "Cancel", exact: true }).click(),
      () => page.keyboard.press("Escape"),
      () => page.mouse.click(2, 2),
      () => dialog.getByRole("button", { name: "Close", exact: true }).click(),
    ];
    for (const dismiss of dismissals) {
      const before = prompts.length;
      await dismiss();
      const confirmation = page.getByRole("alertdialog", {
        name: "Discard unsaved changes?",
        exact: true,
      });
      await confirmation.waitFor();
      prompts.push(await confirmation.textContent());
      await confirmation.locator('[data-slot="alert-dialog-cancel"]').click();
      await confirmation.waitFor({ state: "hidden" });
      await page.waitForFunction(
        () =>
          document.querySelector('[role="dialog"] textarea')?.value ===
          "Draft to keep",
      );
      assert(prompts.length === before + 1, "Dismissal did not ask to discard");
      assert(
        (await caption().inputValue()) === "Draft to keep",
        "Dismissal lost draft",
      );
    }
    results.push("Cancel/Escape/backdrop/Close keep-editing guard");
    await page.evaluate(() =>
      window.galleryEditor.updateItem({
        caption: "Refreshed caption",
        category: "Texture",
        order: 9,
      }),
    );
    assert(
      (await caption().inputValue()) === "Draft to keep",
      "Prop refresh overwrote dirty draft",
    );

    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await dialog.waitFor({ state: "hidden" });
    await open();
    assert(
      (await caption().inputValue()) === "Refreshed caption",
      "Reopen missed latest props",
    );
    results.push("Dirty refresh preserved; reopen reconciles current props");

    await caption().fill("Transport draft");
    await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await dialog
      .getByRole("alert")
      .filter({ hasText: "Your input is kept" })
      .waitFor();
    assert(
      (await caption().inputValue()) === "Transport draft",
      "Transport error lost draft",
    );
    assert(
      (await page.evaluate(
        () => window.galleryEditor.calls.at(-1).values.order,
      )) === 9,
      "Edit order changed",
    );
    await page.evaluate(() => {
      window.galleryEditor.saveResult = "field";
    });
    await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await dialog
      .getByText("Fixture caption rejected.", { exact: true })
      .waitFor();
    const linked = await dialog.evaluate((element) =>
      [...element.querySelectorAll('[aria-invalid="true"]')].every((field) => {
        const ids =
          field.getAttribute("aria-describedby")?.trim().split(/\s+/) ?? [];
        return ids.some((id) =>
          document.getElementById(id)?.textContent?.includes("Fixture"),
        );
      }),
    );
    assert(
      linked,
      "Server errors must describe invalid fields, including image group",
    );
    results.push(
      "Transport draft retention and associated server errors; silent edit order",
    );

    await page.evaluate(() => {
      window.galleryEditor.saveResult = "success";
      window.galleryEditor.deferSave = true;
    });
    await dialog
      .getByRole("button", { name: "Save Changes", exact: true })
      .click();
    await dialog
      .getByRole("button", { name: "Saving...", exact: true })
      .waitFor();
    const saveCount = await page.evaluate(
      () => window.galleryEditor.calls.length,
    );
    await dialog.locator("form").evaluate((form) => form.requestSubmit());
    const pendingPrompts = prompts.length;
    for (const dismiss of [dismissals[1], dismissals[2], dismissals[3]])
      await dismiss();

    assert(await dialog.isVisible(), "Saving dialog dismissed");
    assert(
      prompts.length === pendingPrompts,
      "Saving should block, not offer discard",
    );
    assert(
      await dialog
        .getByRole("button", { name: "Cancel", exact: true })
        .isDisabled(),
      "Cancel enabled during save",
    );
    assert(
      (await page.evaluate(() => window.galleryEditor.calls.length)) ===
        saveCount,
      "Duplicate save escaped pending lock",
    );
    await page.evaluate(() => window.galleryEditor.releaseSave());
    await dialog.waitFor({ state: "hidden" });
    assert(
      (await page.evaluate(() => window.galleryEditor.refreshes)) === 1,
      "Success did not refresh",
    );
    results.push(
      "Saving blocks dismiss/duplicate submit; success closes and refreshes",
    );

    await open("Add fixture");
    assert(
      (await caption().inputValue()) === "",
      "New draft inherited edit caption",
    );
    assert(
      (await caption().getAttribute("id")) !== editId,
      "Mounted dialogs reuse field IDs",
    );
    await dialog.getByRole("button", { name: "Add Item", exact: true }).click();
    const imageControl = dialog.getByRole("button", {
      name: "Image",
      exact: true,
    });
    assert(
      (await imageControl.getAttribute("aria-invalid")) === "true",
      "Image invalid state missing",
    );
    const description = await imageControl.getAttribute("aria-describedby");
    assert(
      (await page.evaluate(
        (id) => document.getElementById(id)?.textContent,
        description,
      )) === "Image is required",
      "Image error missing association",
    );
    assert(
      (await caption().getAttribute("maxlength")) === "180",
      "Caption length missing",
    );
    assert(
      (await dialog
        .getByRole("textbox", { name: "Alt text", exact: true })
        .getAttribute("maxlength")) === "180",
      "Alt length missing",
    );
    await caption().fill("Small caption");
    assert(
      (await dialog.getByText("13/180 characters", { exact: true }).count()) ===
        1,
      "Length feedback stale",
    );
    await dialog
      .getByRole("combobox", { name: "Category (required)", exact: true })
      .fill("New category");
    await dialog.locator('input[type="file"]').setInputFiles(file);
    await dialog
      .getByRole("button", { name: "Uploading...", exact: true })
      .waitFor();
    const beforeUploadCalls = await page.evaluate(
      () => window.galleryEditor.calls.length,
    );
    await dialog.locator("form").evaluate((form) => form.requestSubmit());
    const beforeUpload = prompts.length;
    for (const dismiss of [dismissals[1], dismissals[2], dismissals[3]])
      await dismiss();

    assert(await dialog.isVisible(), "Uploading dialog dismissed");
    assert(prompts.length === beforeUpload, "Uploading should block discard");
    assert(
      await dialog
        .getByRole("button", { name: "Uploading...", exact: true })
        .isDisabled(),
      "Save enabled during upload",
    );
    assert(
      (await page.evaluate(() => window.galleryEditor.calls.length)) ===
        beforeUploadCalls,
      "Save escaped upload lock",
    );
    await page.evaluate(() => {
      window.galleryEditor.failUpload = true;
      window.galleryEditor.releaseUpload();
    });
    await dialog
      .getByRole("alert")
      .filter({ hasText: "Fixture upload failed." })
      .waitFor();
    assert(
      await dialog
        .getByRole("button", { name: "Add Item", exact: true })
        .isEnabled(),
      "Failed upload left editor locked",
    );
    await page.evaluate(() => {
      window.galleryEditor.failUpload = false;
      window.galleryEditor.deferSave = false;
    });
    await dialog.locator('input[type="file"]').setInputFiles(file);
    await page.waitForFunction(() => window.galleryEditor.uploadCalls === 2);
    await page.evaluate(() => window.galleryEditor.releaseUpload());
    await dialog.getByRole("group", { name: "Image", exact: true }).waitFor();
    await dialog.getByRole("button", { name: "Add Item", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
    assert(
      (await page.evaluate(
        () => window.galleryEditor.calls.at(-1).values.order,
      )) === 0,
      "New item must append with order 0",
    );
    results.push(
      "Unique IDs, length feedback, named image validation, upload locking/recovery, create order 0",
    );

    for (const [width, height] of [
      [1440, 900],
      [390, 844],
      [320, 740],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      await open();
      const save = dialog.getByRole("button", {
        name: "Save Changes",
        exact: true,
      });
      await save.scrollIntoViewIfNeeded();
      const geometry = await dialog.evaluate((element) => {
        const save = element
          .querySelector('button[type="submit"]')
          .getBoundingClientRect();
        return {
          overflow: element.scrollWidth > element.clientWidth + 1,
          visible:
            save.top >= 0 &&
            save.bottom <= innerHeight &&
            save.left >= 0 &&
            save.right <= innerWidth,
        };
      });
      assert(
        !geometry.overflow && geometry.visible,
        `Footer unreachable or overflow at ${width}x${height}`,
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
    }
    results.push(
      "Footer reachable at desktop, mobile 390/320 and short landscape",
    );
    const legacy = page.getByRole("region", { name: "Legacy upload caller" });
    assert(
      await legacy.getByRole("button", { name: /Drop an image/ }).isEnabled(),
      "Legacy upload name regressed",
    );
    await legacy.locator('input[type="file"]').setInputFiles(file);
    await page.waitForFunction(() => window.galleryEditor.uploadCalls === 3);
    await page.evaluate(() => window.galleryEditor.releaseUpload());
    await legacy.getByRole("button", { name: /Drop an image/ }).waitFor();
    results.push("Uploader callers without optional props still upload");
    assert(errors.length === 0, `Runtime errors: ${errors.join("; ")}`);
    assert(
      external.length === 0,
      `External requests attempted: ${external.join("; ")}`,
    );
    return { results, prompts: prompts.length, errors, external };
  } finally {
    await context.close();
  }
}
