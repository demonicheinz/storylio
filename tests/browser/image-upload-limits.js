async function imageUploadLimits(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  const file = {
    name: "fixture.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixturebytes"),
  };
  try {
    await page.goto(`${origin}/?limits`);
    await page.getByRole("button", { name: "Limit 8", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles(file);
    assert(
      (await page.evaluate(() => window.uploadFixture.calls)) === 0,
      "Changed size limit was ignored by a stale upload callback",
    );
    await page
      .getByText("File too large. Maximum 8 bytes.", { exact: true })
      .waitFor();
    await page
      .getByRole("button", { name: "Change label", exact: true })
      .click();
    await page.locator("input[type=file]").setInputFiles(file);
    await page
      .getByText("File too large. Maximum eight bytes.", { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Limit 32", exact: true }).click();
    await page.locator("input[type=file]").setInputFiles(file);
    await page.waitForFunction(() => window.uploadFixture.calls === 1);
    await page.evaluate(() => window.uploadFixture.resolve());
    await page.getByRole("button", { name: /Drop an image here/ }).waitFor();
    return {
      passed: true,
      checks: [
        "changed limit rejects before transport",
        "changed label used by validation",
        "relaxed limit uploads once",
      ],
    };
  } finally {
    await context.close();
  }
}
