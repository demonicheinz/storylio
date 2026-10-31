// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function projectEditorConsistency(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  try {
    const tagHeights = [];
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/?editor=draft&media`);
      await page
        .getByRole("textbox", { name: "Project case study", exact: true })
        .waitFor();
      const stack = page.getByRole("region", {
        name: "Links and technologies",
      });
      const geometry = await stack.evaluate((el) => {
        const input = el.querySelector("#techStack"),
          field = input.closest("div.flex-wrap"),
          badges = [...field.querySelectorAll('[data-slot="badge"]')],
          live = el.querySelector("#liveUrl"),
          repo = el.querySelector("#githubUrl");
        return {
          badges: badges.map((el) => el.getBoundingClientRect().height),
          field: field.getBoundingClientRect().toJSON(),
          live: live.getBoundingClientRect().toJSON(),
          repo: repo.getBoundingClientRect().toJSON(),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      assert(
        geometry.badges.every((h) => h === 44),
        `Tag height differs at ${width}: ${JSON.stringify(geometry.badges)}`,
      );
      assert(!geometry.overflow, `Overflow at ${width}`);
      assert(
        geometry.field.bottom < geometry.live.top,
        "Tech stack does not own its row",
      );
      if (width >= 640)
        assert(
          Math.abs(geometry.live.top - geometry.repo.top) < 1,
          "Link fields are not aligned below stack",
        );
      tagHeights.push({ width, heights: geometry.badges });
      const rail = page.getByRole("button", {
        name: "Drag Overview screenshot to reorder",
        exact: true,
      });
      const grip = await rail.evaluate((el) => {
        const r = el.getBoundingClientRect(),
          row = el.parentElement.parentElement.getBoundingClientRect(),
          icon = el.querySelector("svg").getBoundingClientRect();
        return {
          height: r.height,
          rowHeight: row.height,
          width: r.width,
          iconOffset: Math.abs(
            icon.top + icon.height / 2 - r.top - r.height / 2,
          ),
        };
      });
      assert(
        grip.width === 44 &&
          Math.abs(grip.height - grip.rowHeight) < 1 &&
          grip.iconOffset < 1,
        `Rail is not full-height: ${JSON.stringify(grip)}`,
      );
      for (const name of ["Remove image", "Remove screenshot 1"]) {
        const button = page.getByRole("button", { name, exact: true });
        const style = await button.evaluate((el) => {
          const s = getComputedStyle(el),
            r = el.getBoundingClientRect(),
            parent = el.parentElement.getBoundingClientRect(),
            canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d");
          ctx.fillStyle = s.backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
          return {
            alpha: ctx.getImageData(0, 0, 1, 1).data[3],
            h: r.height,
            top: r.top - parent.top,
            right: parent.right - r.right,
            text: el.textContent,
          };
        });
        assert(
          style.alpha === 255 &&
            style.h >= 44 &&
            style.top >= 7 &&
            style.right >= 7 &&
            style.text.includes("Remove"),
          `${name} is not clear/inside preview: ${JSON.stringify(style)}`,
        );
      }
      if ([1440, 768, 390].includes(width)) {
        await stack.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `task/dashboard-projects-review/editor-stack-${width}.png`,
        });
        await rail.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: `task/dashboard-projects-review/editor-media-${width}.png`,
        });
      }
    }
    const rail = page.getByRole("button", {
      name: "Drag Overview screenshot to reorder",
      exact: true,
    });
    await rail.focus();
    await rail.press("Space");
    await page.waitForTimeout(120);
    await rail.press("ArrowDown");
    await page.waitForTimeout(120);
    await rail.press("Space");
    await page.waitForFunction(
      () =>
        document.querySelector('input[placeholder="Describe this view"]')
          ?.value === "Details",
    );
    const labels = async (root) =>
      root
        .getByRole("toolbar")
        .locator("button")
        .evaluateAll((els) =>
          els
            .map(
              (el) =>
                el.getAttribute("aria-label") ||
                el.getAttribute("title") ||
                el.textContent,
            )
            .sort(),
        );
    const projects = await labels(
      page.locator('[data-slot="dashboard-mdx-editor"]').first(),
    );
    const about = await context.newPage();
    await about.goto(origin.replace(":3197", ":3196"));
    await about
      .getByRole("textbox", { name: "How I Work (English)", exact: true })
      .waitFor();
    const aboutLabels = await labels(
      about.locator('[data-slot="dashboard-mdx-editor"]').first(),
    );
    assert(
      JSON.stringify(projects) === JSON.stringify(aboutLabels),
      "About and Projects toolbar actions differ",
    );
    await about.close();
    await page
      .getByRole("button", { name: "Remove screenshot 1", exact: true })
      .click();
    assert(
      (await page
        .getByRole("button", { name: /^Drag .* screenshot to reorder$/ })
        .count()) === 1,
      "Screenshot removal failed",
    );
    await page
      .getByRole("button", { name: "Remove image", exact: true })
      .click();
    assert(
      (await page
        .getByRole("button", { name: "Remove image", exact: true })
        .count()) === 0,
      "Cover removal failed",
    );
    return {
      passed: true,
      tagHeights,
      toolbarActions: projects.length,
      checks: [
        "same toolbar actions",
        "opaque labelled image removal",
        "full-height rail",
        "consistent tag sizes",
        "tablet stack flow",
        "removal callbacks",
      ],
    };
  } finally {
    await context.close();
  }
}
