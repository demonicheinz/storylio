// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page=await sessionPage.context().newPage(),origin=new URL(sessionPage.url()).origin;
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const errors=[],warnings=[],results=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='warning'&&/aria-hidden/.test(message.text()))warnings.push(message.text())});
  const trigger=()=>page.getByRole('button',{name:'Filter category',exact:true});
  const photos=()=>page.locator('[data-gallery-photo]');
  const waitSelection=category=>page.waitForFunction(value=>document.querySelector('button[aria-label="Filter category"]')?.getAttribute('aria-description')===value,category||'All categories');
  let stage='responsive';
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,1024,768,390,320]) {
      stage=`responsive ${width}`;
      await page.setViewportSize({width,height:1000});
      await page.goto(`${origin}/gallery?keep=gallery-test`);await photos().first().waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(columns=>new Set([...document.querySelectorAll('[data-gallery-photo]')].map(el=>Math.round(el.getBoundingClientRect().left))).size===columns,width>=1024?3:width>=768?2:1);
      await photos().first().locator('img').evaluate(image=>image.decode().catch(()=>{}));
      const data=await page.evaluate(()=>{
        const cards=[...document.querySelectorAll('[data-gallery-photo]')],first=cards[0].getBoundingClientRect();
        return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,firstTop:first.top,columns:new Set(cards.map(el=>Math.round(el.getBoundingClientRect().left))).size,heading:getComputedStyle(document.querySelector('h1')).fontSize,count:cards.length,description:document.querySelector('header p')?.textContent};
      });
      assert(!data.overflow&&data.firstTop<600,`Gallery opening too tall or overflowing: ${JSON.stringify(data)}`);
      assert(data.columns===(width>=1024?3:width>=768?2:1),`Unexpected column count: ${JSON.stringify(data)}`);
      assert(data.heading===(width<768?'40px':'56px'),'Heading drift');
      if(width===1440||width===390)await page.screenshot({path:`task/gallery-polish/gallery-${width}.png`});
      await trigger().click();
      await page.getByRole('combobox',{name:'Search categories'}).fill('Interface');
      await page.getByRole('option',{name:'Interface',exact:true}).click();
      await page.waitForURL(url=>url.searchParams.get('category')==='Interface');await waitSelection('Interface');
      assert(new URL(page.url()).searchParams.get('keep')==='gallery-test','Filter lost unrelated query');
      assert(await trigger().getAttribute('aria-expanded')==='false','Single selection did not close');
      assert(await trigger().evaluate(el=>el===document.activeElement),'Filter did not restore focus');
      assert(await photos().count()>0&&await photos().count()<data.count,'Category did not filter photos');
      assert((await photos().allTextContents()).every(text=>text.includes('Interface')),'Mixed category results');
      await page.goBack();await waitSelection();await page.waitForFunction(count=>document.querySelectorAll('[data-gallery-photo]').length===count,data.count);
      await page.goForward();await waitSelection('Interface');
      await page.getByRole('button',{name:'Reset category',exact:true}).click();
      await page.waitForURL(url=>!url.searchParams.has('category'));await waitSelection();
      await page.waitForFunction(count=>document.querySelectorAll('[data-gallery-photo]').length===count,data.count);

      stage=`lightbox ${width}`;
      const originPhoto=photos().first();await originPhoto.click();
      const dialog=page.getByRole('dialog',{name:'Lightbox',exact:true});await dialog.waitFor();
      await dialog.getByRole('status',{name:`Image 1 of ${data.count}`,exact:true}).waitFor();
      await page.waitForFunction(()=>{
        const container=document.querySelector('.yarl__container')?.getBoundingClientRect(),details=document.querySelector('[data-gallery-details]')?.getBoundingClientRect();
        return container&&details&&Math.abs(container.bottom-details.top)<1;
      });
      const controls=await dialog.getByRole('button').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').map(n=>({label:n.getAttribute('aria-label'),width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
      assert(controls.every(c=>c.width>=44&&c.height>=44),`Lightbox control target shrank: ${JSON.stringify(controls)}`);
      await page.locator('.yarl__slide_current img').evaluate(image=>image.decode().catch(()=>{}));
      if(width===1440||width===390)await page.screenshot({path:`task/gallery-polish/lightbox-${width}.png`});
      const zoomIn=dialog.getByRole('button',{name:'Zoom in',exact:true});
      assert(await zoomIn.isEnabled(),'Zoom unavailable');await zoomIn.click();
      await dialog.getByRole('button',{name:'Zoom out',exact:true}).click();
      await page.keyboard.press('ArrowRight');
      await dialog.getByRole('status',{name:`Image 2 of ${data.count}`,exact:true}).waitFor();
      await page.keyboard.press('Tab');
      assert(await dialog.evaluate(el=>el.contains(document.activeElement)),'Keyboard focus escaped');
      await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
      assert(await originPhoto.evaluate(el=>el===document.activeElement),'Closing did not restore the originating photo');
      results.push({...data,filter:true,history:true,zoom:true,keyboard:true});
    }
    stage='unknown filter';
    await page.goto(`${origin}/gallery?category=gallery-missing-category&keep=yes`);
    await page.getByRole('heading',{name:'No frames in this category',exact:true}).waitFor();
    await page.getByRole('button',{name:'Reset category',exact:true}).click();
    await waitSelection();await photos().first().waitFor();
    stage='Lenis and short landscape description';
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.setViewportSize({width:844,height:390});await page.goto(`${origin}/gallery`);
    await page.waitForFunction(()=>document.documentElement.classList.contains('lenis'));
    await photos().first().click();
    const dialog=page.getByRole('dialog',{name:'Lightbox',exact:true});await dialog.waitFor();
    await page.waitForFunction(()=>document.documentElement.classList.contains('lenis-stopped'));
    // Synthetic long text stays in this disposable page; no CMS data is edited.
    await page.locator('[data-gallery-details] p').last().evaluate(el=>el.textContent='Long description fixture. '.repeat(300));
    await page.waitForFunction(()=>{const el=document.querySelector('[data-gallery-details]');return el.scrollHeight>el.clientHeight&&el.clientHeight<=innerHeight*.3+1});
    const before=await page.evaluate(()=>scrollY);
    await page.locator('[data-gallery-details]').hover();await page.mouse.wheel(0,200);
    await page.waitForFunction(()=>document.querySelector('[data-gallery-details]').scrollTop>0);
    assert(Math.abs(await page.evaluate(()=>scrollY)-before)<1,'Description scroll moved background');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-stopped'));
    assert(errors.length===0&&warnings.length===0,[...errors,...warnings].join('\n'));
    return {results,empty:true,longDescription:true,lenis:true,errors,warnings};
  } catch(error) {error.message+=`\nStage: ${stage}`;throw error}
  finally {await page.close()}
}
