// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function mediaDeletion(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  const fresh = async () => {
    await page.goto(origin);
    await page
      .getByRole("heading", { name: "Media Library", exact: true })
      .waitFor();
  };
  const calls = (name) =>
    page.evaluate(
      (name) => window.mediaCalls.filter((call) => call.name === name).length,
      name,
    );
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await fresh();
    await page
      .getByRole("button", { name: "Select media", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page.getByText("12 selected", { exact: true }).waitFor();
    await page.evaluate(() => {
      window.mediaFailure = "usage";
    });
    await page
      .getByRole("button", { name: "Review deletion", exact: true })
      .click();
    await page.getByText("Fixture action failed.", { exact: true }).waitFor();
    assert(
      (await page.getByRole("alertdialog").count()) === 0,
      "Failed usage opened confirmation",
    );
    await page.getByText("12 selected", { exact: true }).waitFor();
    await page.evaluate(() => {
      window.mediaFailure = undefined;
      window.mediaHold = "usage";
    });
    await page
      .getByRole("button", { name: "Review deletion", exact: true })
      .click();
    await page.waitForFunction(() => !!window.mediaRelease);
    assert(
      await page
        .getByRole("button", { name: "Checking...", exact: true })
        .isDisabled(),
      "Usage review was not locked",
    );
    assert((await calls("usage")) === 2, "Unexpected duplicate usage request");
    await page.evaluate(() => {
      window.mediaHold = undefined;
      window.mediaRelease();
      window.mediaRelease = undefined;
    });
    const batch = page.getByRole("alertdialog", {
      name: "Delete selected media?",
      exact: true,
    });
    await batch.waitFor();
    await batch
      .getByRole("heading", { name: "Can delete (8)", exact: true })
      .waitFor();
    await batch
      .getByRole("heading", { name: "Still in use (4)", exact: true })
      .waitFor();
    await page.evaluate(() => {
      window.mediaFailure = "batch";
    });
    await batch
      .getByRole("button", { name: "Delete 8 images", exact: true })
      .click();
    await batch
      .getByRole("alert")
      .filter({ hasText: "Fixture action failed." })
      .waitFor();
    await page.evaluate(() => {
      window.mediaFailure = undefined;
      window.mediaReject = "batch";
    });
    await batch
      .getByRole("button", { name: "Delete 8 images", exact: true })
      .click();
    await batch
      .getByText(
        "Could not delete these images. Your selection is kept; try again.",
        { exact: true },
      )
      .waitFor();
    await page.evaluate(() => {
      window.mediaReject = undefined;
      window.mediaHold = "batch";
    });
    await batch
      .getByRole("button", { name: "Delete 8 images", exact: true })
      .click();
    await page.waitForFunction(() => !!window.mediaRelease);
    await page.keyboard.press("Escape");
    assert(await batch.isVisible(), "In-flight batch dialog closed");
    assert(
      await batch
        .getByRole("button", { name: "Close", exact: true })
        .isDisabled(),
      "In-flight Close was enabled",
    );
    assert((await calls("batch")) === 3, "Unexpected duplicate batch request");
    await page.evaluate(() => {
      window.mediaHold = undefined;
      window.mediaRelease();
      window.mediaRelease = undefined;
    });
    await batch.waitFor({ state: "hidden" });
    await page.getByText("4 selected", { exact: true }).waitFor();
    await fresh();
    await page
      .getByRole("button", { name: "Preview image-001.png", exact: true })
      .click();
    const detail = page.getByRole("dialog", {
      name: "Media details",
      exact: true,
    });
    await detail.getByRole("button", { name: "Delete", exact: true }).click();
    const single = page.getByRole("alertdialog", {
      name: "Delete media?",
      exact: true,
    });
    await page.evaluate(() => {
      window.mediaReject = "delete";
    });
    await single
      .getByRole("button", { name: "Delete image", exact: true })
      .click();
    await single
      .getByText("Could not delete this image. Try again.", { exact: true })
      .waitFor();
    await page.evaluate(() => {
      window.mediaReject = undefined;
      window.mediaHold = "delete";
    });
    await single
      .getByRole("button", { name: "Delete image", exact: true })
      .click();
    await page.waitForFunction(() => !!window.mediaRelease);
    await page.keyboard.press("Escape");
    assert(await single.isVisible(), "In-flight single dialog closed");
    assert(
      await single
        .getByRole("button", { name: "Cancel", exact: true })
        .isDisabled(),
      "In-flight Cancel was enabled",
    );
    assert(
      (await calls("delete")) === 2,
      "Unexpected duplicate single request",
    );
    await page.evaluate(() => {
      window.mediaHold = undefined;
      window.mediaRelease();
      window.mediaRelease = undefined;
    });
    await single.waitFor({ state: "hidden" });
    await detail.waitFor({ state: "hidden" });
    assert(
      (await page
        .getByRole("button", { name: "Preview image-001.png", exact: true })
        .count()) === 0,
      "Successful single delete retained row",
    );
    assert(errors.length === 0, errors.join("; "));
    return {
      passed: true,
      checks: [
        "usage failure and pending lock",
        "batch returned and thrown failures",
        "batch close lock",
        "protected selection retained",
        "single transport failure",
        "single close lock",
        "single row/detail removal",
      ],
    };
  } finally {
    await context.close();
  }
}
