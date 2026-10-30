// Run against the populated dashboard fixture in an isolated Playwright CLI session.
// Route: /dashboard-overview-fixture-check?view=posts
async function postsBatchSelection(page) {
  const origin = new URL(page.url()).origin;
  const viewport = page.viewportSize();
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on("pageerror", onError);
  const sessionFixture = (route) =>
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        user: {
          id: "owner",
          email: "owner@example.test",
          name: "Example owner",
          image: null,
        },
        session: {
          id: "fixture",
          token: "fixture-token",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        },
      }),
    });
  await page.route("**/api/auth/get-session**", sessionFixture);
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/dashboard-overview-fixture-check?view=posts`);
    await page.getByRole("heading", { name: "Posts", exact: true }).waitFor();
    const row = page
      .locator("article:visible")
      .filter({ has: page.locator("h2") })
      .first();
    const title = row.locator("h2");
    await title.getByRole("link").waitFor();
    const titleText = await title.innerText();
    const href = await title.getByRole("link").getAttribute("href");
    const url = page.url();

    await page.getByRole("button", { name: "Select", exact: true }).click();
    assert(
      (await title.getByRole("link").count()) === 0,
      "Batch title is plain text",
    );
    assert(
      (await title.innerText()) === titleText,
      "Batch title retains its text",
    );
    const checkbox = row.getByRole("checkbox");
    assert(
      (await checkbox.getAttribute("aria-checked")) === "false",
      "Row starts unselected",
    );
    await title.click();
    await row.locator('[role="checkbox"][aria-checked="true"]').waitFor();
    assert(page.url() === url, "Title selection does not navigate");
    await title.click();
    await row.locator('[role="checkbox"][aria-checked="false"]').waitFor();
    assert(page.url() === url, "Title deselection does not navigate");

    // Deselecting the last mobile item intentionally exits batch mode.
    await title.getByRole("link").waitFor();
    await page.getByRole("button", { name: "Select", exact: true }).click();
    await title.getByRole("link").waitFor({ state: "hidden" });
    await title.click();
    await row.locator('[role="checkbox"][aria-checked="true"]').waitFor();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await title.getByRole("link").waitFor();
    assert(
      (await title.getByRole("link").getAttribute("href")) === href,
      "Cancel restores editor link",
    );
    assert(
      (await title.innerText()) === titleText,
      "Cancel retains title text",
    );
    assert(page.url() === url, "Cancel keeps URL stable");
    assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
    console.log(
      "PASS: mobile batch titles toggle selection without navigation; cancel restores editor link",
    );
  } finally {
    await page.unroute("**/api/auth/get-session**", sessionFixture);
    page.off("pageerror", onError);
    if (viewport) await page.setViewportSize(viewport);
  }
}
