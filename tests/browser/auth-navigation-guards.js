async function navigationGuard(page) {
  const origin = new URL(page.url()).origin;
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  let held = null;
  const dashboardRequests = [];
  const onRequest = (request) => {
    if (new URL(request.url()).pathname.startsWith("/dashboard"))
      dashboardRequests.push(request.url());
  };
  page.on("request", onRequest);
  await page.route("**/api/auth/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (
      path.endsWith("/reset-password") ||
      path.endsWith("/two-factor/verify-totp")
    ) {
      held = route;
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "null",
    });
  });
  try {
    for (const [width, height] of [
      [1440, 1000],
      [390, 844],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(origin + "/forgot-password");
      await page.waitForFunction(
        () =>
          document.querySelector("main")?.getAttribute("data-auth-intro") ===
          "complete",
      );
      await page.screenshot({
        path: `task/auth-recovery-mfa/forgot-${width}.png`,
      });
    }
    for (const path of ["/forgot-password", "/reset-password", "/two-factor"]) {
      const response = await page.request.get(origin + path);
      assert(
        response.headers()["referrer-policy"] === "no-referrer",
        "Missing sensitive-route referrer header",
      );
      assert(
        response.headers()["x-robots-tag"].includes("noindex"),
        "Missing noindex header",
      );
    }
    await page.goto(origin + "/reset-password?token=fixture-token");
    await page
      .getByLabel("New password", { exact: true })
      .fill("fixture-new-password");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("fixture-new-password");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page.waitForFunction(
      () => document.querySelector("button[type=submit]").disabled,
    );
    await page
      .getByRole("link", { name: "Back to sign in", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Sign in to Storylio", exact: true })
      .waitFor();
    const resetResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/auth/reset-password"),
    );
    await held.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"status":true}',
    });
    await resetResponse;
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    assert(
      new URL(page.url()).pathname === "/sign-in",
      "Late reset response rewrote the sign-in URL",
    );
    held = null;
    await page.goto(origin + "/two-factor");
    await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page
      .getByRole("link", { name: "Back to sign in", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Sign in to Storylio", exact: true })
      .waitFor();
    const mfaResponse = page.waitForResponse((response) =>
      response.url().endsWith("/api/auth/two-factor/verify-totp"),
    );
    await held.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"token":"fixture-token","user":{"id":"fixture-owner"}}',
    });
    await mfaResponse;
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(resolve)),
        ),
    );
    assert(
      dashboardRequests.length === 0,
      "Late MFA response navigated away from sign-in",
    );
    return {
      passed: true,
      lateResetIgnored: true,
      lateMfaIgnored: true,
      sensitiveHeaders: true,
    };
  } finally {
    await page.unroute("**/api/auth/**");
    page.off("request", onRequest);
  }
}
