// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const page=await sessionPage.context().newPage(),origin=new URL(sessionPage.url()).origin;
  const assert=(value,message)=>{if(!value)throw Error(message)};const results=[];let stage='load';
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(`${origin}/blog?tag=notes&keep=notes-check`);
    const first=page.locator('[data-note-card]').first();await first.waitFor();
    // biome-ignore lint/performance/useDomNodeTextContent: Playwright Locator.innerText() reads the rendered label under test; this is not a DOM property access.
    const slug=await first.getAttribute('data-note-slug'),name=(await first.locator('h3').innerText()).trim();
    const dialog=()=>page.getByRole('dialog',{name,exact:true});
    for(const [width,height] of [[1440,1000],[768,1024],[390,844],[320,740],[844,390]]) {
      stage=`open ${width}`;await page.setViewportSize({width,height});
      await first.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY);await first.click();
      await dialog().waitFor();await page.waitForURL(url=>url.searchParams.get('note')===slug);
      const geometry=await dialog().evaluate(el=>({box:el.getBoundingClientRect().toJSON(),viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth+1,body:el.querySelector('[data-note-body]').textContent,backgroundScroll:getComputedStyle(document.body).overflow,close:el.querySelector('[aria-label="Close note"]').getBoundingClientRect().height}));
      assert(!geometry.overflow&&geometry.box.x>=-1&&geometry.box.right<=width+1&&geometry.box.y>=-1&&geometry.box.bottom<=height+1,`Dialog outside viewport: ${JSON.stringify(geometry)}`);
      assert(geometry.body.length>10&&geometry.close>=43.99,'Missing body or small close');
      assert(await dialog().getByRole('link',{name:/Open full page/i}).count()===0,'Unwanted full-page action');
      await page.keyboard.press('Tab');assert(await dialog().evaluate(el=>el.contains(document.activeElement)),'Focus escaped dialog');
      if(width===1440||width===390)await page.screenshot({path:`task/writing-notes/note-${width}.png`});
      stage=`close ${width}`;await page.keyboard.press('Escape');await dialog().waitFor({state:'hidden'});await page.waitForURL(url=>!url.searchParams.has('note'));
      assert(await first.evaluate(el=>el===document.activeElement),'Focus did not return');
      assert(Math.abs(await page.evaluate(()=>scrollY)-before)<3,'Closing changed background scroll');
      results.push({width,...geometry,focus:true});
    }
    stage='history';await first.click();await dialog().waitFor();await page.goBack();await dialog().waitFor({state:'hidden'});await page.goForward();await dialog().waitFor();
    await page.getByRole('button',{name:'Close note',exact:true}).click();await dialog().waitFor({state:'hidden'});
    stage='copy';await first.click();await dialog().waitFor();
    await page.evaluate(()=>{window.__noteCopied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__noteCopied=value}}})});
    await page.getByRole('button',{name:'Copy link',exact:true}).click();
    const copied=await page.evaluate(()=>window.__noteCopied);assert(new URL(copied).searchParams.get('note')===slug,'Copied link mismatch');
    await page.keyboard.press('Escape');await dialog().waitFor({state:'hidden'});
    stage='direct permalink';await page.goto(`${copied}&keep=direct-check`);await dialog().waitFor();await page.getByRole('button',{name:'Close note',exact:true}).click();await dialog().waitFor({state:'hidden'});
    assert(new URL(page.url()).searchParams.get('keep')==='direct-check','Direct close lost query');
    stage='legacy';await page.goto(`${origin}/blog/${slug}`);await page.waitForURL(url=>url.pathname==='/blog'&&url.searchParams.get('note')===slug);await dialog().waitFor();
    stage='unknown';await page.goto(`${origin}/blog?tag=notes&note=unknown-note-fixture`);await page.getByRole('dialog',{name:'Note unavailable',exact:true}).waitFor();await page.getByRole('button',{name:'Close note',exact:true}).click();
    stage='home';await page.goto(`${origin}/?keep=home-notes-check`);const homeCard=page.locator('[data-home-grid="notes"] [data-note-card]').first();await homeCard.waitFor();
    const homeSlug=await homeCard.getAttribute('data-note-slug');await homeCard.click();await page.getByRole('dialog').waitFor();
    assert(new URL(page.url()).pathname==='/'&&new URL(page.url()).searchParams.get('note')===homeSlug,'Home note navigated away');
    await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
    stage='normal motion';await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(`${origin}/blog?tag=notes`);await first.waitFor();await page.waitForFunction(()=>document.documentElement.classList.contains('lenis'));
    await first.click();await dialog().waitFor();await page.waitForFunction(()=>document.documentElement.classList.contains('lenis-stopped'));
    const locked=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,400);await page.waitForTimeout(200);assert(Math.abs(await page.evaluate(()=>scrollY)-locked)<3,'Lenis background moved');
    await page.keyboard.press('Escape');await dialog().waitFor({state:'hidden'});await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-stopped'));
    return {results,history:true,copy:true,directPermalink:true,legacyRedirect:true,unknownNote:true,homeInPlace:true,lenis:true};
  } catch(error){error.message+=` Stage: ${stage}`;throw error;} finally {await page.close()}
}
