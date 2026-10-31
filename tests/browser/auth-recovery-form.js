async function authRecoveryForm(sessionPage) {
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const origin = new URL(sessionPage.url()).origin;
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (ok, message) => {
    if (!ok) throw Error(message);
  };
  try {
    for (const suffix of [
      "",
      "?token=",
      "?token=fixture&error=expired",
      `?token=${"x".repeat(513)}`,
    ]) {
      await page.goto(`${origin}/reset-password${suffix}`);
      await page
        .getByText(/invalid or expired/i)
        .first()
        .waitFor();
      assert(
        (await page
          .getByRole("button", { name: "Reset password", exact: true })
          .count()) === 0,
        "Invalid link permits submission",
      );
      assert(
        (await page.evaluate(() => window.authFixture.calls.length)) === 0,
        "Invalid link called auth",
      );
    }
    await page.goto(`${origin}/reset-password?token=fixture-token`);
    await page
      .getByLabel("New password", { exact: true })
      .fill("fixture-password-123");
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("different-password");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Passwords do not match" })
      .waitFor();
    assert(
      (await page.evaluate(() => window.authFixture.calls.length)) === 0,
      "Mismatch called auth",
    );
    await page
      .getByLabel("Confirm new password", { exact: true })
      .fill("fixture-password-123");
    await page
      .getByRole("button", { name: "Reset password", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Password updated", exact: true })
      .waitFor();
    assert(
      await page.evaluate(
        () =>
          window.authFixture.recoveryInput.token === "fixture-token" &&
          window.authFixture.calls.join() === "reset-password",
      ),
      "Reset token or operation changed",
    );
    assert(new URL(page.url()).search === "", "Reset token remains in URL");
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
      await page.evaluate(
        () => window.authFixture.calls.join() === "request-reset",
      ),
      "Forgot password used wrong operation",
    );
    await page
      .getByRole("button", { name: "Try another email", exact: true })
      .click();
    await page.getByLabel("Email", { exact: true }).waitFor();
    assert(errors.length === 0, errors.join("\n"));
    return {
      passed: true,
      checks: [
        "invalid token guards",
        "password mismatch",
        "token forwarding",
        "token URL cleanup",
        "generic recovery confirmation",
        "retry form",
      ],
    };
  } finally {
    await context.close();
  }
}
