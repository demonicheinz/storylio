// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function recoveryConfirmation(sessionPage) {
  const origin = new URL(sessionPage.url()).origin;
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const requests = [];
  await page.route("**/api/auth/request-password-reset", async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ status: true }),
    });
  });
  try {
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 844,
      });
      await page.goto(`${origin}/forgot-password`);
      await page
        .getByLabel("Email", { exact: true })
        .fill("fixture@example.test");
      await page
        .getByRole("button", { name: "Send reset link", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Check your inbox", exact: true })
        .waitFor();
      assert(
        await page
          .getByRole("status")
          .textContent()
          .then((t) => t.includes("If an eligible account")),
        "Must preserve generic response",
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "Horizontal overflow",
      );
      const confirmation = await page.getByRole("status").evaluate((el) => ({
        align: getComputedStyle(el).textAlign,
        width: el.getBoundingClientRect().width,
        center:
          el.getBoundingClientRect().left +
          el.getBoundingClientRect().width / 2,
        viewport: innerWidth,
      }));
      assert(
        confirmation.align === "center" &&
          confirmation.width <= 361 &&
          Math.abs(confirmation.center - confirmation.viewport / 2) < 2,
        "Confirmation must be centered and bounded",
      );
      const back = page.getByRole("link", {
        name: "Back to sign in",
        exact: true,
      });
      assert(
        (await back.getAttribute("data-variant")) === "default",
        "Back link must be primary action",
      );
      assert(
        (await back.getAttribute("href")) === "/sign-in",
        "Back link destination changed",
      );
      assert(
        (await page
          .getByText("Your next step is in your email.", { exact: true })
          .count()) === 0,
        "Redundant subtitle remains",
      );
      if (width !== 320)
        await page.screenshot({
          path: `task/auth-login-fix/recovery-${width}.png`,
          fullPage: true,
          caret: "initial",
        });
      await page
        .getByRole("button", { name: "Try another email", exact: true })
        .click();
      const email = page.getByLabel("Email", { exact: true });
      await email.waitFor();
      assert(
        await email.evaluate((el) => el === document.activeElement),
        "Retry email must receive focus",
      );
      assert(
        (await email.inputValue()) === "",
        "Retry must not retain submitted email",
      );
    }
    assert(
      requests.every((r) => new URL(r.redirectTo).protocol === "http:"),
      "Callback must use local origin",
    );
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      viewports: 3,
      genericConfirmation: true,
      retryFocus: true,
      requests: requests.length,
      errors,
    };
  } finally {
    await context.close();
  }
}
