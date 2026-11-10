// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page = await sessionPage.context().newPage();
  const origin = new URL(sessionPage.url()).origin;
  const assert = (value, message) => { if (!value) throw Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  let step = 'loading';
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // Same published article fixture used by article-reading.js; arbitrary posts may have no headings.
    const articlePath = '/blog/building-storylio-with-server-first-pages';
    for (const [path, name] of [['/projects/storylio', 'Project case study table of contents'], [articlePath, 'Article table of contents']]) {
      for (const width of [1440, 1200, 1024, 768, 390, 320]) {
        step = `${path} at ${width}px`;
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(new URL(path, origin).href);
        const layout = page.locator('main[data-public-page] [data-has-toc]:not([data-skeleton-reading])');
        await layout.waitFor({ state: 'visible' });
        const nav = layout.locator(`nav[aria-label="${name}"]`);
        await nav.waitFor({ state: 'attached' });
        // Wait for a client-handled action before mutating the title for the wrap probe.
        await page.waitForFunction(name => {
          const button = document.querySelector(`nav[aria-label="${name}"] button`);
          if (button?.getAttribute('aria-current') === 'true') return true;
          button?.click();
          return false;
        }, name);
        await page.evaluate(() => document.fonts.ready);
        const toggle = page.getByRole('button', { name: 'On this page', exact: true });
        if (width < 1200) { await toggle.click(); await nav.waitFor(); }
        else await nav.waitFor();
        const geometry = await layout.evaluate(root => {
          const aside = root.querySelector(':scope > aside');
          const body = [...root.children].find(child => child !== aside);
          const paragraph = body.querySelector('p');
          const buttons = [...aside.querySelectorAll('nav button')];
          return { frame: root.getBoundingClientRect().width, toc: aside.getBoundingClientRect().width, paragraph: paragraph?.getBoundingClientRect().width, heading: aside.querySelector('h2')?.textContent, helper: aside.querySelector('div > p')?.textContent, gap: parseFloat(getComputedStyle(aside.querySelector('ol')).rowGap), markers: buttons.map(button => { const marker = button.firstElementChild; const before = getComputedStyle(marker, '::before'); return { width: marker.getBoundingClientRect().width, content: before.content, height: button.getBoundingClientRect().height }; }), overflow: document.documentElement.scrollWidth > innerWidth + 1 };
        });
        assert(!geometry.overflow, `Horizontal overflow: ${JSON.stringify({ path, width, geometry })}`);
        assert(geometry.heading === 'On this page' && !geometry.helper, 'TOC heading/helper copy differs');
        assert(geometry.paragraph <= 681, 'Paragraph measure too wide');
        assert(geometry.gap >= 8 && geometry.markers.every(marker => marker.width === 20 && marker.content !== 'none' && marker.height >= 44), 'TOC markers, spacing, or target sizes failed');
        if (width >= 1200) {
          assert(Math.abs(geometry.frame - Math.min(1160, width - 48)) < 1 && Math.abs(geometry.toc - 272) < 1, `Reading frame is too narrow: ${JSON.stringify({ path, width, geometry })}`);
        }
        const title = nav.getByRole('button').first().locator('span').last();
        const originalTitle = await title.textContent();
        await title.evaluate(el => { el.textContent = 'A portfolio with its own management space and the decisions connecting the editor to public pages'; });
        const wrapped = await title.evaluate(el => {
          const label = el.getBoundingClientRect(), button = el.parentElement.getBoundingClientRect(), marker = el.previousElementSibling.getBoundingClientRect();
          return { lines: label.height / parseFloat(getComputedStyle(el).lineHeight), fits: label.right <= button.right + 1, aligned: Math.abs(label.top - marker.top) < 1 };
        });
        assert((geometry.toc > 400 || wrapped.lines >= 2) && wrapped.fits && wrapped.aligned, `Long TOC title is clipped or misaligned: ${JSON.stringify(wrapped)}`);
        await title.evaluate((el, text) => { el.textContent = text; }, originalTitle);
        const first = nav.getByRole('button').first();
        await first.click();
        await page.waitForFunction(name => document.querySelector(`nav[aria-label="${name}"] button[aria-current="true"]`), name);
        const markers = await nav.evaluate(root => [...root.querySelectorAll('button')].map(button => {
          const marker = button.firstElementChild;
          const before = getComputedStyle(marker, '::before');
          return { active: button.getAttribute('aria-current') === 'true', width: parseFloat(before.width), height: parseFloat(before.height) };
        }));
        assert(markers.some(marker => marker.active && marker.width === 20 && marker.height === 1), 'Active marker is not the original longer horizontal line');
        assert(markers.filter(marker => !marker.active).every(marker => marker.width === 12 && marker.height === 1), 'Inactive markers are not horizontal lines');
        if (width < 1200) {
          await first.focus(); await page.keyboard.press('Escape');
          assert(await toggle.getAttribute('aria-expanded') === 'false' && await toggle.evaluate(el => el === document.activeElement), 'Mobile TOC escape/focus failed');
        }
        results.push({ path, width, geometry, wrappedTitle: wrapped, activeMarker: true, inactiveMarkers: true });
      }
    }
    assert(!errors.length, errors.join('\n'));
    return { passed: true, results, errors };
  } catch (error) {
    error.message += `\nStage: ${step}\n${JSON.stringify(await page.evaluate(() => ({url:location.href, tocCount:document.querySelectorAll('nav[aria-label$="table of contents"]').length, title:document.title})))}`;
    throw error;
  } finally { await page.close(); }
}
