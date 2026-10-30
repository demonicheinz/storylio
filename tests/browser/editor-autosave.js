// Run against tests/fixtures/editor-autosave/serve.mjs using an isolated CLI session.
async function editorAutosave(sessionPage) {
  const origin = new URL(sessionPage.url()).origin;
  const context = await sessionPage.context().browser().newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const assert = (value, message) => {
    if (!value) throw new Error(message);
  };
  const state = () =>
    page.evaluate(() => ({
      calls: window.editorFixture.calls,
      stored: window.editorFixture.stored,
      pending: window.editorFixture.pending.length,
    }));
  const settle = (outcome = "success") =>
    page.evaluate((outcome) => window.editorFixture.resolve(outcome), outcome);
  const waitCalls = (count) =>
    page.waitForFunction(
      (count) => window.editorFixture.calls.length === count,
      count,
    );
  const open = async (kind, status = "published", mode = "edit") => {
    await page.goto(`${origin}/?kind=${kind}&status=${status}&mode=${mode}`);
    await page
      .getByRole("heading", {
        name:
          mode === "create"
            ? `New ${kind === "post" ? "Post" : "Project"}`
            : `Edit ${kind === "post" ? "Post" : "Project"}`,
      })
      .waitFor();
  };
  const results = [];
  try {
    await page.clock.install();
    const nativeSubmitFailures = [];
    for (const kind of ["post", "project"]) {
      for (const [status, mode, content] of [
        ["draft", "create", "Ready content."],
        ["draft", "create", ""],
        ["draft", "edit", ""],
        ["published", "edit", "Ready content."],
      ]) {
        await open(kind, status, mode);
        await page.getByLabel("Title", { exact: true }).fill("Native submit");
        await page.getByLabel("Content", { exact: true }).fill(content);
        await page.locator("form").evaluate((form) => form.requestSubmit());
        await waitCalls(1);
        const expected = status === "published" ? "publish" : "draft";
        if ((await state()).calls[0].action !== expected) {
          nativeSubmitFailures.push(
            `${kind} ${mode} ${status}: expected ${expected}`,
          );
        }
        await settle();
        await page
          .getByRole("status")
          .filter({ hasText: "All changes saved" })
          .waitFor();
        if ((await state()).stored.status !== status) {
          nativeSubmitFailures.push(
            `${kind} ${mode}: native submit changed status`,
          );
        }
        if (status === "draft" && (await state()).stored.status === "draft") {
          await page
            .getByLabel("Content", { exact: true })
            .fill("Ready content.");
          await page
            .getByRole("button", { name: "Publish", exact: true })
            .click();
          await waitCalls(2);
          assert(
            (await state()).calls[1].action === "publish",
            `${kind} ${mode}: explicit publish action`,
          );
          await settle();
          await page
            .getByRole("button", { name: "Save changes", exact: true })
            .waitFor();
          assert(
            (await state()).stored.status === "published",
            `${kind} ${mode}: explicit publish still works`,
          );
        }
      }
    }
    assert(nativeSubmitFailures.length === 0, nativeSubmitFailures.join("; "));
    for (const kind of ["post", "project"]) {
      await open(kind);
      await page.getByLabel("Title", { exact: true }).fill("First save");
      await page.clock.fastForward(30_000);
      await waitCalls(1);
      assert(
        (await state()).calls[0].action === "autosave",
        `${kind}: timer uses preserving action`,
      );
      await page
        .getByLabel("Title", { exact: true })
        .fill("Typed during autosave");
      await page
        .getByLabel("Content", { exact: true })
        .fill("New content typed during autosave.");
      await page.clock.fastForward(60_000);
      assert(
        (await state()).calls.length === 1,
        `${kind}: no overlapping autosaves`,
      );
      await settle();
      await page
        .getByRole("status")
        .filter({ hasText: "Unsaved changes" })
        .waitFor();
      assert(
        (await page.getByLabel("Title", { exact: true }).inputValue()) ===
          "Typed during autosave",
        `${kind}: title survives completion`,
      );
      assert(
        (await page.getByLabel("Content", { exact: true }).inputValue()) ===
          "New content typed during autosave.",
        `${kind}: body survives completion`,
      );
      await page.clock.fastForward(30_000);
      await waitCalls(2);
      assert(
        (await state()).calls[1].input.content ===
          "New content typed during autosave.",
        `${kind}: repeated autosave sends retained edits`,
      );
      await page
        .getByLabel("Title", { exact: true })
        .fill("Latest manual save");
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .click();
      assert(
        (await state()).calls.length === 2,
        `${kind}: manual save waits for autosave`,
      );
      await settle();
      await waitCalls(3);
      assert(
        (await state()).calls[2].input.title === "Latest manual save",
        `${kind}: manual save captures latest values`,
      );
      assert(
        (await state()).calls[2].action === "publish",
        `${kind}: manual published edits stay live`,
      );
      await settle();
      await page
        .getByRole("status")
        .filter({ hasText: "All changes saved" })
        .waitFor();
      await page.clock.fastForward(60_000);
      assert(
        (await state()).calls.length === 3,
        `${kind}: clean forms do not autosave`,
      );
      assert(
        (await state()).stored.status === "published",
        `${kind}: publication remains unchanged`,
      );

      for (const outcome of ["failure", "throw"]) {
        await page
          .getByLabel("Title", { exact: true })
          .fill(`Retain after ${outcome}`);
        await page.clock.fastForward(30_000);
        await waitCalls(outcome === "failure" ? 4 : 6);
        await settle(outcome);
        await page
          .getByRole("status")
          .filter({ hasText: "Save failed" })
          .waitFor();
        assert(
          (await page.getByLabel("Title", { exact: true }).inputValue()) ===
            `Retain after ${outcome}`,
          `${kind}: ${outcome} retains input`,
        );
        await page
          .getByRole("button", { name: "Save changes", exact: true })
          .click();
        await waitCalls(outcome === "failure" ? 5 : 7);
        await settle();
        await page
          .getByRole("status")
          .filter({ hasText: "All changes saved" })
          .waitFor();
      }
      assert(
        (await page.locator('[name="status"]').count()) === 0,
        `${kind}: no editable status dropdown`,
      );
      await page.getByRole("button", { name: "Publishing options" }).click();

      await page.getByRole("menuitem", { name: "Move to draft…" }).click();
      await page
        .getByRole("alertdialog")
        .last()
        .locator('[data-slot="alert-dialog-cancel"]')
        .click();
      await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
      assert(
        (await state()).calls.length === 7,
        `${kind}: cancelling move to draft does not save`,
      );
      await page.getByLabel("Content", { exact: true }).fill("");
      await page.getByRole("button", { name: "Publishing options" }).click();

      await page.getByRole("menuitem", { name: "Move to draft…" }).click();
      await page
        .getByRole("alertdialog")
        .last()
        .locator('[data-slot="alert-dialog-action"]')
        .click();
      await page.getByRole("alertdialog").last().waitFor({ state: "hidden" });
      await waitCalls(8);
      await settle();
      await page
        .getByRole("button", { name: "Save draft", exact: true })
        .waitFor();
      assert(
        (await state()).stored.status === "draft",
        `${kind}: explicit move to draft works`,
      );

      // Publishing a draft while its autosave is delayed must finish published.
      await page.getByLabel("Content", { exact: true }).fill("Ready content.");
      await page.getByLabel("Title", { exact: true }).fill("Ready to publish");
      await page.clock.fastForward(30_000);
      await waitCalls(9);
      await page.getByRole("button", { name: "Publish", exact: true }).click();
      assert(
        (await state()).calls.length === 9,
        `${kind}: publishing waits for draft autosave`,
      );
      await settle();
      await waitCalls(10);
      await settle();
      await page
        .getByRole("button", { name: "Save changes", exact: true })
        .waitFor();
      assert(
        (await state()).stored.status === "published",
        `${kind}: delayed draft autosave cannot win over publish`,
      );

      for (const [width, height] of [
        [1440, 1000],
        [390, 844],
      ]) {
        await page.setViewportSize({ width, height });
        await page.evaluate(() => window.scrollTo(0, 450));
        const geometry = await page.evaluate(() => {
          const header = document.querySelector("form > div");
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            top: header.getBoundingClientRect().top,
            position: getComputedStyle(header).position,
          };
        });
        assert(!geometry.overflow, `${kind}: no overflow at ${width}`);
        assert(
          geometry.position === "sticky" && Math.abs(geometry.top - 56) < 2,
          `${kind}: sticky save header at ${width}`,
        );
        await page.screenshot({
          path: `.playwright-cli/editor-autosave-${kind}-${width}.png`,
          fullPage: false,
        });
      }
      await open(kind, "draft", "create");
      assert(
        (await page
          .getByRole("button", { name: "Publish", exact: true })
          .count()) === 1,
        `${kind}: one primary publish action on create`,
      );
      assert(
        (await page
          .getByRole("button", { name: "Save draft", exact: true })
          .count()) === 1,
        `${kind}: create supports saving a private draft`,
      );
      results.push(
        `${kind}: native submit preserves create/edit drafts (including empty content) and published edits; explicit publish, retained edits, repeated autosave, serialized manual save/publish, failure recovery, confirmed unpublish, responsive sticky header`,
      );
    }
    assert(errors.length === 0, `Browser errors: ${errors.join("; ")}`);
    console.log(JSON.stringify({ passed: results }, null, 2));
  } finally {
    await context.close();
  }
}
