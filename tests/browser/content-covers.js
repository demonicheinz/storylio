async function contentCovers(sessionPage) {
  const page = await sessionPage.context().newPage();
  const errors = [];
  const results = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 850 });
      await page.goto("http://127.0.0.1:3205/?kind=covers");
      const missing = await page
        .locator("[data-cover-kind] > div")
        .evaluateAll((elements) =>
          elements.map((element) => {
            const rect = element.getBoundingClientRect();
            return {
              kind: element.parentElement.dataset.coverKind,
              ratio: rect.width / rect.height,
              height: rect.height,
              fallbackHeight:
                element.firstElementChild.getBoundingClientRect().height,
            };
          }),
        );
      const failures = missing
        .filter((cover) => Math.abs(cover.ratio - 16 / 9) > 0.02)
        .map((cover) => `${cover.kind}: missing cover ratio ${cover.ratio}`);
      failures.push(
        ...missing
          .filter((cover) => cover.fallbackHeight > cover.height + 1)
          .map(
            (cover) => `${cover.kind}: fallback content overflows its cover`,
          ),
      );
      await page
        .getByRole("button", { name: "First image", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll("[data-cover-kind] img")].length ===
            2 &&
          [...document.querySelectorAll("[data-cover-kind] img")].every(
            (image) => image.complete && image.naturalWidth > 0,
          ),
      );
      await page
        .getByRole("button", { name: "Broken image", exact: true })
        .click();
      await page
        .getByText("Article cover unavailable", { exact: true })
        .waitFor();
      await page
        .getByText("Project preview unavailable", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Change appearance", exact: true })
        .click();
      if (await page.locator("[data-cover-kind] img").count())
        throw new Error(
          "Unchanged failed source was retried after an appearance update",
        );
      await page
        .getByRole("button", { name: "Second image", exact: true })
        .click();
      const recovered = await page
        .waitForFunction(
          () =>
            document.querySelectorAll("[data-cover-kind] img").length === 2 &&
            [...document.querySelectorAll("[data-cover-kind] img")].every(
              (image) => image.complete && image.naturalWidth > 0,
            ),
          null,
          { timeout: 2000 },
        )
        .then(
          () => true,
          () => false,
        );
      if (!recovered)
        failures.push("Covers retained the previous source failure");
      if (failures.length)
        throw new Error(`${width}px: ${failures.join("; ")}`);
      await page
        .getByRole("button", { name: "First image", exact: true })
        .click();
      await page.waitForFunction(() =>
        [...document.querySelectorAll("[data-cover-kind] img")].every(
          (image) => image.complete && image.naturalWidth > 0,
        ),
      );
      await page
        .getByRole("button", { name: "Clear image", exact: true })
        .click();
      await page
        .getByText("Article cover unavailable", { exact: true })
        .waitFor();
      await page
        .getByText("Project preview unavailable", { exact: true })
        .waitFor();
      if (await page.locator("[data-cover-kind] img").count())
        throw new Error("Clear retained an image");
      await page.screenshot({
        path: `task/code-standardization/covers-${width}.png`,
      });
      results.push({ width, missing, recovery: true });
    }
    if (errors.length) throw new Error(errors.join("; "));
    return results;
  } finally {
    await page.close();
  }
}
