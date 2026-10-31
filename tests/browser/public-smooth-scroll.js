// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin = new URL(sessionPage.url()).origin;
  const page = await sessionPage.context().newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const active = () => page.waitForFunction(() => document.documentElement.classList.contains('lenis'));
  let stage = 'public routes';
  const results = [];
  try {
    await page.setViewportSize({ width:1440, height:1000 });
    await page.emulateMedia({ reducedMotion:'no-preference' });
    for (const path of ['/about','/projects','/blog','/gallery','/projects/storylio']) {
      await page.goto(origin + path); await page.locator('main h1').waitFor(); await active();
      results.push({ path, lenis:true });
    }
    stage = 'detail anchor and lightbox';
    const toc = page.getByRole('navigation', { name:'Project case study table of contents' });
    await toc.getByRole('button').first().focus(); await page.keyboard.press('Enter');
    stage = 'toc focus';
    await page.waitForFunction(() => document.activeElement.id === decodeURIComponent(location.hash.slice(1)));
    stage = 'toc offset';
    await page.waitForFunction(() => Math.abs(document.activeElement.getBoundingClientRect().top - 112) < 3);
    const shot = page.getByRole('button', { name:/^Open / }).first();
    stage = 'project lightbox open';
    await shot.scrollIntoViewIfNeeded();
    await page.mouse.move(100,800); await page.mouse.wheel(0,150);
    await shot.evaluate(el => el.click());
    await page.waitForFunction(() => document.documentElement.classList.contains('lenis-stopped'));
    const lockedY = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0,700); await page.waitForTimeout(400);
    assert(Math.abs(await page.evaluate(() => scrollY) - lockedY) < 2, 'Lightbox background drifts');
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'));
    await page.waitForTimeout(200);
    assert(Math.abs(await page.evaluate(() => scrollY) - lockedY) < 2, 'Lightbox resumes stale inertia');
    stage = 'article';
    await page.goto(`${origin}/blog`);
    const article = await page.getByRole('link', { name:'Read article', exact:true }).first().getAttribute('href');
    await page.goto(origin + article); await active();
    results.push({ path:article, lenis:true });
    stage = 'gallery lightbox';
    await page.goto(`${origin}/gallery`); await active();
    await page.locator('[data-gallery-photo]').first().click();
    await page.waitForFunction(() => document.documentElement.classList.contains('lenis-stopped'));
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-stopped'));
    stage = 'tablet sidebar and history';
    await page.setViewportSize({ width:1024, height:600 });
    await page.goto(`${origin}/about?lang=en`); await active();
    await page.locator('main h1').waitFor();
    await page.evaluate(() => scrollTo({ top:0, behavior:'instant' }));
    await page.waitForFunction(() => scrollY < 2);
    const side = page.locator('main > div > aside');
    const box = await side.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + 40); await page.mouse.wheel(0,200);
    await page.waitForTimeout(300);
    assert(await side.evaluate(el => el.scrollTop > 0), 'Short tablet sidebar cannot scroll natively');
    assert(await page.evaluate(() => scrollY) < 2, `Sidebar wheel moved the page: ${await page.evaluate(() => scrollY)}`);
    const anchor = page.getByRole('navigation', { name:'On this page' }).getByRole('link', { name:'Work Experience', exact:true });
    await anchor.focus(); await page.keyboard.press('Enter');
    stage = 'tablet anchor offset';
    await page.waitForFunction(() => Math.abs(document.getElementById('work-experience').getBoundingClientRect().top - 112) < 3);
    stage = 'history restoration';
    const projects = page.getByRole('navigation', { name:'Main navigation' }).getByRole('link', { name:'Projects', exact:true });
    await projects.evaluate(el => el.focus({ preventScroll:true }));
    await page.waitForFunction(() => !document.documentElement.classList.contains('lenis-scrolling'));
    const before = await page.evaluate(() => scrollY);
    await projects.press('Enter');
    await page.waitForURL(`${origin}/projects`); await active();
    await page.goBack(); await active();
    await page.waitForFunction(y => Math.abs(scrollY - y) < 3, before).catch(error => { error.message += `\nExpected scroll: ${before}`; throw error; });
    await page.goForward(); await page.waitForURL(`${origin}/projects`); await active();
    stage = 'excluded routes';
    for (const path of ['/sign-in','/dashboard','/preview/projects/storylio']) {
      await page.goto(origin + path); await page.waitForTimeout(500);
      assert(await page.locator('html.lenis').count() === 0, `Lenis leaked to ${path}`);
      results.push({ path, lenis:false, destination:new URL(page.url()).pathname });
    }
    assert(errors.length === 0, errors.join('\n'));
    return { results, tocFocus:true, lightbox:true, nativeSidebar:true, history:true, errors };
  } catch(error) {
    error.message += `\nStage: ${stage}\n${JSON.stringify(await page.evaluate(() => ({
      y:scrollY, focused:document.hasFocus(), hash:location.hash,
      targetTop:document.getElementById(decodeURIComponent(location.hash.slice(1)))?.getBoundingClientRect().top,
      classes:document.documentElement.className,
    })))}`;
    throw error;
  }
  finally { await page.close(); }
}
