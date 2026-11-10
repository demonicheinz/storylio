// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page = await sessionPage.context().newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (value, message) => { if (!value) throw Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  try {
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`${origin}/projects/storylio`);
      const carousel = page.getByRole('region', { name: 'Project screenshots', exact: true });
      await carousel.waitFor();
      await carousel.scrollIntoViewIfNeeded();
      const initial = await carousel.evaluate(root => [...root.querySelectorAll('[data-depth]')].map(card => ({
        alt: card.querySelector('img')?.alt,
        hidden: card.hidden,
        exposed: card.getAttribute('aria-hidden') === 'false',
      })));
      const total = initial.length;
      assert(total >= 2 && initial.every(card => card.alt?.trim()), 'A screenshot lost its alt text');
      assert(initial.filter(card => card.exposed).length === 1, 'Only the active screenshot should be announced');
      assert(initial.filter(card => !card.hidden).length === Math.min(total, 3), 'More than three preview layers are visible');
      const seen = [];
      for (let index = 0; index < total; index++) {
        const state = await carousel.evaluate(root => {
          const active = root.querySelector('[data-depth="0"] img');
          const caption = root.querySelector('[id$="-caption"]');
          return { alt: active?.alt, describedBy: active?.getAttribute('aria-describedby'), captionId: caption?.id, caption: caption?.textContent.trim(), overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        // This uses the existing Storylio browser fixture's saved metadata.
        assert(state.alt === `Storylio screenshot ${index + 1}`, `Wrong saved alt: ${JSON.stringify(state)}`);
        assert(state.caption === `screenshot ${index + 1}`, `Wrong saved caption: ${JSON.stringify(state)}`);
        assert(state.describedBy === state.captionId && !state.overflow, 'Caption association or responsive layout failed');
        seen.push(state);
        if (index < total - 1) {
          await carousel.getByRole('button', { name: 'Next screenshot', exact: true }).click();
          await page.waitForFunction(index => document.querySelector('[data-depth-carousel]').dataset.currentIndex === String(index), index + 1);
        }
      }
      await carousel.getByRole('button', { name: `Open Storylio screenshot ${total}`, exact: true }).click();
      const lightbox = page.getByRole('dialog', { name: 'Lightbox', exact: true });
      await lightbox.waitFor();
      assert(await lightbox.getByText(`screenshot ${total}`, { exact: true }).isVisible(), 'Lightbox caption lost');
      await page.keyboard.press('Escape');
      await lightbox.waitFor({ state: 'hidden' });
      await carousel.getByRole('button', { name: 'Next screenshot', exact: true }).focus();
      await page.keyboard.press('Home');
      await page.waitForFunction(() => document.querySelector('[data-depth-carousel]').dataset.currentIndex === '0');
      await carousel.screenshot({ path: `task/screenshot-metadata-fix/carousel-${width}.png` });
      results.push({ width, screenshots: total, metadata: seen, lightbox: true, keyboard: true });
    }
    assert(!errors.length, errors.join('\n'));
    return { passed: true, results, errors };
  } finally { await page.close(); }
}
