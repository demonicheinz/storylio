// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function mediaUploadQueue(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const jobs = [];
  const errors = [];
  let active = 0,
    maxActive = 0;
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  await page.route("**/api/upload", async (route) => {
    const name = route
      .request()
      .postDataBuffer()
      .toString()
      .match(/filename="([^"]+)"/)?.[1];
    active++;
    maxActive = Math.max(maxActive, active);
    let finish;
    const pending = new Promise((resolve) => {
      finish = resolve;
    });
    jobs.push({ name, resolve: finish });
    await page.evaluate((count) => {
      window.mediaUploadRequests = count;
    }, jobs.length);
    const result = await pending;
    try {
      await route.fulfill(result);
    } finally {
      active--;
    }
  });
  const reply = (job, status = 200) =>
    job.resolve({
      status,
      contentType: "application/json",
      body: JSON.stringify(
        status === 200
          ? {
              id: `uploaded-${job.name}`,
              url: `${origin}/fixture-image.svg?uploaded=${encodeURIComponent(job.name)}`,
              publicId: `fixture/${job.name}`,
              filename: job.name,
              format: "png",
              size: 68,
              width: 1,
              height: 1,
              aspectRatio: 1,
              blurDataUrl: null,
            }
          : { error: "Fixture upload failed." },
      ),
    });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aYe0AAAAASUVORK5CYII=",
    "base64",
  );
  const files = ["a.png", "b.png", "c.png"].map((name) => ({
    name,
    mimeType: "image/png",
    buffer: png,
  }));
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(origin);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Upload", exact: true }).click();
    await (await chooser).setFiles(files);
    await page
      .getByRole("status")
      .filter({ hasText: "2 active · 1 queued" })
      .waitFor();
    await page.waitForFunction(() => window.mediaUploadRequests === 2);
    assert(jobs.length === 2, "Queue started more or fewer than two uploads");

    await page
      .getByRole("link", { name: "Leave library fixture", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-cancel"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    assert(
      new URL(page.url()).pathname === "/",
      "Upload navigation guard lost pending files",
    );
    reply(jobs.find((job) => job.name === "a.png"));
    await page
      .getByRole("button", { name: "View image a.png", exact: true })
      .waitFor();
    await page
      .getByRole("status")
      .filter({ hasText: "2 active · 0 queued" })
      .waitFor();
    await page.waitForFunction(() => window.mediaUploadRequests === 3);
    reply(
      jobs.find((job) => job.name === "b.png"),
      500,
    );
    await page
      .getByRole("button", { name: "Retry b.png", exact: true })
      .waitFor();
    const panel = page.getByRole("region", {
      name: "Upload images",
      exact: true,
    });
    await panel.screenshot({
      path: "task/dashboard-media-review/queue-mixed-desktop.png",
    });
    await page.setViewportSize({ width: 320, height: 900 });
    await panel.screenshot({
      path: "task/dashboard-media-review/queue-mixed-mobile.png",
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .getByRole("button", { name: "Retry b.png", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "2 active · 0 queued" })
      .waitFor();
    await page.waitForFunction(() => window.mediaUploadRequests === 4);
    const retry = jobs.filter((job) => job.name === "b.png").at(-1);
    assert(
      jobs.filter((job) => job.name === "a.png").length === 1,
      "Successful file retried",
    );
    reply(retry);
    reply(jobs.find((job) => job.name === "c.png"));
    await page
      .getByRole("status")
      .filter({ hasText: "3 uploaded · 0 failed" })
      .waitFor();
    assert(maxActive === 2, "Concurrent upload limit exceeded");
    await page
      .getByRole("textbox", { name: "Search media", exact: true })
      .filter({ visible: true })
      .fill("not-matching-upload");
    await page
      .getByRole("button", { name: "View image a.png", exact: true })
      .click();
    await page
      .getByRole("dialog", { name: "Media details", exact: true })
      .getByRole("heading", { name: "a.png", exact: true })
      .waitFor();
    const drawerId = await page
      .getByRole("dialog", { name: "Media details", exact: true })
      .getAttribute("id");
    await page.keyboard.press("Escape");
    await page.locator(`[id="${drawerId}"]`).waitFor({ state: "hidden" });
    await page
      .getByRole("button", { name: "Clear completed", exact: true })
      .click();
    assert(
      (await page
        .getByRole("list", { name: "Image upload queue", exact: true })
        .count()) === 0,
      "Completed rows not cleared",
    );
    await page
      .getByRole("button", { name: "Close upload queue", exact: true })
      .click();
    assert(
      (await page
        .getByRole("heading", { name: "Upload images", exact: true })
        .count()) === 0,
      "Queue did not close",
    );
    await page.evaluate(() => {
      const data = new DataTransfer();
      data.items.add(new File(["bad"], "invalid.txt", { type: "text/plain" }));
      document.dispatchEvent(
        new DragEvent("dragenter", {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
        }),
      );
      document.dispatchEvent(
        new DragEvent("drop", {
          bubbles: true,
          cancelable: true,
          dataTransfer: data,
        }),
      );
    });
    await page
      .getByRole("button", { name: "Remove invalid.txt", exact: true })
      .waitFor();
    assert(jobs.length === 4, "Invalid file was sent to the server");
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Upload queue overflow ${width}`,
      );
      await page.screenshot({
        path: `task/dashboard-media-review/queue-${width}.png`,
      });
    }
    assert(errors.length === 0, `Upload runtime errors: ${errors.join("; ")}`);
    return {
      passed: true,
      maxActive,
      requests: jobs.map((job) => job.name),
      checks: [
        "two uploads at once",
        "selective retry",
        "view filtered upload",
        "leave guard",
        "clear completed",
        "drag opens queue",
        "invalid file rejection",
        "responsive queue",
      ],
    };
  } finally {
    for (const job of jobs) reply(job, 500);
    await context.close();
  }
}
