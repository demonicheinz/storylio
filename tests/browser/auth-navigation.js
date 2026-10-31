// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  page.setDefaultTimeout(2000);
  const origin = "http://127.0.0.1:3204";
  const failures = [], results = [], errors = [];
  const onError = (error) => errors.push(error.message);
  page.on("pageerror", onError);
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const settle = () => page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const load = async (path = "/sign-in") => {
    await page.goto(origin + path);
    await page.getByTestId("route").waitFor();
    await settle();
  };
  const submit = async () => {
    await page.getByLabel("Email", { exact: true }).fill("owner@example.test");
    await page.getByLabel("Password", { exact: true }).fill("fixture-password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await settle();
  };
  const ready = async () => {
    await settle();
    assert(await page.getByRole("button", { name: "Sign in", exact: true }).isEnabled(), "Restored form must allow another sign-in");
    assert(await page.locator("form").getAttribute("aria-busy") === "false", "Restored form must not remain busy");
  };
  const check = async (name, run) => {
    try { await run(); results.push(name); }
    catch (error) { failures.push(`${name}: ${error.message}`); }
  };
  try {
    for (const method of ["password", "passkey", "github", "mfa"]) {
      await check(`${method}: cached redirect restore`, async () => {
        await load();
        if (method === "github") await page.evaluate(() => { window.authFixture.result = { data: { url: "https://example.test/oauth" }, error: null }; });
        if (method === "mfa") await page.evaluate(() => { window.authFixture.result = { data: { twoFactorRedirect: true }, error: null }; });
        if (method === "password" || method === "mfa") await submit();
        else await page.getByRole("button", { name: method === "github" ? "Continue with GitHub" : "Sign in with passkey", exact: true }).click();
        await settle();
        if (method === "github") await page.getByRole("button", { name: "Leave sign in" }).click();
        await page.getByRole("button", { name: "Restore sign in" }).click();
        await ready();
        await page.evaluate(() => { window.authFixture.result = { data: null, error: { status: 401 } }; });
        await submit();
        assert(await page.getByRole("alert").textContent() === "Email or password is incorrect.", "Restored lock must be released, not just the spinner");
      });
    }
    await check("late success from previous visibility cannot interrupt newer attempt", async () => {
      await load();
      await page.evaluate(() => { window.authFixture.deferred = true; });
      await submit();
      await page.getByRole("button", { name: "Leave sign in" }).click();
      await page.getByRole("button", { name: "Restore sign in" }).click();
      await ready();
      await submit();
      await page.evaluate(() => window.authFixture.waiting[0].resolve({ data: { user: {}, session: {} }, error: null }));
      await settle();
      assert(await page.getByTestId("route").textContent() === "/sign-in", "Stale request navigated the restored form");
      assert(await page.locator("form").getAttribute("aria-busy") === "true", "Stale request released the current lock");
      await page.evaluate(() => window.authFixture.waiting[1].resolve({ data: null, error: { status: 401 } }));
      await ready();
    });
    await check("late rejection cannot overwrite current pending request", async () => {
      await load();
      await page.evaluate(() => { window.authFixture.deferred = true; });
      await submit();
      await page.getByRole("button", { name: "Leave sign in" }).click();
      await page.getByRole("button", { name: "Restore sign in" }).click();
      await ready();
      await submit();
      await page.evaluate(() => window.authFixture.waiting[0].reject(new Error("fixture late failure")));
      await settle();
      assert(await page.getByRole("alert").count() === 0, "Stale failure was displayed");
      assert(await page.locator("form").getAttribute("aria-busy") === "true", "Stale failure released the newer request");
      await page.evaluate(() => window.authFixture.waiting[1].resolve({ data: null, error: { status: 401 } }));
      await ready();
    });
    await check("BFCache restore resets pending and ignores the old response", async () => {
      await load();
      await page.evaluate(() => { window.authFixture.deferred = true; });
      await submit();
      await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
      await ready();
      await page.evaluate(() => window.authFixture.waiting[0].resolve({ data: { user: {}, session: {} }, error: null }));
      await settle();
      assert(await page.getByTestId("route").textContent() === "/sign-in", "Response from before BFCache restore navigated");
      await ready();
    });
    await check("request and redirect remain locked until departure", async () => {
      await load();
      await page.evaluate(() => {
        window.authFixture.deferred = true;
        window.authFixture.router.replace = (path) => window.authFixture.calls.push(`replace:${path}`);
      });
      await submit();
      await page.locator("form").evaluate((form) => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      await settle();
      assert(await page.evaluate(() => window.authFixture.calls.filter((call) => call === "password").length) === 1, "Duplicate sign-in request escaped lock");
      await page.evaluate(() => window.authFixture.waiting[0].resolve({ data: { user: {}, session: {} }, error: null }));
      await settle();
      assert(await page.locator("form").getAttribute("aria-busy") === "true", "Successful sign-in unlocked before navigation completed");
      await page.getByRole("button", { name: "Leave sign in" }).click();
      await page.getByRole("button", { name: "Restore sign in" }).click();
      await ready();
    });
    await check("navigation exception releases the form for retry", async () => {
      await load();
      await page.evaluate(() => { window.authFixture.router.replace = () => { throw new Error("fixture navigation failure"); }; });
      await submit();
      await ready();
      assert((await page.getByRole("alert").textContent()).includes("Unable to connect"), "Navigation failure lacks safe feedback");
    });
    for (const mode of ["error", "throw"]) {
      await check(`${mode}: failed logout remains recoverable`, async () => {
        await load("/dashboard");
        await page.evaluate((mode) => { window.authFixture.logout = mode; }, mode);
        await page.getByRole("button", { name: "Account menu" }).click();
        await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
        await settle();
        assert(await page.getByTestId("route").textContent() === "/dashboard", "Failed logout navigated away");
        assert((await page.getByRole("alert").textContent()).includes("Unable to sign out"), "Failed logout needs a safe visible error");
        assert(!(await page.locator("body").textContent()).includes("PRIVATE"), "Server error leaked into UI");
        await page.evaluate(() => { window.authFixture.logout = "success"; });
        await page.getByRole("button", { name: "Account menu" }).click();
        await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
        await page.waitForURL(`${origin}/sign-in`);
        await ready();
      });
    }
    await check("successful logout crosses a fresh document boundary", async () => {
      await load("/dashboard");
      await page.evaluate(() => { window.authFixture.oldDocument = true; });
      await page.getByRole("button", { name: "Account menu" }).click();
      await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
      await page.waitForURL(`${origin}/sign-in`);
      await ready();
      assert(await page.evaluate(() => !window.authFixture.oldDocument), "Logout reused the authenticated document");
    });
    await check("pending logout prevents duplicate requests and recovers on failure", async () => {
      await load("/dashboard");
      await page.evaluate(() => { window.authFixture.logout = "deferred"; });
      await page.getByRole("button", { name: "Account menu" }).click();
      await page.getByRole("menuitem", { name: "Sign out", exact: true }).click();
      await page.getByRole("button", { name: "Account menu" }).click();
      assert(await page.getByRole("menuitem", { name: "Signing out…" }).isDisabled(), "Pending logout should be disabled");
      assert(await page.evaluate(() => window.authFixture.calls.filter((call) => call === "logout").length) === 1, "Duplicate logout request");
      await page.keyboard.press("Escape");
      await page.evaluate(() => window.authFixture.waiting[0].reject(new Error("fixture network failure")));
      await settle();
      assert((await page.getByRole("alert").textContent()).includes("Unable to sign out"), "Pending logout failure lacks feedback");
    });
    if (errors.length) failures.push(`Runtime errors: ${errors.join(", ")}`);
  } finally { page.removeListener("pageerror", onError); }
  console.log(JSON.stringify({ results, failures, errors }));
  if (failures.length) throw new Error(failures.join("\n"));
  return { results, failures, errors };
}
