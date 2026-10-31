// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function dashboardPagination(sessionPage) {
  const page = await sessionPage.context().newPage();
  const results = [];
  const visibleTrigger = () =>
    page
      .getByRole("button", { name: "Items per page", exact: true })
      .filter({ visible: true });
  try {
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("http://127.0.0.1:3205/?kind=pagination");
      if (
        !(await page
          .getByRole("button", { name: "Previous page", exact: true })
          .isDisabled())
      )
        throw Error("Previous page enabled on first page");
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .click();
      if (
        !(await page
          .getByText("Showing 11 to 20 of 100 items", { exact: true })
          .count())
      )
        throw Error("Range did not advance");
      await page
        .getByRole("button", { name: "Previous page", exact: true })
        .click();
      await visibleTrigger().click();
      await page
        .getByRole("menuitemradio", { name: "20", exact: true })
        .click();
      // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
      if ((await visibleTrigger().innerText()) !== "20")
        throw Error("Page size not updated");
      await page
        .getByRole("button", { name: "Next page", exact: true })
        .click();
      if (
        !(await page
          .getByText("Showing 21 to 40 of 100 items", { exact: true })
          .count())
      )
        throw Error("Page size range incorrect");
      if (width >= 768) {
        await page.getByRole("button", { name: "Page 5", exact: true }).click();
        if (
          !(await page
            .getByRole("button", { name: "Next page", exact: true })
            .isDisabled())
        )
          throw Error("Next enabled on last page");
      }
      await visibleTrigger().focus();
      await page.keyboard.press("Enter");
      await page
        .getByRole("menuitemradio", { name: "40", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
      if ((await visibleTrigger().innerText()) !== "40")
        throw Error("Keyboard page size selection failed");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) throw Error(`Pagination overflows at ${width}`);
      await page.screenshot({
        path: `task/code-standardization/pagination-${width}.png`,
      });
      results.push({ width, passed: true });
    }
    return results;
  } finally {
    await page.close();
  }
}
