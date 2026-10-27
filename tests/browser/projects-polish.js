// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const page=await sessionPage.context().newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(/Blocked aria-hidden|focus must not be hidden/i.test(message.text()))errors.push(message.text());});
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  const results=[];
  const trigger=()=>page.getByRole('button',{name:'Filter stack',exact:true});
  const search=()=>page.getByRole('combobox',{name:'Search technologies'});
  const selected=tech=>page.getByRole('option',{name:tech,exact:true});
  const choose=async tech=>{
    if(await trigger().getAttribute('aria-expanded')!=='true')await trigger().click();
    await search().fill(tech);await selected(tech).click();
    await page.waitForURL(url=>url.searchParams.getAll('tech').includes(tech));
    await page.waitForFunction(()=>!document.querySelector('[role="status"][aria-busy="true"]'));
  };
  try{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,1024,768,390,320]){
      await page.setViewportSize({width,height:width<768?844:1000});
      await page.goto(origin+'/projects?keep=projects-review');
      await page.locator('[data-project-card]').first().waitFor();await page.evaluate(()=>document.fonts.ready);
      const state=await page.evaluate(()=>{
        const card=document.querySelector('[data-featured]');const title=card.querySelector('h2');
        const media=card.querySelector('[data-tilted-cover]');
        const group=document.querySelector('[aria-label="Filter projects by stack"]');const button=group.querySelector('button');
        const widths=[...document.querySelectorAll('[data-project-card]')].map(el=>el.getBoundingClientRect().width);
        return{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,cardTop:card.getBoundingClientRect().top,titleTop:title.getBoundingClientRect().top,mediaTop:media.getBoundingClientRect().top,filterHeight:group.getBoundingClientRect().height,triggerHeight:button.getBoundingClientRect().height,columns:getComputedStyle(document.querySelector('[data-project-grid]')).gridTemplateColumns.split(' ').length,links:card.querySelectorAll('a[href^="/projects/"]').length,equalCards:Math.max(...widths)-Math.min(...widths)<1,titleSize:getComputedStyle(title).fontSize,flow:!!card.querySelector('[data-flow-button]')};
      });
      assert(!state.overflow,'Overflow '+width);assert(state.columns===(width<768?1:width<1200?2:3),'Wrong grid');
      assert(state.links===1,'Repeated primary link');assert(state.triggerHeight>=44,'Small filter target');
      assert(state.equalCards&&state.titleSize==='22px'&&state.flow,'Cards must share the Home item scale and Flow CTA');
      if(width<768)assert(state.titleTop<750&&state.mediaTop<state.titleTop&&state.filterHeight<90,'Compact uniform cards are not visible: '+JSON.stringify(state));
      await trigger().click();await search().waitFor();
      const popup=page.locator('[data-multi-select-content]');
      const box=await popup.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1,'Popup overflow');
      await search().fill('no-such-technology');await page.getByText('No technologies found.',{exact:true}).waitFor();
      await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Filter stack');
      assert(await page.evaluate(()=>!document.activeElement?.closest('[inert], [aria-hidden="true"]')),'Focus remained in a hidden popup');
      if(width===1440||width===390)await page.screenshot({path:'.playwright-cli/projects-polish-'+width+'.png'});
      results.push(state);
    }
    await page.setViewportSize({width:390,height:844});
    await page.goto(origin+'/projects?keep=projects-review');
    await choose('Next.js');await choose('TypeScript');
    assert(new URL(page.url()).searchParams.get('keep')==='projects-review','Lost query state');
    assert(await page.locator('[data-project-card]').count()===1,'AND filter should return Storylio only');
    assert(await page.locator('[data-project-card] h2').first().textContent()==='Storylio','Wrong AND result');
    await page.keyboard.press('Escape');
    const closedHeight=await trigger().evaluate(el=>el.getBoundingClientRect().height);
    const reset=page.getByRole('button',{name:'Reset stack',exact:true});
    assert((await reset.boundingBox()).width>=44,'Small reset target');
    await trigger().click();await search().fill('TypeScript');await selected('TypeScript').click();
    await page.waitForURL(url=>url.searchParams.getAll('tech').length===1);
    await page.keyboard.press('Escape');
    await page.goBack();await page.waitForURL(url=>url.searchParams.getAll('tech').length===2);
    assert((await trigger().innerText()).includes('2 technologies'),'Back did not restore selection');
    await page.goForward();await page.waitForURL(url=>url.searchParams.getAll('tech').length===1);
    await page.getByRole('button',{name:'Reset stack',exact:true}).click();
    await page.waitForURL(url=>!url.searchParams.has('tech'));
    assert(new URL(page.url()).searchParams.get('keep')==='projects-review','Reset discarded query');
    assert(await trigger().getAttribute('aria-expanded')==='false','Reset opened dropdown');
    assert(await trigger().evaluate(el=>el.getBoundingClientRect().height)===closedHeight,'Selection changes trigger height');
    await page.setViewportSize({width:390,height:600});await trigger().click();
    const shortPanel=await page.locator('[data-multi-select-content]').boundingBox();
    assert(shortPanel.y>=0&&shortPanel.y+shortPanel.height<=600,'Dropdown clipped on short screen: '+JSON.stringify(shortPanel));
    await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});
    await trigger().click();await search().fill('Next.js');await selected('Next.js').click();
    await page.waitForURL(url=>url.searchParams.has('tech'));
    await page.getByRole('button',{name:'Reset stack',exact:true}).click();
    await page.waitForURL(url=>!url.searchParams.has('tech'));
    assert(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')==='Filter stack'&&!document.activeElement.closest('[inert], [aria-hidden="true"]')),'Reset did not safely restore focus');
    await choose('Next.js');await choose('React');
    await page.getByRole('heading',{name:'No projects found'}).waitFor();
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'Reset stack',exact:true}).click();
    await page.waitForURL(url=>!url.searchParams.has('tech'));await page.locator('[data-project-card]').first().waitFor();
    await trigger().focus();await page.keyboard.press('Enter');await search().fill('Framer Motion');await page.keyboard.press('Enter');
    await page.waitForURL(url=>url.searchParams.getAll('tech').includes('Framer Motion'));
    await page.keyboard.press('Escape');await page.getByRole('link',{name:'Read case study',exact:true}).first().press('Enter');
    await page.waitForURL(url=>url.pathname==='/projects/canvas-notes');
    assert(!errors.length,errors.join('\n'));
    return{results,andFiltering:true,emptyReset:true,history:true,keyboard:true,compactClear:true,errors};
  }finally{await page.close()}
}
