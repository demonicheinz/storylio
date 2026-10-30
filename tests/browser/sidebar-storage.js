// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin = "http://127.0.0.1:3198";
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on("pageerror", onError);
  const results = [];
  // Let React's passive effects and native media query events finish before
  // asserting: checking immediately after a click can miss a reverted choice.
  const settle = () => page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  const state = async (expected, label) => {
    await settle();
    const actual = await page.getByTestId("state").textContent();
    if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
  };
  const resize = async (width) => {
    await page.setViewportSize({ width, height: 800 });
    await settle();
  };
  const load = async (query, width = 900) => {
    await resize(width);
    await page.goto(`${origin}/?${query}`);
    await page.getByTestId("state").waitFor();
    await settle();
  };
  const toggle = () => page.getByRole("button", { name: "Toggle Sidebar" }).click();
  try {
    for (const query of ["blockRead=1", "blockWrite=1", "blockRead=1&blockWrite=1"]) {
      await load(query);
      await state("collapsed", `${query}: tablet default`);
      await toggle();
      await state("expanded", `${query}: manual expansion survives effects`);
      await resize(1280);
      await state("expanded", `${query}: desktop after expansion`);
      await resize(900);
      await state("expanded", `${query}: tablet after expansion`);
      await toggle();
      await state("collapsed", `${query}: manual collapse`);
      await resize(1280);
      await state("collapsed", `${query}: desktop after collapse`);
      const calls = await page.evaluate(() => window.sidebarStorage);
      if (calls.reads !== 1 || calls.writes !== 2) {
        throw new Error(`${query}: initialization reran or persistence skipped: ${JSON.stringify(calls)}`);
      }
      results.push({ query, manualChoiceSurvives: true });
    }
    for (const query of ["", "preference=invalid", "preference="]) {
      await load(query, 1280);
      await state("expanded", `${query}: desktop default`);
      await resize(900);
      await state("collapsed", `${query}: tablet follows viewport`);
      await resize(1280);
      await state("expanded", `${query}: desktop follows viewport`);
      await resize(900);
      await toggle();
      await state("expanded", `${query}: manual choice`);
      await resize(1280);
      await resize(900);
      await state("expanded", `${query}: manual choice overrides viewport`);
      const saved = await page.evaluate(() => localStorage.getItem("storylio.sidebar"));
      if (saved !== "expanded") throw new Error(`${query}: manual choice not persisted`);
      await page.goto(`${origin}/?retain=1`);
      await page.getByTestId("state").waitFor();
      await state("expanded", `${query}: manual choice survives navigation`);
      await page.reload();
      await page.getByTestId("state").waitFor();
      await state("expanded", `${query}: manual choice survives reload`);
      results.push({ query, automaticUntilManual: true });
    }
    for (const preference of ["expanded", "collapsed"]) {
      const opposite = preference === "expanded" ? "collapsed" : "expanded";
      await load(`preference=${preference}`, preference === "expanded" ? 900 : 1280);
      await state(preference, `${preference}: persisted choice beats default`);
      for (const width of [900, 1280, 600, 900]) {
        await resize(width);
        await state(preference, `${preference}: persisted choice at ${width}px`);
      }
      await toggle();
      await state(opposite, `${preference}: manual override`);
      await resize(1280);
      await state(opposite, `${preference}: override survives resize`);
      results.push({ preference, persistedChoiceRespected: true });
    }
    if (errors.length) throw new Error(`Browser errors: ${errors.join("; ")}`);
    return { passed: results.length, results, browserErrors: errors };
  } finally {
    page.off("pageerror", onError);
  }
}
