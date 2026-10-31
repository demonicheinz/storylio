// biome-ignore lint/correctness/noUnusedVariables: Playwright CLI evaluates and invokes this function as its entry point.
async function mdxSource(sessionPage) {
  const page = await sessionPage.context().newPage();
  try {
    await page.goto(new URL(sessionPage.url()).origin);
    await page
      .getByRole("textbox", { name: "How I Work (English)", exact: true })
      .waitFor();
    const editor = page.locator('[data-slot="dashboard-mdx-editor"]').first();
    if (
      (await editor
        .getByRole("radio", { name: "Source mode", exact: true })
        .count()) !== 1
    )
      throw new Error("The editor has no Markdown source entry point");
    await editor
      .getByRole("radio", { name: "Source mode", exact: true })
      .click();
    const source = editor.locator(".cm-sourceView .cm-content");
    const markdown = await page.request
      .get(`${new URL(page.url()).origin}/markdown-smoke.md`)
      .then((response) => response.text());
    await source.fill(markdown);
    await editor.getByRole("radio", { name: "Rich text", exact: true }).click();
    await editor
      .locator(".mdxeditor-rich-text-editor")
      .waitFor({ state: "visible" });
    if (
      !(await editor
        .getByRole("heading", { name: "Heading 2", exact: true })
        .isVisible())
    )
      throw new Error("Markdown headings remained plain text");
    if ((await editor.locator("table").count()) !== 1)
      throw new Error("Table did not import");
    if ((await editor.locator("mark").count()) < 1)
      throw new Error("Highlight did not import");
    const paragraph = editor
      .locator(".mdxeditor-root-contenteditable p")
      .filter({ hasText: "Kurung sebagai teks:" })
      .first();
    await paragraph.click();
    await page.keyboard.press("End");
    await page.keyboard.type(" Edited.");
    await page
      .getByRole("button", { name: "Save Content", exact: true })
      .click();
    await page
      .getByRole("status")
      .filter({ hasText: "All changes saved" })
      .waitFor();
    const saved = await page.evaluate(() => window.aboutSaved.howIWorkEn);
    // biome-ignore lint/suspicious/noTemplateCurlyInString: The editor fixture must preserve JavaScript interpolation as literal Markdown.
    if (!saved.includes("${nama}") || !saved.includes("```js"))
      throw new Error("Code fences or braces were lost on save");
    if (!saved.includes("\\{contoh}"))
      throw new Error("Rich-text export did not escape literal braces");
    await editor
      .getByRole("radio", { name: "Source mode", exact: true })
      .click();
    await source.fill("function broken() {");
    await page
      .getByRole("button", { name: "Save Content", exact: true })
      .click();
    await editor
      .getByRole("alert")
      .filter({ hasText: "closing brace" })
      .waitFor();
    if (!(await source.textContent()).includes("function broken() {"))
      throw new Error("Saving invalid source erased its input");
    if (
      (await page.getByText(/Unexpected end of file in expression/).count()) !==
      1
    )
      throw new Error("The complete validation error is duplicated");
    await source.fill("<broken");
    await editor.getByRole("radio", { name: "Rich text", exact: true }).click();
    await editor.getByRole("alert").waitFor();
    await editor
      .getByRole("radio", { name: "Source mode", exact: true })
      .click();
    if (!(await source.textContent()).includes("<broken"))
      throw new Error(
        "Invalid input was lost instead of remaining recoverable",
      );
    await source.fill(markdown);
    await editor.getByRole("radio", { name: "Rich text", exact: true }).click();
    await editor
      .locator(".mdxeditor-rich-text-editor")
      .waitFor({ state: "visible" });
    if ((await editor.getByRole("alert").count()) !== 0)
      throw new Error("Parse error did not clear after recovery");
    await page.setViewportSize({ width: 390, height: 844 });
    await editor.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "task/dashboard-about-review/mdx-source-mobile.png",
    });
    return {
      passed: true,
      checks: [
        "source import",
        "formatted headings/table/highlight",
        "code fences on save",
        "invalid source recovery",
      ],
    };
  } finally {
    await page.close();
  }
}
