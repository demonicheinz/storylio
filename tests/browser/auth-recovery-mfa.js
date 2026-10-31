// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function authRecoveryMfa(page) {
  async function openMfaConfirmation() {
    if (
      await page
        .getByLabel("Confirm your password", { exact: true })
        .isVisible()
    )
      return;
    const manage = page.getByRole("button", {
      name: "Manage two-factor",
      exact: true,
    });
    if (await manage.count()) await manage.click();
    else
      await page
        .getByRole("button", { name: "Set up authenticator", exact: true })
        .click();
  }

  const origin = new URL(page.url()).origin;
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const errors = [];
  const onError = (error) => errors.push(error.message);
  const onConsole = (message) => {
    if (
      message.type() === "error" &&
      /hydrated|hydration failed/i.test(message.text())
    )
      errors.push(message.text());
  };
  let mode = "success",
    enabled = false,
    generation = 0;
  const user = () => ({
    id: "fixture-owner",
    name: "Owner",
    email: "owner@example.test",
    emailVerified: true,
    twoFactorEnabled: enabled,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const codes = () =>
    Array.from(
      { length: 10 },
      (_, i) => `code${generation}-${String(i).padStart(5, "0")}`,
    );
  const fixture = async (route) => {
    const path = new URL(route.request().url()).pathname;
    let status = 200,
      body = { status: true };
    if (path.endsWith("/get-session"))
      body = {
        user: user(),
        session: {
          id: "fixture-session",
          userId: "fixture-owner",
          token: "fixture-not-a-real-token",
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    else if (mode === "throttle") {
      status = 429;
      body = { code: "TOO_MANY_REQUESTS", message: "Fixture throttle" };
    } else if (mode === "invalid" && path.endsWith("/reset-password")) {
      status = 400;
      body = { code: "INVALID_TOKEN", message: "Invalid token" };
    } else if (path.endsWith("/sign-in/email"))
      body = { twoFactorRedirect: true, twoFactorMethods: ["totp"] };
    else if (path.endsWith("/two-factor/enable"))
      body = {
        method: "totp",
        totpURI:
          "otpauth://totp/Storylio:fixture?secret=JBSWY3DPEHPK3PXP&issuer=Storylio",
        backupCodes: codes(),
      };
    else if (path.endsWith("/two-factor/generate-backup-codes")) {
      generation++;
      body = { backupCodes: codes() };
    } else if (path.endsWith("/two-factor/disable")) enabled = false;
    else if (
      path.endsWith("/two-factor/verify-totp") ||
      path.endsWith("/two-factor/verify-backup-code")
    ) {
      if (!page.url().includes("auth-security-fixture-check")) {
        status = 401;
        body = { code: "INVALID_CODE", message: "Fixture invalid code" };
      } else {
        enabled = true;
        body = { token: "fixture-token", user: user() };
      }
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  };
  page.on("pageerror", onError);
  page.on("console", onConsole);
  await page.route("**/api/auth/**", fixture);
  try {
    for (const [width, height] of [
      [1440, 1000],
      [390, 844],
      [320, 740],
      [844, 390],
    ]) {
      await page.setViewportSize({ width, height });
      for (const route of [
        "/forgot-password",
        "/reset-password?token=fixture-token",
        "/two-factor",
      ]) {
        await page.goto(origin + route);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForFunction(
          () =>
            document.querySelector("main")?.getAttribute("data-auth-intro") ===
            "complete",
        );
        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          mains: document.querySelectorAll("main").length,
          controls: [
            ...document.querySelectorAll("main input,main button"),
          ].map((el) => el.getBoundingClientRect().height),
          indexed: document.querySelector('meta[name="robots"]')?.content,
          referrer: document.querySelector('meta[name="referrer"]')?.content,
        }));
        assert(
          !layout.overflow && layout.mains === 1,
          `Layout invalid ${route}${JSON.stringify(layout)}`,
        );
        assert(
          layout.controls.every((height) => height >= 44),
          `Small controls ${route}`,
        );
        assert(
          layout.indexed.includes("noindex") &&
            layout.referrer === "no-referrer",
          "Sensitive route metadata missing",
        );
        if ((width === 1440 || width === 390) && route === "/forgot-password")
          await page.screenshot({
            path: `task/auth-recovery-mfa/forgot-${width}.png`,
          });
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/forgot-password`);
    await page
      .getByLabel("Email", { exact: true })
      .fill("unknown@example.test");
    await page
      .getByRole("button", { name: "Send reset link", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "If an eligible account" })
      .waitFor();
    mode = "throttle";
    await page.goto(`${origin}/forgot-password`);
    await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
    await page
      .getByRole("button", { name: "Send reset link", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Too many attempts" })
      .waitFor();
    mode = "success";
    await page.goto(`${origin}/reset-password`);
    await page
      .getByRole("alert")
      .filter({ hasText: "invalid or expired" })
      .waitFor();
    await page.goto(`${origin}/reset-password?token=fixture-token`);
    await page
      .getByLabel("New password", { exact: true })
      .fill("fixture-new-password");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("different-password");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page.getByRole("alert").filter({ hasText: "do not match" }).waitFor();
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("fixture-new-password");
    mode = "invalid";
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "invalid or expired" })
      .waitFor();
    mode = "success";
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "All sessions have been signed out" })
      .waitFor();
    assert(
      !new URL(page.url()).searchParams.has("token"),
      "Reset token retained after success",
    );
    await page.goto(`${origin}/sign-in?callbackUrl=%2Fdashboard%2Fsettings`);
    await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fixture-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL(/\/two-factor\?/);
    assert(
      new URL(page.url()).searchParams.get("callbackUrl") ===
        "/dashboard/settings",
      "Return destination lost",
    );
    await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "wasn’t accepted" })
      .waitFor();
    await page
      .getByRole("button", { name: "Use a backup code", exact: true })
      .click();
    await page.getByLabel("Backup code", { exact: true }).fill("fixture-code");
    await page.getByRole("button", { name: "Verify and sign in" }).click();
    await page.locator("form").getByRole("alert").waitFor();
    await page.screenshot({
      path: "task/auth-recovery-mfa/two-factor-390.png",
    });
    await page.goto(`${origin}/auth-security-fixture-check`);
    await openMfaConfirmation();
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill("fixture-password");
    await page.getByRole("button", { name: "Set up authenticator" }).click();
    await page.getByLabel("Authenticator code", { exact: true }).waitFor();
    assert(
      (await page.locator("svg title").textContent()) ===
        "Scan to add Storylio to your authenticator",
      "QR absent",
    );
    await page.screenshot({ path: "task/auth-recovery-mfa/setup-390.png" });
    await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
    await page.getByRole("button", { name: "Verify and enable" }).click();
    await page.getByRole("list", { name: "Backup codes" }).waitFor();
    assert(
      await page
        .getByRole("button", { name: "Done", exact: true })
        .isDisabled(),
      "Codes can be dismissed without confirmation",
    );
    await page.getByLabel("I saved my backup codes.").check();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await openMfaConfirmation();
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill("fixture-password");

    await page.getByRole("button", { name: "Regenerate backup codes" }).click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page.getByRole("list", { name: "Backup codes" }).waitFor();
    assert(
      await page
        .getByRole("list", { name: "Backup codes" })
        .textContent()
        .then((text) => text.includes("code1-")),
      "Codes not regenerated",
    );
    await page.getByLabel("I saved my backup codes.").check();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await openMfaConfirmation();
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill("fixture-password");

    await page
      .getByRole("button", { name: "Disable two-factor", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Set up authenticator" }).waitFor();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${origin}/forgot-password`);
    await page.getByRole("heading", { level: 1 }).waitFor();
    await page.keyboard.press("Tab");
    assert(errors.length === 0, `Unexpected errors: ${errors.join(";")}`);
    return {
      passed: true,
      viewports: 4,
      flows: [
        "recovery",
        "reset",
        "mfa-challenge",
        "mfa-setup",
        "backup-codes",
        "mfa-disable",
      ],
      errors,
    };
  } finally {
    await page.unroute("**/api/auth/**", fixture);
    page.off("pageerror", onError);
    page.off("console", onConsole);
  }
}
