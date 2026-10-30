async function dashboardProjects(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      await page
        .getByRole("heading", { name: "Projects", exact: true })
        .waitFor();
      assert(
        await page
          .getByRole("link", {
            name: "Nebula Commerce with a deliberately long project name",
            exact: true,
          })
          .isVisible(),
        "Missing direct edit link",
      );
      const titleWidth = await page
        .getByRole("heading", {
          name: "Nebula Commerce with a deliberately long project name",
          exact: true,
        })
        .evaluate((el) => el.getBoundingClientRect().width);
      assert(
        titleWidth >= 100,
        `Project title was squeezed into an implicit column at ${width}px`,
      );
      if (width === 1440) {
        const fields = [
          page
            .getByRole("textbox", { name: "Search projects" })
            .filter({ visible: true }),
          page.getByRole("combobox", { name: "Status", exact: true }),
          page.getByRole("combobox", { name: "Featured", exact: true }),
          page.getByRole("button", { name: "Filter tech stack", exact: true }),
          page.getByRole("combobox", { name: "Sort by", exact: true }),
        ];
        const bounds = await Promise.all(
          fields.map((field) =>
            field.evaluate((el) => ({
              top: el.getBoundingClientRect().top,
              height: el.getBoundingClientRect().height,
            })),
          ),
        );
        assert(
          bounds.every(
            (rect) =>
              rect.height === 44 && Math.abs(rect.top - bounds[0].top) < 1,
          ),
          "Filter controls have inconsistent heights or alignment",
        );
        assert(
          !(
            await page
              .getByRole("button", { name: "Filter tech stack", exact: true })
              .innerText()
          ).includes("Tech stack"),
          "Tech stack label remains inside trigger",
        );
      }
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `List overflow at ${width}`,
      );
      assert(
        (await page.getByRole("button", { name: /^Drag / }).count()) === 0,
        "Passive drag gutter remains",
      );
      await page.screenshot({
        path: `task/dashboard-projects-review/updated-list-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByRole("button", { name: "Select", exact: true }).click();
    assert(
      (await page
        .getByRole("link", { name: "Storylio", exact: true })
        .count()) === 0,
      "Batch title still navigates",
    );
    await page
      .getByRole("button", { name: "Select page", exact: true })
      .click();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page
      .getByText("10 selected outside this page.", { exact: false })
      .waitFor();
    await page
      .getByRole("button", { name: "Cancel selection", exact: true })
      .click();
    const search = page
      .getByRole("textbox", { name: "Search projects", exact: true })
      .filter({ visible: true });
    await search.fill("Storylio");
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    assert(
      (await search.inputValue()) === "Storylio",
      "Reorder lost search context",
    );
    await search.fill("nothing-matches");
    await page
      .getByText("No projects match these filters", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Clear filters and search", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await page
      .getByRole("button", { name: "Filter tech stack", exact: true })
      .filter({ visible: true })
      .click();
    const techSearch = page
      .getByRole("combobox", { name: "Search tech stack", exact: true })
      .filter({ visible: true });
    await techSearch.fill("Next");
    await page.getByRole("option", { name: "Next.js", exact: true }).click();
    await techSearch.press("Escape");
    assert(
      await page
        .getByRole("dialog", { name: "Filters", exact: true })
        .isVisible(),
      "Escape closed the drawer instead of its combobox",
    );
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Filters (1)", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Filters (1)", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reset filters", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Filters (1)", exact: true })
      .waitFor();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${origin}/?editor=create`);
      await page
        .getByRole("textbox", { name: "Project case study", exact: true })
        .waitFor();
      assert(
        !(await page
          .getByRole("button", { name: "Preview saved version", exact: true })
          .isEnabled()),
        "Unsaved create preview enabled",
      );
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        title: document.querySelector("#title").getBoundingClientRect().top,
        editor: document
          .querySelector("[data-slot=dashboard-mdx-editor]")
          .getBoundingClientRect().top,
        sticky: document
          .querySelector('[aria-label="Project save actions"]')
          .getBoundingClientRect().height,
      }));
      assert(
        !layout.overflow && layout.title < layout.editor && layout.sticky < 180,
        `Editor layout at ${width}: ${JSON.stringify(layout)}`,
      );
      await page.screenshot({
        path: `task/dashboard-projects-review/updated-editor-${width}.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("New project");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.waitForFunction(() =>
      window.projectReplacement?.includes("/created/edit"),
    );
    assert(
      (await page.evaluate(() => window.projectCalls)).some(
        (call) => call.name === "draft",
      ),
      "Draft did not save",
    );
    await page.goto(`${origin}/?editor=draft`);
    await page
      .getByRole("textbox", { name: "Project case study", exact: true })
      .waitFor();
    await page
      .getByRole("textbox", { name: "Slug", exact: true })
      .fill("unsaved-slug");
    const popup = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Preview saved version", exact: true })
      .click();
    const preview = await popup;
    assert(
      preview.url().includes("/preview/projects/saved-project"),
      "Preview used unsaved slug",
    );
    await preview.close();
    await page.evaluate(() => {
      window.confirm = () => false;
    });
    await page.getByRole("link", { name: "Projects", exact: true }).click();
    assert(page.url().includes("editor=draft"), "Dirty navigation not guarded");
    await page.evaluate(() => {
      window.confirm = () => true;
    });
    await page.goto(`${origin}/?upload`);
    const drop = page.getByRole("button", {
      name: "Add screenshots",
      exact: true,
    });
    await drop.focus();
    assert(
      await drop.evaluate((el) => el === document.activeElement),
      "Screenshot upload not focusable",
    );
    const send = async () =>
      drop.dispatchEvent("drop", {
        dataTransfer: await page.evaluateHandle(() => {
          const data = new DataTransfer();
          data.items.add(
            new File(["fixture"], "test.png", { type: "image/png" }),
          );
          return data;
        }),
      });
    await page.getByRole("button", { name: "Toggle disabled" }).click();
    await send();
    assert(
      (await page.evaluate(() => window.fixtureUploadCount ?? 0)) === 0,
      "Disabled drop started upload",
    );
    await page.getByRole("button", { name: "Toggle disabled" }).click();
    await send();
    await page.waitForFunction(() => window.fixtureUploadCount === 1);
    await page
      .getByRole("button", { name: "Uploading screenshots" })
      .dispatchEvent("drop", {
        dataTransfer: await page.evaluateHandle(() => {
          const data = new DataTransfer();
          data.items.add(
            new File(["fixture"], "next.png", { type: "image/png" }),
          );
          return data;
        }),
      });
    assert(
      (await page.evaluate(() => window.fixtureUploadCount)) === 1,
      "Concurrent drop started another upload",
    );
    await page.evaluate(() => window.releaseFixtureUpload());
    await page
      .getByRole("textbox", { name: "Caption (optional)", exact: true })
      .waitFor();
    return {
      passed: true,
      widths: [1440, 1024, 768, 390, 320],
      checks: [
        "direct editing",
        "bounded pagination",
        "selection scope",
        "reorder restores search",
        "filter state",
        "identity before content",
        "saved preview",
        "draft guard",
        "disabled/concurrent drop",
        "keyboard upload",
      ],
    };
  } finally {
    await context.close();
  }
}
