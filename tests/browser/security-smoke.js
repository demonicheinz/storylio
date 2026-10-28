// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin = new URL(page.url()).origin;
  const errors = [];
  const onPageError = (error) => errors.push(error.message);
  const onConsole = (message) => {
    if (message.type() === "error") errors.push(message.text());
  };
  const passkeyChallenge = "**/api/auth/passkey/generate-authenticate-options";
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  page.on("pageerror", onPageError);
  page.on("console", onConsole);
  try {
    // Conditional passkey UI normally persists a challenge. Keep this smoke
    // isolated; a real WebAuthn ceremony needs a dedicated auth environment.
    await page.route(passkeyChallenge, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          challenge: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          rpId: new URL(origin).hostname,
          allowCredentials: [],
          userVerification: "preferred",
          timeout: 60_000,
        }),
      }),
    );
    await page.context().clearCookies();
    await page.goto(`${origin}/sign-in`);
    await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
    check(await page.getByLabel("Email").isVisible(), "Email field is missing");

    const password = page.getByLabel("Password", { exact: true });
    check(
      (await password.getAttribute("type")) === "password",
      "Password must be masked initially",
    );
    await password.fill("browser-test-value");
    const toggle = password.locator("..").getByRole("button");
    await toggle.click();
    check(
      (await password.getAttribute("type")) === "text",
      "Password visibility toggle did not respond",
    );
    await toggle.click();
    check(
      (await password.getAttribute("type")) === "password",
      "Password did not return to masked mode",
    );
    await password.clear();

    await page.goto(`${origin}/dashboard`);
    await page.waitForURL((url) => url.pathname === "/sign-in");
    check(
      new URL(page.url()).searchParams.get("callbackUrl") === "/dashboard",
      "Dashboard redirect lost its callback URL",
    );

    const session = await page.request.get(`${origin}/api/auth/get-session`);
    check(session.ok(), "Session endpoint failed");
    check((await session.json()) === null, "Anonymous browser has a session");

    const og = await page.request.get(`${origin}/og?title=Browser%20smoke`);
    check(og.ok(), "OG endpoint failed");
    check(
      og.headers()["content-type"]?.startsWith("image/png"),
      "OG endpoint did not return a PNG",
    );
    const png = await og.body();
    check(
      png.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
      "OG response has an invalid PNG signature",
    );
    check(errors.length === 0, `Browser runtime errors: ${errors.join("; ")}`);

    return {
      passed: true,
      checks: [
        "sign-in form",
        "password visibility toggle and hydration",
        "unauthenticated dashboard redirect",
        "anonymous session",
        "OG PNG response",
        "no browser runtime errors",
      ],
    };
  } finally {
    await page.unroute(passkeyChallenge);
    page.off("pageerror", onPageError);
    page.off("console", onConsole);
  }
}
