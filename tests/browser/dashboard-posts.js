async function dashboardPosts(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ timezoneId: "Asia/Bangkok", reducedMotion: "reduce" });
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const fresh = async (path = "") => {
    await page
      .evaluate(() => {
        window.confirm = () => true;
      })
      .catch(() => {});
    await page.goto(origin + path);
  };
  const select = async (name, option) => {
    await page
      .getByRole("combobox", { name, exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: option, exact: true }).click();
  };
  try {
    for (const width of [1440, 1024, 768, 390, 320, 275]) {
      await page.setViewportSize({ width, height: 900 });
      await fresh();
      await page.getByRole("heading", { name: "Posts", exact: true }).waitFor();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Posts overflow at ${width}`,
      );
      assert(
        await page
          .getByRole("link", {
            name: "An article title with a deliberately long accessible interface description",
            exact: true,
          })
          .isVisible(),
        "Missing direct title edit link",
      );
      await page.screenshot({
        path: `task/dashboard-posts-review/updated-list-${width}.png`,
        fullPage: true,
      });
    }
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page
      .getByRole("button", { name: "Toggle page selection", exact: true })
      .click();
    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await page
      .getByText("10 selected outside this page.", { exact: false })
      .waitFor();
    assert(
      (await page
        .getByRole("link", { name: "Post 10", exact: true })
        .count()) === 0,
      "Batch title still navigates",
    );
    await page
      .getByRole("button", { name: "Cancel selection", exact: true })
      .click();
    await page.getByRole("button", { name: "Filters", exact: true }).click();
    await select("Status", "Scheduled");
    await page
      .getByRole("button", { name: "Filter tags", exact: true })
      .filter({ visible: true })
      .click();
    await page
      .getByRole("combobox", { name: "Search tags", exact: true })
      .fill("notes");
    await page.getByRole("option", { name: "notes", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Search tags", exact: true })
      .press("Escape");
    await page
      .getByRole("button", { name: "Apply filters", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Filters (2)", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Filters (2)", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Reset filters", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await page
      .getByRole("button", { name: "Filters (2)", exact: true })
      .waitFor();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await fresh("/?editor=create");
      await page
        .getByRole("textbox", { name: "Post content", exact: true })
        .waitFor();
      const geometry = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        titleTop: document.querySelector("#title").getBoundingClientRect().top,
        bodyTop: document
          .querySelector('[data-slot="dashboard-mdx-editor"]')
          .getBoundingClientRect().top,
        sticky: document
          .querySelector('[aria-label="Post save actions"]')
          .getBoundingClientRect().height,
      }));
      assert(
        !geometry.overflow &&
          geometry.titleTop < geometry.bodyTop &&
          geometry.sticky < 180,
        `Editor composition at ${width}: ${JSON.stringify(geometry)}`,
      );
      assert(
        !(await page
          .getByRole("button", { name: "Preview saved version", exact: true })
          .isEnabled()),
        "Unsaved new post can preview",
      );
      await page.screenshot({
        path: `task/dashboard-posts-review/updated-editor-${width}.png`,
        fullPage: true,
      });
    }
    await page
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("A new note");
    await select("Content type", "Note");
    const tags = page.getByRole("textbox", { name: "Tags", exact: true });
    await tags.fill("React");
    await tags.press("Enter");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await page.waitForFunction(() =>
      window.projectReplacement?.includes("/dashboard/posts/created/edit"),
    );
    assert(
      (await page.evaluate(() => window.savedPostPayload.tags)).includes(
        "notes",
      ),
      "Note type did not retain exact notes tag",
    );
    await page
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("Unsaved changes");
    await page.evaluate(() => (window.confirm = () => false));
    await page
      .getByRole("link", { name: "Back to Posts", exact: true })
      .click();
    assert(
      page.url().includes("editor=create"),
      "Dirty link navigation was not guarded",
    );
    await fresh("/?editor=draft");
    await page
      .getByRole("textbox", { name: "Post content", exact: true })
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
      preview.url().includes("/preview/posts/saved-article"),
      "Preview used unsaved slug",
    );
    await preview.close();
    await fresh("/?preview-note");
    const note = page.getByRole("dialog", {
      name: "Private draft note",
      exact: true,
    });
    await note.waitFor();
    assert(
      (await note.locator("[data-note-body]").count()) === 1,
      "Private Note does not use shared reading body",
    );
    await page
      .getByRole("button", { name: "Close note preview", exact: true })
      .click();
    await note.waitFor({ state: "hidden" });
    return {
      passed: true,
      widths: [1440, 1024, 768, 390, 320, 275],
      checks: [
        "direct editing",
        "pagination",
        "selection scope",
        "mobile tag search",
        "staged Reset",
        "identity first",
        "draft save",
        "note type",
        "guard",
        "saved preview",
        "private note reader",
      ],
    };
  } finally {
    await context.close();
  }
}
