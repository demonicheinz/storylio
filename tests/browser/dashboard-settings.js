// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function dashboardSettings(sessionPage) {
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

  const context = await sessionPage
    .context()
    .browser()
    .newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (value, message) => {
    if (!value) throw Error(message);
  };
  const origin = "http://127.0.0.1:3203";
  const fresh = async () => {
    await page.goto(origin);
    await page.getByRole("tab", { name: "Profile", exact: true }).waitFor();
  };
  const tab = async (name) =>
    page.getByRole("tab", { name, exact: true }).click();
  try {
    const widths = [1440, 1024, 768, 390, 360, 320];
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await fresh();
      await page.evaluate(() => document.fonts.ready);
      for (const name of ["Profile", "Account", "Security"]) {
        await tab(name);
        if (name === "Account") {
          assert(
            await page
              .getByText("Current sign-in email", { exact: true })
              .isVisible(),
            "Current email needs an explicit label",
          );
          const password = page.getByLabel("New password", { exact: true });
          assert(
            !(await password.isVisible()),
            "Sensitive form should start collapsed",
          );
          const disclosure = page
            .locator("summary")
            .filter({ hasText: "Change password" });
          await disclosure.click();
          assert(
            await password.isVisible(),
            "Password disclosure did not open",
          );
          assert(
            (await page.getByText(/^Password strength:/).count()) === 0,
            "Empty password should not have a strength verdict",
          );
          await password.fill("Aa1!");
          await page
            .getByRole("status")
            .filter({ hasText: "Password strength: weak" })
            .waitFor();
          await password.fill("Example-password-123");
          await page
            .getByRole("status")
            .filter({ hasText: "Password strength: strong" })
            .waitFor();
          await password.fill("fixture-draft-password");
          await disclosure.click();
          await disclosure.click();
          assert(
            (await password.inputValue()) === "fixture-draft-password",
            "Collapsing a task lost its form draft",
          );
          await password.fill("");
          await disclosure.click();
        }
        if (name === "Security")
          await page
            .getByText("Example laptop with a long descriptive label", {
              exact: true,
            })
            .waitFor();
        await page
          .locator(
            width >= 1024
              ? '[role="tablist"][aria-orientation="vertical"]'
              : '[role="tablist"]:not([aria-orientation="vertical"])',
          )
          .waitFor();
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width} ${name} body overflow`,
        );
        assert(
          await page
            .locator('[role="tabpanel"]')
            .filter({ visible: true })
            .locator("label")
            .evaluateAll((nodes) => nodes.every((node) => !!node.control)),
          `${width} ${name} unassociated label`,
        );
        assert(
          (
            await page
              .getByRole("tab", { name: "Profile", exact: true })
              .boundingBox()
          ).height >= 44,
          "Tab target too small",
        );
        if ([1440, 768, 320].includes(width))
          await page.screenshot({
            path: `task/dashboard-settings-review/updated-${name.toLowerCase()}-${width}.png`,
            fullPage: true,
          });
        if (width === 1440 && name === "Security") {
          const mfa = await page
            .getByRole("heading", {
              name: "Two-factor authentication",
              exact: true,
            })
            .boundingBox();
          const passkeys = await page
            .getByRole("heading", { name: "Passkeys", exact: true })
            .boundingBox();
          const sessions = await page
            .getByRole("heading", { name: "Active sessions", exact: true })
            .boundingBox();
          assert(passkeys.y > mfa.y, "Desktop security methods should stack");
          assert(
            sessions.y > mfa.y,
            "Sessions should follow the sign-in methods",
          );
          for (const [title, action] of [
            ["Two-factor authentication", "Set up authenticator"],
            ["Passkeys", "Add Passkey"],
            ["Active sessions", "Revoke Other Sessions"],
          ]) {
            const heading = page.getByRole("heading", {
              name: title,
              exact: true,
            });
            const header = heading.locator(
              'xpath=ancestor::*[@data-slot="card-header"]',
            );
            const button = header.getByRole("button", {
              name: action,
              exact: true,
            });
            const h = await heading.boundingBox();
            const b = await button.boundingBox();
            assert(
              !!b && b.x > h.x && Math.abs(b.y - h.y) < 20,
              `${action} should sit at the right of its section header`,
            );
          }
        }
      }
    }
    await tab("Account");
    await page.getByRole("button", { name: "Unlink", exact: true }).click();
    await page
      .getByText("No external providers connected.", { exact: true })
      .waitFor();
    await tab("Profile");
    await tab("Account");
    assert(
      await page
        .getByRole("button", { name: "Link GitHub Account", exact: true })
        .isVisible(),
      "An unlinked provider returned after switching tabs",
    );
    assert(
      (await page
        .getByRole("button", { name: "Unlink", exact: true })
        .count()) === 0,
      "Unlinked provider row should not remount from stale props",
    );
    assert(
      (await page.evaluate(
        () =>
          window.settingsFixture.calls.filter((call) => call.name === "unlink")
            .length,
      )) === 1,
      "Tab switches should not repeat unlink",
    );
    await fresh();
    await tab("Account");
    await page.evaluate(() => {
      window.settingsFixture.fail = "unlink";
    });
    await page.getByRole("button", { name: "Unlink", exact: true }).click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Could not unlink" })
      .waitFor();
    await tab("Profile");
    await tab("Account");
    assert(
      await page
        .getByRole("button", { name: "Unlink", exact: true })
        .isVisible(),
      "Failed unlink must retain the provider",
    );
    await page.evaluate(() => {
      window.settingsFixture.fail = null;
      window.settingsFixture.hold = "unlink";
    });
    await page.getByRole("button", { name: "Unlink", exact: true }).click();
    await tab("Profile");
    await page.evaluate(() => {
      window.settingsFixture.hold = null;
      window.settingsFixture.release();
    });
    await tab("Account");
    await page
      .getByText("No external providers connected.", { exact: true })
      .waitFor();
    for (const close of await page
      .getByRole("button", { name: "Close toast", exact: true })
      .all()) {
      if (await close.isVisible()) await close.click();
    }
    await tab("Profile");
    await page
      .getByLabel("Display name", { exact: false })
      .fill("Fixture updated owner");
    await page.setViewportSize({ width: 1024, height: 900 });
    await page
      .locator('[role="tablist"][aria-orientation="vertical"]')
      .waitFor();
    assert(
      (await page.getByLabel("Display name", { exact: false }).inputValue()) ===
        "Fixture updated owner",
      "Changing navigation orientation lost the draft",
    );
    await page.setViewportSize({ width: 320, height: 900 });
    await page
      .locator('[role="tablist"]:not([aria-orientation="vertical"])')
      .waitFor();
    await tab("Account");
    await tab("Profile");
    assert(
      (await page.getByLabel("Display name", { exact: false }).inputValue()) ===
        "Fixture updated owner",
      "Profile draft lost across tabs",
    );
    await page.evaluate(() => {
      window.settingsFixture.fail = "profile:throw";
    });
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("alert")
      .filter({ hasText: "Could not complete" })
      .waitFor();
    await page.evaluate(() => {
      window.settingsFixture.fail = null;
    });
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Profile saved" })
      .waitFor();
    await page
      .getByRole("button", { name: "Change photo", exact: true })
      .click();
    let releaseUpload;
    let started = false;
    await page.route("**/api/upload", async (route) => {
      started = true;
      await new Promise((resolve) => (releaseUpload = resolve));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: `${origin}/avatar.svg?new`,
          width: 1,
          height: 1,
        }),
      });
    });
    await page
      .locator('input[type="file"]')
      .setInputFiles("tests/fixtures/dashboard-settings/avatar.gif");
    await page
      .locator('[data-slot="dialog-content"]')
      .getByText("Uploading...", { exact: true })
      .waitFor();
    assert(started, "Upload did not start");
    assert(
      await page
        .getByRole("button", {
          name: "Save changes",
          exact: true,
          includeHidden: true,
        })
        .isDisabled(),
      "Save available during upload",
    );
    releaseUpload();
    await page
      .locator('[data-slot="dialog-content"]')
      .waitFor({ state: "hidden" });
    await page.unroute("**/api/upload");
    await page
      .getByRole("button", { name: "Save changes", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "Profile saved" })
      .waitFor();
    assert(
      await page.evaluate(() =>
        window.settingsFixture.calls
          .filter((x) => x.name === "profile")
          .at(-1)
          .args.image.includes("?new"),
      ),
      "New avatar not submitted",
    );
    await tab("Security");
    await page.evaluate(() => {
      window.settingsFixture.fail = "addPasskey";
    });
    await page
      .getByRole("button", { name: "Add Passkey", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save Passkey", exact: true })
      .click();
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole("alert")
      .filter({ hasText: "Fixture operation cancelled" })
      .waitFor();
    assert(
      await page.locator('[data-slot="dialog-content"]').isVisible(),
      "Failed registration closed dialog",
    );
    assert(
      (await page
        .getByText("Passkey added successfully.", { exact: true })
        .count()) === 0,
      "False passkey success",
    );
    await page
      .locator('[data-slot="dialog-content"]')
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    await page.evaluate(() => {
      window.settingsFixture.fail = null;
      window.settingsFixture.throwSessions = true;
    });
    await tab("Account");
    await tab("Security");
    await page
      .getByRole("alert")
      .filter({ hasText: "Could not load sessions" })
      .waitFor();
    assert(
      (await page
        .getByText("No active sessions are available.", { exact: true })
        .count()) === 0,
      "Session error shown as empty",
    );
    await page.evaluate(() => {
      window.settingsFixture.throwSessions = false;
    });
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await page
      .getByRole("heading", { name: "Dashboard session", exact: true })
      .waitFor();
    await openMfaConfirmation();
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill("fixture-password");
    await page.evaluate(() => {
      window.settingsFixture.hold = "enable";
    });
    await page
      .getByRole("button", { name: "Set up authenticator", exact: true })
      .click();
    await tab("Account");
    assert(
      (await page
        .getByRole("tab", { name: "Security", exact: true })
        .getAttribute("aria-selected")) === "true",
      "Pending MFA allowed tab departure",
    );
    await page.evaluate(() => {
      window.settingsFixture.hold = null;
      window.settingsFixture.release();
    });
    for (const close of await page
      .getByRole("button", { name: "Close toast", exact: true })
      .all()) {
      if (await close.isVisible()) await close.click();
    }
    await page.getByLabel("Authenticator code", { exact: true }).fill("123456");
    await page.screenshot({
      path: "task/dashboard-settings-review/updated-mfa-setup-320.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Verify and enable", exact: true })
      .click();
    await page
      .getByRole("list", { name: "Backup codes", exact: true })
      .waitFor();
    await page.screenshot({
      path: "task/dashboard-settings-review/updated-mfa-codes-320.png",
      fullPage: true,
    });
    await page
      .getByRole("heading", { name: "Dashboard session", exact: true })
      .waitFor({ state: "hidden" });

    await tab("Account");
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-cancel"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    assert(
      (await page
        .getByRole("tab", { name: "Security", exact: true })
        .getAttribute("aria-selected")) === "true",
      "Unsaved backup codes did not guard tab departure",
    );
    assert(
      await page
        .getByRole("button", { name: "Done", exact: true })
        .isDisabled(),
      "Unsaved backup codes allowed Done",
    );
    await page.getByLabel("I saved my backup codes.").check();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    assert(
      await page
        .getByRole("button", { name: "Add Passkey", exact: true })
        .isDisabled(),
      "MFA should prevent passkey addition",
    );
    await openMfaConfirmation();
    await page
      .getByLabel("Confirm your password", { exact: true })
      .fill("fixture-password");
    const before = await page.evaluate(
      () =>
        window.settingsFixture.calls.filter(
          (x) => x.name === "generateBackupCodes",
        ).length,
    );

    await page
      .getByRole("button", { name: "Regenerate backup codes", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-cancel"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    assert(
      (await page.evaluate(
        () =>
          window.settingsFixture.calls.filter(
            (x) => x.name === "generateBackupCodes",
          ).length,
      )) === before,
      "Cancelled regeneration called API",
    );

    await page
      .getByRole("button", { name: "Regenerate backup codes", exact: true })
      .click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page
      .getByRole("list", { name: "Backup codes", exact: true })
      .waitFor();

    await tab("Account");
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await tab("Security");
    assert(
      (await page
        .getByRole("list", { name: "Backup codes", exact: true })
        .count()) === 0,
      "Leaving Security retained backup secrets in hidden UI",
    );
    await page.evaluate(() => {
      window.settingsFixture.authError = true;
      window.settingsNotify();
    });
    await page.getByRole("button", { name: "Retry" }).waitFor();
    assert(
      (await page
        .getByRole("button", { name: "Set up authenticator", exact: true })
        .count()) === 0,
      "Unknown MFA treated as disabled",
    );
    await page.goto(`${origin}/?view=totp`);
    const loginCode = page.getByLabel("Authenticator code", { exact: true });
    await loginCode.waitFor();
    assert(
      (await loginCode.getAttribute("autocomplete")) === "one-time-code",
      "Login TOTP should support autofill",
    );
    assert(
      (await page
        .getByText("Paste or enter the six-digit code from your app.", {
          exact: true,
        })
        .count()) === 0,
      "Redundant TOTP helper text should be removed",
    );
    const label = await page.locator('label[for="authenticator-code"]');
    assert(
      (await label.getAttribute("class")) === "sr-only",
      "TOTP label should remain accessible without visible duplication",
    );
    const form = await page.locator("form").boundingBox();
    const field = await loginCode.boundingBox();
    assert(
      Math.abs(form.x + form.width / 2 - (field.x + field.width / 2)) < 2,
      "Login TOTP slots should be centered",
    );
    await loginCode.evaluate((node) => {
      const data = new DataTransfer();
      data.setData("text", "123 456");
      node.dispatchEvent(
        new ClipboardEvent("paste", {
          clipboardData: data,
          bubbles: true,
          cancelable: true,
        }),
      );
    });
    assert(
      (await loginCode.inputValue()) === "123456",
      "Login TOTP did not normalize a pasted code",
    );
    await page.evaluate(() => {
      window.settingsFixture.fail = "verifyTotp";
    });
    await page
      .getByRole("button", { name: "Verify and sign in", exact: true })
      .click();
    await page.getByRole("alert").waitFor();
    assert(
      (await loginCode.getAttribute("aria-invalid")) === "true",
      "Login TOTP error should be associated with the field",
    );
    await page.screenshot({
      path: "task/dashboard-settings-review/updated-login-totp-320.png",
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Use a backup code", exact: true })
      .click();
    const backupCode = page.getByLabel("Backup code", { exact: true });
    await backupCode.fill("fixture-backup-code");
    await page
      .getByRole("button", { name: "Use authenticator app", exact: true })
      .click();
    assert(
      (await page
        .getByLabel("Authenticator code", { exact: true })
        .inputValue()) === "",
      "Switching back to TOTP should clear the previous code",
    );
    await fresh();
    await tab("Security");
    const keyName = "Example laptop with a long descriptive label";
    const remove = page.getByRole("button", {
      name: `Delete ${keyName}`,
      exact: true,
    });
    assert(
      (await remove.getAttribute("data-variant")) === "destructive",
      "Delete should use destructive styling",
    );
    await remove.click();
    const deletePrompt = page.getByRole("alertdialog", {
      name: "Delete passkey?",
      exact: true,
    });
    await deletePrompt.waitFor();
    assert(
      (await deletePrompt.textContent()).includes(keyName),
      "Delete confirmation should name the key",
    );
    await deletePrompt.locator('[data-slot="alert-dialog-cancel"]').click();
    await deletePrompt.waitFor({ state: "hidden" });
    assert(
      (await page.evaluate(
        () =>
          window.settingsFixture.calls.filter(
            (call) => call.name === "deletePasskey",
          ).length,
      )) === 0,
      "Cancelled delete called auth",
    );

    await remove.click();
    await page
      .getByRole("alertdialog")
      .last()
      .locator('[data-slot="alert-dialog-action"]')
      .click();
    await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
    await page.getByText(keyName, { exact: true }).waitFor({ state: "hidden" });
    const revokeOthers = page.getByRole("button", {
      name: "Revoke Other Sessions",
      exact: true,
    });
    assert(
      (await revokeOthers.getAttribute("data-variant")) === "destructive",
      "Bulk revoke should use destructive styling",
    );
    await revokeOthers.click();
    const bulkDialog = page.getByRole("alertdialog", {
      name: "Revoke other sessions?",
      exact: true,
    });
    await bulkDialog.waitFor();
    // biome-ignore lint/performance/useDomNodeTextContent: This is the Playwright locator method; the check reads the visible confirmation copy.
    const confirmationText = await bulkDialog.innerText();
    await page.screenshot({
      path: "task/dashboard-settings-review/updated-session-confirm-320.png",
      fullPage: true,
    });
    await bulkDialog
      .getByRole("button", { name: "Cancel", exact: true })
      .click();
    assert(
      await revokeOthers.evaluate((node) => node === document.activeElement),
      "Cancel should return focus to Revoke Other Sessions",
    );
    assert(
      confirmationText.includes("1 other session") &&
        confirmationText.includes("This browser will remain signed in"),
      "Bulk confirmation should explain count and current session",
    );
    assert(
      (await page.evaluate(
        () =>
          window.settingsFixture.calls.filter(
            (call) => call.name === "revokeOthers",
          ).length,
      )) === 0,
      "Cancelled bulk revoke called auth",
    );
    await revokeOthers.click();
    await page.evaluate(() => {
      window.settingsFixture.fail = "revokeOthers";
    });
    await bulkDialog
      .getByRole("button", { name: "Revoke 1 session", exact: true })
      .click();
    await bulkDialog
      .getByRole("alert")
      .filter({ hasText: "Fixture operation cancelled" })
      .waitFor();
    assert(
      await bulkDialog.isVisible(),
      "Failed bulk revoke should leave the confirmation open for retry",
    );
    await page.evaluate(() => {
      window.settingsFixture.fail = null;
      window.settingsFixture.hold = "revokeOthers";
    });
    await bulkDialog
      .getByRole("button", { name: "Revoke 1 session", exact: true })
      .click();
    assert(
      await bulkDialog
        .getByRole("button", { name: "Cancel", exact: true })
        .isDisabled(),
      "Pending bulk revoke should lock dismissal",
    );
    await page.evaluate(() => {
      window.settingsFixture.hold = null;
      window.settingsFixture.release();
    });
    await bulkDialog.waitFor({ state: "hidden" });
    await page
      .getByRole("heading", { name: "Dashboard session", exact: true })
      .waitFor({ state: "hidden" });
    assert(
      await page
        .getByRole("heading", { name: "Current session", exact: true })
        .isVisible(),
      "Bulk revoke removed the current session",
    );
    await fresh();
    await tab("Security");
    const singleRevoke = page.getByRole("button", {
      name: /^Revoke session from/,
    });
    assert(
      (await singleRevoke.getAttribute("data-variant")) === "ghost",
      "Single revoke should be visually quiet",
    );
    await singleRevoke.click();
    await page
      .getByRole("heading", { name: "Dashboard session", exact: true })
      .waitFor({ state: "hidden" });
    assert(errors.length === 0, errors.join(";"));
    return {
      passed: true,
      widths,
      checks: [
        "desktop rail and compact horizontal tabs",
        "task-specific desktop layouts and sensitive-form disclosures",
        "responsive fields and headings",
        "profile transport recovery",
        "unlinked providers stay removed across tab remounts",
        "avatar upload/save coordination",
        "passkey resolved errors",
        "session retry",
        "MFA pending and unsaved-code departure",
        "post-MFA sessions refresh",
        "regeneration confirmation",
        "unknown auth state",
        "shared login TOTP paste, autofill and error feedback",
        "destructive actions with named/count confirmations and cancellation",
      ],
      errors,
    };
  } finally {
    await context.close();
  }
}
