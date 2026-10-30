async function postsPublicationClock(sessionPage) {
  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  const summary = () =>
    page
      .locator("dl")
      .evaluate((element) =>
        Object.fromEntries(
          [...element.querySelectorAll("dt")].map((dt) => [
            dt.textContent,
            Number(dt.nextElementSibling.textContent.replaceAll(",", "")),
          ]),
        ),
      );
  const status = async (value) => {
    await page
      .getByRole("combobox", { name: "Status", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByRole("option", { name: value, exact: true }).click();
  };
  try {
    await page.clock.install({ time: new Date("2026-10-29T10:00:00Z") });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${new URL(sessionPage.url()).origin}/?due`);
    await page.getByRole("heading", { name: "Posts", exact: true }).waitFor();
    const before = await summary();
    await status("Scheduled");
    await page.getByRole("link", { name: "Post 2", exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Open actions for Post 2", exact: true })
      .filter({ visible: true })
      .click();
    assert(
      (await page.getByText("View live", { exact: true }).count()) === 0,
      "Scheduled post exposes live action",
    );
    await page.keyboard.press("Escape");
    await page.clock.fastForward(61_000);
    await page
      .getByRole("link", { name: "Post 2", exact: true })
      .waitFor({ state: "hidden" });
    const after = await summary();
    assert(
      after.Published === before.Published + 1,
      "Published summary did not advance",
    );
    assert(
      after.Scheduled === before.Scheduled - 1,
      "Scheduled summary did not advance",
    );
    assert(
      after.Views === before.Views + 14,
      "Views summary did not advance with publication",
    );
    await status("Published");
    await page.getByRole("link", { name: "Post 2", exact: true }).waitFor();
    await page
      .getByRole("button", { name: "Open actions for Post 2", exact: true })
      .filter({ visible: true })
      .click();
    await page.getByText("View live", { exact: true }).waitFor();
    return {
      passed: true,
      before,
      after,
      checks: [
        "due filter refresh",
        "summary clock",
        "views clock",
        "live action clock",
      ],
    };
  } finally {
    await context.close();
  }
}
