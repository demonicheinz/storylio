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
        };
      });
      assert(!state.overflow, 'Horizontal overflow: ' + JSON.stringify(state));
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
    assert(new URL(page.url()).searchParams.get('lang') === 'en', 'Anchor discarded language query');
    assert(errors.length === 0, errors.join('\n'));
    return { results, keyboardAnchor:true, errors };
  } finally { await page.close(); }
}
