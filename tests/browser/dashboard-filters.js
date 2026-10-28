async function dashboardFilters(sessionPage) {
  const origin = new URL(sessionPage.url()).origin;
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw new Error(message);
  };
  await page.route("**/api/auth/get-session**", (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "owner",
          name: "Example owner",
          email: "owner@example.test",
          image: null,
        },
        session: {
          id: "fixture",
          token: "fixture-token",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    }),
  );
  const visit = async (view) => {
    await page.goto(`${origin}/dashboard-overview-fixture-check?view=${view}`);
    await page.waitForLoadState("networkidle");
  };
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await visit("posts");
    await page.getByRole("button", { name: "Draft", exact: true }).click();
    await page
      .getByRole("heading", { name: "Giving the stack one row", exact: true })
      .waitFor({ state: "hidden" });
    assert(
      (await page
        .getByRole("heading", { name: "Giving the stack one row", exact: true })
        .count()) === 0,
      "Status filter did not apply",
    );
    await page.getByRole("button", { name: "All", exact: true }).click();
    await page
      .getByRole("heading", { name: "Giving the stack one row", exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Filter tags", exact: true })
      .click();
    const search = page.getByRole("combobox", {
      name: "Search tags",
      exact: true,
    });
    await search.fill("notes");
    await page.getByRole("option", { name: "notes", exact: true }).click();
    await search.press("Escape");
    await page
      .getByRole("heading", {
        name: "Building Storylio with server-first pages and a calmer publishing workflow",
        exact: true,
      })
      .waitFor({ state: "hidden" });
    assert(
      (await page
        .getByRole("heading", { name: "Giving the stack one row", exact: true })
        .count()) === 1,
      "Tag selection missing note",
    );
    assert(
      (await page
        .getByRole("heading", {
          name: "Building Storylio with server-first pages and a calmer publishing workflow",
          exact: true,
        })
        .count()) === 0,
      "Tag selection leaked article",
    );
    await visit("projects");
    await page.getByRole("button", { name: "Draft", exact: true }).click();
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .waitFor();
    await page
      .getByRole("heading", {
        name: "Storylio — a portfolio and publishing system",
        exact: true,
      })
      .waitFor();
    assert(
      (await page
        .getByRole("heading", { name: "Nebula Commerce", exact: true })
        .count()) === 1,
      "Reorder lost draft",
    );
    assert(
      (await page
        .getByRole("heading", {
          name: "Storylio — a portfolio and publishing system",
          exact: true,
        })
        .count()) === 1,
      "Reorder not full collection",
    );
    assert(
      (await page
        .getByRole("textbox", { name: "Search projects", exact: true })
        .count()) === 0,
      "Reorder still shows filter toolbar",
    );
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    await visit("gallery");
    await page.getByRole("button", { name: "Hidden", exact: true }).click();
    await page
      .getByText("Visible example", { exact: true })
      .waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Reorder", exact: true }).click();
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .waitFor();
    await page.getByText("Visible example", { exact: true }).waitFor();
    assert(
      (await page.getByText("Hidden example", { exact: true }).count()) === 1,
      "Reorder lost hidden item",
    );
    assert(
      (await page.getByText("Visible example", { exact: true }).count()) === 1,
      "Reorder not full gallery",
    );
    await page
      .getByRole("button", { name: "Done reordering", exact: true })
      .click();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await visit("overview");
    await page.getByRole("button", { name: "New", exact: true }).click();
    await page.keyboard.press("Escape");
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      status: true,
      tags: true,
      reorderMode: true,
      reducedMotion: true,
      errors,
    };
  } finally {
    await context.close();
  }
}
