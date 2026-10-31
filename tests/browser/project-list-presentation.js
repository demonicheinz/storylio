// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function projectListPresentation(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  try {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(origin);
    await page
      .getByRole("heading", { name: "Projects", exact: true })
      .waitFor();
    const check = () =>
      page.evaluate(() => {
        const header = document.querySelector("[data-project-list-header]"),
          row = document.querySelector("h2").closest(".grid");
        const cells = [...header.children].filter((el) => el.textContent),
          gutter = row.children.length > 5 ? 1 : 0;
        const point = (el) =>
          el.getBoundingClientRect().left +
          parseFloat(getComputedStyle(el).paddingLeft);
        return {
          tracksMatch:
            getComputedStyle(header).gridTemplateColumns ===
            getComputedStyle(row).gridTemplateColumns,
          title: Math.abs(
            point(cells[0]) -
              row.querySelector("h2").getBoundingClientRect().left,
          ),
          status: Math.abs(point(cells[1]) - point(row.children[gutter + 1])),
          updated: Math.abs(
            point(cells[2]) -
              row.querySelector("time").getBoundingClientRect().left,
          ),
          actions: Math.abs(
            cells[3].getBoundingClientRect().left +
              cells[3].getBoundingClientRect().width / 2 -
              (row.children[gutter + 3]
                .querySelector("button")
                .getBoundingClientRect().left +
                row.children[gutter + 3]
                  .querySelector("button")
                  .getBoundingClientRect().width /
                  2),
          ),
        };
      });
    const normal = await check();
    assert(
      normal.tracksMatch &&
        Object.values(normal).every((v) => typeof v === "boolean" || v < 1),
      `Normal columns misaligned: ${JSON.stringify(normal)}`,
    );
    await page.screenshot({
      path: "task/dashboard-projects-review/list-aligned-1440.png",
      fullPage: true,
    });
    await page.getByRole("button", { name: "Select", exact: true }).click();
    const batch = await check();
    assert(
      batch.tracksMatch &&
        batch.title < 1 &&
        batch.status < 1 &&
        batch.updated < 1 &&
        batch.actions < 1,
      `Batch columns misaligned: ${JSON.stringify(batch)}`,
    );
    await page
      .getByRole("button", { name: "Cancel selection", exact: true })
      .click();
    await page.getByRole("button", { name: "Grid view", exact: true }).click();
    const cards = await page.locator("article").evaluateAll((els) =>
      els.map((el) => ({
        radius: parseFloat(getComputedStyle(el).borderRadius),
        statusOverImage: [...el.querySelectorAll("span")].some(
          (span) =>
            ["Draft", "Published", "Featured"].includes(
              span.textContent.trim(),
            ) && span.closest(".relative") !== null,
        ),
      })),
    );
    assert(
      cards.every((card) => card.radius === 12 && !card.statusOverImage),
      `Card radius or overlay badge: ${JSON.stringify(cards)}`,
    );
    const badges = [];
    for (const name of ["Draft", "Published", "Featured"]) {
      const item = page
        .locator("article")
        .getByText(name, { exact: true })
        .filter({ visible: true })
        .first();
      const measure = await item.evaluate((el) => {
        const s = getComputedStyle(el),
          canvas = document.createElement("canvas"),
          ctx = canvas.getContext("2d");
        const rgb = (color) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data];
        };
        const luminance = ([r, g, b]) =>
          [r, g, b]
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
        const fg = rgb(s.color),
          bg = rgb(s.backgroundColor),
          a = luminance(fg),
          b = luminance(bg);
        return {
          height: el.getBoundingClientRect().height,
          alpha: bg[3],
          contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      });
      assert(
        measure.height === 24 &&
          measure.alpha === 255 &&
          measure.contrast >= 4.5,
        `${name} badge unclear: ${JSON.stringify(measure)}`,
      );
      badges.push({ name, ...measure });
    }
    await page.screenshot({
      path: "task/dashboard-projects-review/grid-badges-1440.png",
      fullPage: true,
    });
    return { passed: true, normal, batch, badges, cardRadius: 12 };
  } finally {
    await context.close();
  }
}
