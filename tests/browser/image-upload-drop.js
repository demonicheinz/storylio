// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function imageUploadDrop(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  try {
    await page.goto(new URL(sessionPage.url()).origin);
    await page
      .locator("input[type=file]")
      .setInputFiles("D:/GitHub/storylio/.tmp/image-drop-review/first.png");
    const zone = page.getByRole("button", {
      name: "Uploading...",
      exact: false,
    });
    await zone.waitFor();
    assert(await zone.isDisabled(), "Fixture upload should be pending");
    const rect = await zone.boundingBox();
    const cdp = await context.newCDPSession(page);
    const data = {
      items: [],
      files: ["D:/GitHub/storylio/.tmp/image-drop-review/second.png"],
      dragOperationsMask: 1,
    };
    const point = {
      x: rect.x + rect.width / 2,
      y: rect.y + rect.height / 2,
      data,
    };
    await cdp.send("Input.dispatchDragEvent", { type: "dragEnter", ...point });
    await cdp.send("Input.dispatchDragEvent", { type: "dragOver", ...point });
    await cdp.send("Input.dispatchDragEvent", { type: "drop", ...point });
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    const observed = await page.evaluate(() => ({
      url: location.href,
      ...window.uploadFixture,
      resolve: undefined,
    }));
    assert(
      observed.calls === 1,
      "Second drop started another upload or navigated away: " +
        JSON.stringify(observed),
    );
    const dropped = observed.events.filter((e) => e.type === "drop");
    assert(
      dropped.some((e) => e.trusted && e.prevented),
      `Native pending drop must be prevented: ${JSON.stringify(observed)}`,
    );
    await page.evaluate(() => window.uploadFixture.resolve());
    await page
      .getByRole("button", {
        name: "Drop an image here or click to upload",
        exact: false,
      })
      .waitFor();
    return {
      passed: true,
      uploadCalls: observed.calls,
      nativeEvents: observed.events,
      url: observed.url,
    };
  } finally {
    await context.close();
  }
}
