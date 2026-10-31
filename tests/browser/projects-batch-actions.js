async function projectsBatchActions(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const chooseFirst = async () => {
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await page
      .getByRole("checkbox", {
        name: "Select Nebula Commerce with a deliberately long project name",
        exact: true,
      })
      .check();
  };
  try {
    for (const width of [1440, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(origin);
      await chooseFirst();
      await page.getByText("1 project selected", { exact: true }).waitFor();
      await page
        .getByRole("button", { name: "Select page", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Deselect page", exact: true })
        .click();
      await page.getByText("0 projects selected", { exact: true }).waitFor();
      assert(
        await page
          .getByRole("button", { name: "Publish", exact: true })
          .isDisabled(),
        "Empty selection allows publishing",
      );
      await page
        .getByRole("checkbox", {
          name: "Select Nebula Commerce with a deliberately long project name",
          exact: true,
        })
        .check();
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.waitFor();
      assert(
        (await dialog.innerText()).includes(
          "Nebula Commerce with a deliberately long project name",
        ),
        "Delete confirmation lost the selected title",
      );
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      assert(
        !(await page.evaluate(() => window.projectCalls ?? [])).some(
          (call) => call.name === "batchDelete",
        ),
        "Cancelling deleted projects",
      );
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      await page.getByRole("button", { name: "Select", exact: true }).waitFor();
      await chooseFirst();
      await page
        .getByRole("button", { name: "Move to draft", exact: true })
        .click();
      await page.getByRole("button", { name: "Select", exact: true }).waitFor();
      await chooseFirst();
      await page.getByRole("button", { name: "Delete", exact: true }).click();
      await dialog
        .getByRole("button", { name: "Delete selected", exact: true })
        .click();
      await page.getByRole("button", { name: "Select", exact: true }).waitFor();
      const calls = await page.evaluate(() => window.projectCalls ?? []);
      for (const name of ["batchPublish", "batchDraft", "batchDelete"]) {
        const matching = calls.filter((call) => call.name === name);
        assert(
          matching.length === 1 &&
            JSON.stringify(matching[0].args) === '[["project-0"]]',
          `Incorrect ${name} payload at ${width}px`,
        );
      }
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow at ${width}px`,
      );
    }
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      widths: [1440, 320],
      checks: [
        "page selection",
        "empty guard",
        "cancel delete",
        "publish",
        "move to draft",
        "confirm delete",
        "exact IDs",
      ],
    };
  } finally {
    await context.close();
  }
}
