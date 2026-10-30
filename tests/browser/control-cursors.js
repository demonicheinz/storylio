async function controlCursors(sessionPage) {
  const page = await sessionPage.context().newPage();
  const results = [];
  const cursor = async (locator, expected) => {
    const actual = await locator.evaluate(
      (element) => getComputedStyle(element).cursor,
    );
    if (actual !== expected)
      throw new Error(
        `Expected ${expected}, received ${actual} for ${await locator.getAttribute("aria-label")}`,
      );
    results.push({ expected, actual });
  };
  try {
    await page.goto("http://127.0.0.1:3205/?kind=controls");
    await cursor(
      page.getByRole("button", { name: "Enabled button", exact: true }),
      "pointer",
    );
    for (const name of ["ARIA-disabled button", "Data-disabled button"])
      await cursor(page.getByRole("button", { name, exact: true }), "default");
    await cursor(
      page.getByRole("combobox", { name: "Native select" }),
      "pointer",
    );
    await cursor(
      page.getByRole("checkbox", { name: "Enabled checkbox" }),
      "pointer",
    );
    await cursor(
      page.getByRole("checkbox", { name: "Disabled checkbox" }),
      "not-allowed",
    );
    await cursor(
      page.getByRole("switch", { name: "Enabled switch" }),
      "pointer",
    );
    await cursor(
      page.getByRole("switch", { name: "Disabled switch" }),
      "not-allowed",
    );
    await cursor(
      page.getByRole("combobox", { name: "Select choice" }),
      "pointer",
    );
    await cursor(
      page.getByRole("combobox", { name: "Disabled select" }),
      "not-allowed",
    );
    await page.getByRole("combobox", { name: "Select choice" }).click();
    await cursor(
      page.getByRole("option", { name: "Two", exact: true }),
      "pointer",
    );
    await cursor(
      page.getByRole("option", { name: "Disabled option" }),
      "default",
    );
    await page.getByRole("option", { name: "Two", exact: true }).click();
    if ((await page.locator("output").textContent()) !== "two")
      throw new Error("Select stopped working");
    await page.getByRole("button", { name: "Open menu" }).click();
    await cursor(
      page.getByRole("menuitem", { name: "More actions" }),
      "pointer",
    );
    return results;
  } finally {
    await page.close();
  }
}
