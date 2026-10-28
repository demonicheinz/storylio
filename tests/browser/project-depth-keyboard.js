// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page=await sessionPage.context().newPage();
  const origin=new URL(sessionPage.url()).origin;
  try {
    await page.goto(origin+'/projects/storylio');
    const gallery=page.getByRole('region',{name:'Project screenshots',exact:true});await gallery.waitFor();
    // Exercise a hydrated control before dispatching cancelable keyboard events.
    const next=gallery.getByRole('button',{name:'Next screenshot',exact:true});await next.click();
    await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='1');
    await next.focus();
    const modified=await next.evaluate(button=>{
      const results=[];
      for(const modifier of ['altKey','ctrlKey','metaKey','shiftKey']) {
        for(const key of ['ArrowLeft','ArrowRight','Home','End']) {
          const event=new KeyboardEvent('keydown',{key,[modifier]:true,bubbles:true,cancelable:true});
          button.dispatchEvent(event);
          results.push({modifier,key,prevented:event.defaultPrevented});
        }
      }
      return results;
    });
    if(modified.some(event=>event.prevented))throw Error('Modified key intercepted: '+JSON.stringify(modified.filter(event=>event.prevented)));
    if(await page.locator('[data-depth-carousel]').getAttribute('data-current-index')!=='1')throw Error('Modified keys changed the active screenshot');
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='2');
    await page.keyboard.press('Home');
    await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='0');
    await page.keyboard.press('End');
    await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='2');
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='1');
    return {modifiedCombinations:modified.length,modifiedKeysPreserved:true,plainNavigation:true};
  } finally {await page.close()}
}
