// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const page=await sessionPage.context().newPage(),origin=new URL(sessionPage.url()).origin;
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const results=[];
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});await page.goto(origin+'/blog');await page.getByRole('heading',{name:'Writing',exact:true}).waitFor();
      await page.locator('#writing-list').waitFor();await page.evaluate(()=>document.fonts.ready);
      const data=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,cards:[...document.querySelectorAll('[data-post-card]')].map(card=>({width:card.getBoundingClientRect().width,title:getComputedStyle(card.querySelector('h2')).fontSize,lines:getComputedStyle(card.querySelector('h2')).webkitLineClamp,cta:card.querySelector('[data-flow-button]')?.textContent.trim()}))}));
      assert(!data.overflow,'Page overflows: '+width);assert(data.cards.length<=6,'Unbounded page');
      assert(data.cards.every(card=>card.title==='22px'&&card.lines==='2'&&card.cta==='Read article'),'Card hierarchy changed');
      if(width===1440||width===390)await page.screenshot({path:'task/writing-notes/archive-'+width+'.png',fullPage:true});
      results.push(data);
    }
    await page.goto(origin+'/blog?keep=writing-check&page=999');await page.locator('#writing-list').waitFor();
    const trigger=page.getByRole('button',{name:'Filter topic',exact:true});
    await trigger.click();
    const list=page.getByRole('listbox',{name:'Topics',exact:true});
    assert(await list.getAttribute('aria-multiselectable')==='false','Topic filter is not single-select');
    const values=await list.getByRole('option').allTextContents();
    if(values.length) {
      const search=page.getByRole('combobox',{name:'Search topics',exact:true});
      await search.fill(values[0]);
      assert(!new URL(page.url()).searchParams.has('tag'),'Search navigated');
      await page.getByRole('option',{name:values[0],exact:true}).click();
      await page.waitForURL(url=>url.searchParams.get('tag')===values[0]);
      assert(new URL(page.url()).searchParams.get('keep')==='writing-check'&&!new URL(page.url()).searchParams.has('page'),'Filter lost query/reset');
      await page.waitForFunction(()=>document.querySelector('button[aria-label="Filter topic"]')?.getAttribute('aria-expanded')==='false'&&document.querySelector('[data-multi-select-content]')?.hasAttribute('inert'),undefined,{timeout:3000});
      await page.goBack();await page.waitForURL(url=>url.searchParams.get('page')==='999');
      await page.goForward();await page.waitForURL(url=>url.searchParams.get('tag')===values[0]);
      if(values[1]) {
        await trigger.click();
        await page.getByRole('combobox',{name:'Search topics',exact:true}).fill(values[1]);
        await page.getByRole('option',{name:values[1],exact:true}).click();
        await page.waitForURL(url=>url.searchParams.get('tag')===values[1]);
        assert(new URL(page.url()).searchParams.getAll('tag').length===1,'Multiple topics selected');
      }
      await page.getByRole('button',{name:'Reset topic',exact:true}).click();
      await page.waitForURL(url=>!url.searchParams.has('tag'));
    }
    await page.getByRole('navigation',{name:'Writing formats'}).getByRole('link',{name:'Notes',exact:true}).click();
    await page.waitForURL(url=>url.searchParams.get('tag')==='notes');await page.getByRole('heading',{name:'Notes from building',exact:true}).waitFor();
    assert(await page.getByRole('button',{name:'Filter topic',exact:true}).count()===0,'Article topic control leaked to Notes');
    await page.goto(origin+'/blog?tag=unknown-writing-fixture');await page.locator('#writing-list').waitFor();
    assert(await page.locator('[data-post-card]').count()===0,'Unknown tag exposes articles');
    return {results,singleTopic:true,notesArchive:true,unknownTagEmpty:true};
  } finally {await page.close()}
}
