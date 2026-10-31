// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin = new URL(sessionPage.url()).origin;
  const page = await sessionPage.context().newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const results=[];
  try{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:1000});
      await page.goto(`${origin}/projects`);
      await page.locator('[data-project-card]').first().waitFor();
      await page.evaluate(()=>document.fonts.ready);
      // Exercise a client control before replacing DOM text for the fixture.
      await page.getByRole('button',{name:'Filter stack',exact:true}).click();
      await page.getByRole('combobox',{name:'Search technologies'}).waitFor();
      await page.keyboard.press('Escape');
      const state=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll('[data-project-card]')];
        const title='VeryLongProjectNameWithoutSpaces'.repeat(18);
        const description='Full project description explaining implementation and design decisions. '.repeat(24);
        const first=cards[0];first.querySelector('h2').textContent=title;first.querySelector('p').textContent=description;
        if(cards[1]){cards[1].querySelector('h2').textContent='Short title';cards[1].querySelector('p').textContent='Short description';}
        if(cards[2])cards[2].querySelector('p').textContent='';
        const measure=el=>({height:el.getBoundingClientRect().height,leading:parseFloat(getComputedStyle(el).lineHeight),clamp:getComputedStyle(el).getPropertyValue('-webkit-line-clamp'),scroll:el.scrollHeight,visible:el.clientHeight});
        return{
          width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,
          titleIntact:first.querySelector('h2').textContent===title,
          descriptionIntact:first.querySelector('p').textContent===description,
          cards:cards.map(card=>({top:card.getBoundingClientRect().top,title:measure(card.querySelector('h2')),description:measure(card.querySelector('p')),gap:card.querySelector('p').getBoundingClientRect().top-card.querySelector('h2').getBoundingClientRect().bottom,tags:card.querySelectorAll('ul[aria-label="Technology stack"] li').length,tagTop:card.querySelector('ul').getBoundingClientRect().top,actionTop:card.querySelector('[data-flow-button]').getBoundingClientRect().top})),
        };
      });
      assert(!state.overflow&&state.titleIntact&&state.descriptionIntact,`Content or layout changed: ${width}`);
      for(const card of state.cards){
        assert(card.title.clamp==='2'&&card.title.height<=card.title.leading*2+1,`Title exceeds two lines: ${JSON.stringify(card)}`);
        assert(Math.abs(card.gap-16)<1,`Description must directly follow title: ${JSON.stringify(card)}`);
        assert(card.description.clamp==='3'&&Math.abs(card.description.height-card.description.leading*3)<1,`Description must reserve/clamp three lines: ${JSON.stringify(card)}`);
        assert(card.tags<=4,'Too many stack tags');
      }
      assert(state.cards[0].title.scroll>state.cards[0].title.visible&&state.cards[0].description.scroll>state.cards[0].description.visible,'Long content was not clipped');
      if(state.cards[1])assert(Math.abs(state.cards[1].title.height-state.cards[1].title.leading)<1,'Short title reserves an empty second line');
      for(const card of state.cards){
        const row=state.cards.filter(other=>Math.abs(other.top-card.top)<1);
        assert(row.every(other=>Math.abs(other.tagTop-card.tagTop)<1&&Math.abs(other.actionTop-card.actionTop)<1),'Card footers do not align within their row');
      }
      if(width===1440||width===390)await page.screenshot({path:`.playwright-cli/project-card-content-long-${width}.png`,fullPage:true});
      results.push({width,cards:state.cards.length,titleLines:2,descriptionLines:3,overflow:state.overflow});
    }
    await page.goto(`${origin}/projects?tech=Next.js`);
    await page.locator('[data-project-card]').first().waitFor();
    await page.getByRole('button',{name:'Filter stack',exact:true}).click();
    await page.getByRole('combobox',{name:'Search technologies'}).fill('Tailwind CSS');
    await page.getByRole('option',{name:'Tailwind CSS',exact:true}).click();
    await page.waitForURL(url=>url.searchParams.getAll('tech').includes('Tailwind CSS'));
    await page.waitForFunction(()=>!document.querySelector('[role="status"][aria-busy="true"]'));
    assert((await page.locator('[data-project-card] h2').allTextContents()).includes('Storylio'),'Hidden card technology no longer matches full stack');
    assert(!errors.length,errors.join('\n'));
    return {results,longTextIntact:true,naturalTitleHeight:true,descriptionGap:16,rowFootersAligned:true,maxThreeTagsPlusCount:true,hiddenTechnologiesStillFilter:true,errors};
  }finally{await page.close();}
}
