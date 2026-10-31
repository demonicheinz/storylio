async function mediaRenderers(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  const results = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/media/*/download", (route) =>
    route.fulfill({
      status: 200,
      body: "local fixture image bytes",
      headers: {
        "Content-Type": "image/webp",
        "Content-Disposition":
          "attachment; filename*=UTF-8''fixture%20download.webp",
      },
    }),
  );
  const filename =
    "long-descriptive-filename-for-an-interface-design-image-with-context.webp";
  try {
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 950 });
      for (const mode of ["grid", "list"]) {
        await page.goto(origin);
        if (mode === "list") {
          if (width < 768) {
            await page
              .getByRole("button", { name: "Filters", exact: true })
              .click();
            await page
              .getByRole("button", { name: "List view", exact: true })
              .click();
            await page
              .getByRole("button", { name: "Apply filters", exact: true })
              .click();
          } else
            await page
              .getByRole("button", { name: "List view", exact: true })
              .click();
        }
        const preview = page.getByRole("button", {
          name: `Preview ${filename}`,
          exact: true,
        });
        await preview.focus();
        await page.keyboard.press("Enter");
        const detail = page.getByRole("dialog", {
          name: "Media details",
          exact: true,
        });
        await detail.waitFor();
        await page.keyboard.press("Escape");
        await detail.waitFor({ state: "hidden" });
        await page.waitForFunction(
          (name) =>
            document.activeElement?.getAttribute("aria-label") ===
            `Preview ${name}`,
          filename,
        );
        const menu = () =>
          page
            .getByRole("button", {
              name: `Open actions for ${filename}`,
              exact: true,
            })
            .filter({ visible: true })
            .click();
        await page.evaluate(() => {
          navigator.clipboard.writeText = async (value) => {
            window.rendererCopied = value;
          };
        });
        await menu();
        await page
          .getByRole("menuitem", { name: "Copy URL", exact: true })
          .click();
        if (
          (await page.evaluate(() => window.rendererCopied)) !==
          origin + "/fixture-image.svg?image=0"
        )
          throw Error("Renderer copied wrong image");
        await menu();
        const downloaded = page.waitForEvent("download");
        await page
          .getByRole("menuitem", { name: "Download", exact: true })
          .click();
        const download = await downloaded;
        if (download.suggestedFilename() !== "fixture download.webp")
          throw Error("Download callback lost the response filename");
        await page
          .getByRole("button", { name: "Select media", exact: true })
          .filter({ visible: true })
          .click();
        const selection = page.getByRole("checkbox", {
          name: `Select ${filename}`,
          exact: true,
        });
        await selection.focus();
        await page.keyboard.press("Space");
        await page.getByText("1 selected", { exact: true }).waitFor();
        await page
          .getByRole("checkbox", { name: `Select ${filename}`, exact: true })
          .click();
        await page.getByText("0 selected", { exact: true }).waitFor();
        await page.screenshot({
          path: `task/code-standardization/media-${mode}-${width}.png`,
        });
        results.push({ width, mode, passed: true });
      }
    }
    if (errors.length) throw Error(errors.join("; "));
    return results;
  } finally {
    await context.close();
  }
}
