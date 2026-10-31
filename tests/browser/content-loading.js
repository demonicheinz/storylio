// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function visualChecks(sessionPage) {
  const page = await sessionPage.context().newPage();
  const results = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const variant of [
        "projects",
        "blog",
        "project-detail",
        "post-detail",
        "gallery",
      ]) {
        await page.goto(`http://127.0.0.1:3205/?variant=${variant}`);
        await page.getByRole("status").waitFor();
        const result = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth,
          cards: document.querySelectorAll("[data-skeleton-cards] > div")
            .length,
          masonry: !!document.querySelector("[data-skeleton-masonry]"),
          cardColumns: document.querySelector("[data-skeleton-cards]")
            ? getComputedStyle(
                document.querySelector("[data-skeleton-cards]"),
              ).gridTemplateColumns.split(" ").length
            : null,
          masonryColumns: document.querySelector("[data-skeleton-masonry]")
            ? Number(
                getComputedStyle(
                  document.querySelector("[data-skeleton-masonry]"),
                ).columnCount,
              )
            : null,
        }));
        if (result.overflow) throw Error(`${variant} overflows at ${width}`);
        if (
          ["projects", "blog"].includes(variant) &&
          result.cardColumns !== (width < 768 ? 1 : width < 1200 ? 2 : 3)
        )
          throw Error(`${variant} has incorrect grid columns at ${width}`);
        if (
          variant === "gallery" &&
          result.masonryColumns !== (width < 688 ? 1 : width < 1008 ? 2 : 3)
        )
          throw Error(`Gallery has incorrect masonry columns at ${width}`);
        results.push({ width, variant, ...result });
        if ([320, 1440].includes(width))
          await page.screenshot({
            path:
              "task/content-navigation-and-loading/" +
              variant +
              "-" +
              width +
              ".png",
            fullPage: true,
          });
      }
      await page.goto("http://127.0.0.1:3205/?kind=cover");
      const cover = page.getByText("Article cover unavailable");
      await cover.waitFor();
      const rect = await cover
        .locator("..")
        .evaluate((el) => el.parentElement.getBoundingClientRect().toJSON());
      if (Math.abs(rect.width / rect.height - 16 / 9) > 0.03)
        throw Error(`Cover aspect ratio changed at ${width}`);
    }
    return results;
  } finally {
    await page.close();
  }
}
