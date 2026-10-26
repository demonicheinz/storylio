// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin = new URL(sessionPage.url()).origin;
  const page = await sessionPage.context().newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const results = [];
  const type = element => {
    const style = getComputedStyle(element);
    return { size:parseFloat(style.fontSize), weight:style.fontWeight, family:style.fontFamily, leading:parseFloat(style.lineHeight), tracking:style.letterSpacing, color:style.color };
  };
  const read = async locator => locator.evaluate(type);
  const sameType = (actual, expected, label) => assert(JSON.stringify(actual) === JSON.stringify(expected), label + ': ' + JSON.stringify({ actual, expected }));
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    for (const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});
      await page.goto(origin);
      await page.locator('#projects-title').waitFor();
      await page.evaluate(() => document.fonts.ready);
      const baseline = {
        page:await read(page.locator('main h1')),
        section:await read(page.locator('#projects-title')),
        item:await read(page.locator('[data-home-grid="projects"] h3').first()),
      };
      assert(baseline.page.size === (width < 768 ? 40 : 56), 'Home page scale changed');
      assert(baseline.section.size === (width < 768 ? 36 : 48), 'Home section scale changed');
      assert(baseline.item.size === 22 && baseline.item.weight === '500', 'Home item scale changed');
      sameType(await read(page.locator('#stack-title')), baseline.item, 'Compact stack heading');

      for (const path of ['/about?lang=en','/about?lang=id','/projects','/blog','/gallery','/projects/storylio','/blog/building-storylio-with-server-first-pages']) {
        await page.goto(origin + path);
        await page.locator('main h1').waitFor();
        if (path.startsWith('/blog/')) await page.getByRole('region',{name:'Article content'}).waitFor();
        sameType(await read(page.locator('main h1')), baseline.page, path + ' H1');
        const sectionHeadings = page.locator('main [data-section-heading]');
        for (const heading of await sectionHeadings.all()) {
          sameType(await read(heading), baseline.section, path + ' section');
          const decoration = await heading.evaluate(el => ({
            prefixes:el.querySelectorAll('[data-heading-prefix]').length,
            underline:getComputedStyle(el).textDecorationLine,
            before:getComputedStyle(el,'::before').content,
            after:getComputedStyle(el,'::after').content,
            border:getComputedStyle(el).borderBottomWidth,
            lineWidth:parseFloat(getComputedStyle(el,'::after').width),
            width:el.getBoundingClientRect().width,
            lineHeight:getComputedStyle(el,'::after').height,
            gradient:getComputedStyle(el,'::after').backgroundImage,
          }));
          assert(!decoration.prefixes && decoration.underline === 'none' && decoration.before === 'none' && decoration.border === '0px', 'Unexpected heading decoration: ' + path + JSON.stringify(decoration));
          // About is a scoped divider experiment; other routes remain plain.
          if (path.startsWith('/about')) assert(decoration.after !== 'none' && decoration.lineHeight === '1px' && Math.abs(decoration.lineWidth - decoration.width) < 1 && decoration.gradient.startsWith('linear-gradient'), 'Invalid About divider: ' + JSON.stringify(decoration));
          else assert(decoration.after === 'none', 'About divider leaked to ' + path);
        }
        const items = page.locator('main h3');
        if (path === '/projects' || path === '/blog') {
          // Featured cards have their own documented role; regular cards are 22px.
          for (const card of await page.locator('[data-project-grid] h2, [data-post-grid] h2').all()) sameType(await read(card), baseline.item, path + ' card');
          const featuredCards = page.locator('main article').filter({has:page.locator('h2')}).filter({hasNot:page.locator('[data-project-grid], [data-post-grid]')});
          for (const card of await featuredCards.all()) {
            if (await card.evaluate(el => !!el.closest('[data-project-grid], [data-post-grid]'))) continue;
            const heading = card.locator('h2').first();
            assert((await read(heading)).size === (width < 1024 ? 28 : 40), 'Featured title scale: ' + path);
          }
        } else {
          for (const item of await items.all()) sameType(await read(item), baseline.item, path + ' item');
        }
        const fits = await page.locator('main').evaluate(el => document.documentElement.scrollWidth <= innerWidth + 1 && [...el.querySelectorAll('h1,h2,h3')].every(heading => heading.scrollWidth <= heading.clientWidth + 1));
        assert(fits, 'Typography overflow: ' + path + ' at ' + width);
        if (path === '/about?lang=en' && [1440,390].includes(width)) await page.screenshot({path:'.playwright-cli/public-typography-about-' + width + '.png',fullPage:true});
        results.push({path,width,sections:await sectionHeadings.count()});
      }
    }
    await page.setViewportSize({width:390,height:900});
    await page.goto(origin + '/about');
    await page.locator('main h1').waitFor();
    await page.evaluate(() => document.documentElement.style.fontSize = '20px');
    assert((await read(page.locator('main h1'))).size === 50, 'Page title ignores root font size');
    assert((await read(page.locator('main [data-section-heading]').first())).size === 45, 'Section title ignores root font size');
    assert((await read(page.locator('main h3').first())).size === 27.5, 'Item title ignores root font size');
    await page.evaluate(() => document.documentElement.style.removeProperty('font-size'));
    await page.goto(origin + '/blog/building-storylio-with-server-first-pages');
    const copy = page.locator('main [data-section-heading]').first().getByRole('button',{name:'Copy heading link'});
    await copy.focus(); await page.keyboard.press('Enter');
    await page.getByText('Heading link copied.',{exact:true}).waitFor();
    assert(!errors.length,errors.join('\n'));
    return {results,rootFontScaling:true,copyHeading:true,errors};
  } finally { await page.close(); }
}
