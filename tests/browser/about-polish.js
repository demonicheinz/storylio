// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin = new URL(sessionPage.url()).origin;
  const page = await sessionPage.context().newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const [width, height] of [[1440,1000],[1024,768],[768,600],[390,844],[320,740]]) {
      await page.setViewportSize({ width, height });
      await page.goto(origin + '/about?lang=en');
      await page.locator('main h1').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const state = await page.evaluate(() => {
        const main = document.querySelector('main');
        const side = main.querySelector(':scope > div > aside');
        const avatar = side.querySelector('[data-slot="avatar"]');
        const h1 = main.querySelector('h1');
        const social = h1.parentElement.querySelector('a').parentElement;
        const language = main.querySelector('nav[aria-label="Language"]');
        return {
          width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1,
          sidebar: getComputedStyle(side).position, avatar: avatar.getBoundingClientRect().width,
          avatarCenter: avatar.getBoundingClientRect().left + avatar.getBoundingClientRect().width / 2,
          titleAlign: getComputedStyle(h1).textAlign,
          socials: getComputedStyle(social).justifyContent,
          introAlign: getComputedStyle(language.nextElementSibling).textAlign,
          languageLeft: language.getBoundingClientRect().left,
          contentLeft: h1.getBoundingClientRect().left,
          timelines: [...main.querySelectorAll('[class*="timelineItem"]')].map(item => {
            const dot = getComputedStyle(item, '::before');
            const line = getComputedStyle(item, '::after');
            return { last: !item.nextElementSibling, dotTop: parseFloat(dot.top), dotSize: parseFloat(dot.height), lineTop: parseFloat(line.top), lineBottom: parseFloat(line.bottom), lineContent: line.content, dotCenter: parseFloat(dot.left) + parseFloat(dot.width)/2, lineCenter: parseFloat(line.left) + parseFloat(line.width)/2 };
          }),
        };
      });
      assert(!state.overflow, 'Horizontal overflow: ' + JSON.stringify(state));
      for (const item of state.timelines) {
        if (item.last) assert(item.lineContent === 'none', 'Timeline extends beyond its last dot');
        else assert(item.lineTop === item.dotTop + item.dotSize && item.lineBottom === -item.dotTop && item.dotCenter === item.lineCenter, 'Timeline connector is misaligned: ' + JSON.stringify(item));
      }
      assert(state.avatar === (width < 768 ? 96 : 144), 'Wrong avatar size: ' + JSON.stringify(state));
      if (width < 768) {
        assert(Math.abs(state.avatarCenter - width/2) < 2, 'Avatar is not centered');
        assert(state.titleAlign === 'center' && state.socials === 'center', 'Identity is not centered');
        assert(state.introAlign === 'left' || state.introAlign === 'start', 'Intro should stay left aligned');
        assert(Math.abs(state.languageLeft - state.contentLeft) < 2, 'Language controls should stay left aligned');
      } else {
        assert(state.sidebar === 'sticky', 'Sidebar must remain sticky on tablet');
        await page.locator('#working-principles').evaluate(el => el.scrollIntoView({ behavior:'instant' }));
        const sideTop = await page.locator('main > div > aside').evaluate(el => el.getBoundingClientRect().top);
        assert(Math.abs(sideTop - 112) < 2, 'Sticky offset is wrong: ' + sideTop);
        if (height === 600) {
          const nativeScroll = await page.locator('main > div > aside').evaluate(el => {
            el.scrollTop = el.scrollHeight;
            return { top:el.scrollTop, scrollable:el.scrollHeight > el.clientHeight };
          });
          assert(!nativeScroll.scrollable || nativeScroll.top > 0, 'Short tablet sidebar cannot scroll');
        }
      }
      await page.evaluate(() => scrollTo({ top:0, behavior:'instant' }));
      if (width === 1440 || width === 390) {
        await page.screenshot({ path:'.playwright-cli/about-polish-' + width + '.png', fullPage:true });
      }
      results.push(state);
    }
    await page.setViewportSize({ width:1024, height:768 });
    await page.goto(origin + '/about?lang=en');
    const link = page.getByRole('navigation', { name:'On this page' }).getByRole('link', { name:'Work Experience', exact:true });
    await link.focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.activeElement?.id === 'work-experience');
    await page.waitForFunction(() => {
      const active = document.querySelector('nav[aria-label="On this page"] a[aria-current]');
      return active?.getAttribute('href') === '#work-experience' && getComputedStyle(active, '::before').width === '24px' && getComputedStyle(active).transform === 'none';
    });
    assert(new URL(page.url()).searchParams.get('lang') === 'en', 'Anchor discarded language query');
    for (const language of ['en', 'id']) {
      await page.setViewportSize({ width:768, height:600 });
      await page.goto(origin + '/about?lang=' + language);
      const nav = page.locator('main aside nav');
      for (const target of await nav.locator('a').all()) {
        const href = await target.getAttribute('href');
        await target.click();
        await page.waitForFunction(id => document.activeElement?.id === id.slice(1), href);
        await page.waitForFunction(id => document.querySelector('main aside nav a[aria-current]')?.getAttribute('href') === id, href);
        const overflow = await nav.evaluate(el => {
          const sidebar = el.closest('aside');
          const right = el.getBoundingClientRect().right;
          return sidebar.scrollWidth > sidebar.clientWidth + 1 || [...el.querySelectorAll('a')].some(link => link.getBoundingClientRect().right > right + 1) || document.documentElement.scrollWidth > innerWidth + 1;
        });
        assert(!overflow, 'TOC overflow at tablet width: ' + language + href);
      }
    }
    assert(errors.length === 0, errors.join('\n'));
    return { results, keyboardAnchor:true, errors };
  } finally { await page.close(); }
}
