// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const context=await sessionPage.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();
  let step='initial tap';
  try {
    await page.goto(origin+'/projects/storylio');
    const carousel=page.getByRole('region',{name:'Project screenshots',exact:true});await carousel.waitFor();await carousel.scrollIntoViewIfNeeded();
    await page.evaluate(()=>document.fonts.ready);
    await carousel.getByRole('button',{name:'Open Storylio screenshot 1',exact:true}).tap();
    await page.getByRole('button',{name:'Close',exact:true}).waitFor();
    await page.getByRole('button',{name:'Close',exact:true}).tap();
    await page.getByRole('dialog',{name:'Lightbox',exact:true}).waitFor({state:'hidden'});
    const cdp=await context.newCDPSession(page);
    step='swipe';
    // Keep all touch gestures on one Chromium input channel.
    const tap=async locator=>{
      const box=await locator.boundingBox();
      await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height/2}]});
      await page.waitForTimeout(50);
      await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    };
    const active=carousel.getByRole('button',{name:'Open Storylio screenshot 1',exact:true});
    const box=await active.boundingBox();
    const y=box.y+box.height*.5;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.8,y}]});
    for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*(.8-i*.075),y}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='1');
    if(await page.getByRole('dialog',{name:'Lightbox',exact:true}).count())throw Error('Touch swipe opened lightbox');
    const open=carousel.getByRole('button',{name:'Open Storylio screenshot 2',exact:true});
    step='tap after swipe';
    await tap(open);await page.getByRole('button',{name:'Close',exact:true}).waitFor();
    await page.getByRole('button',{name:'Close',exact:true}).tap();
    await page.getByRole('dialog',{name:'Lightbox',exact:true}).waitFor({state:'hidden'});
    await carousel.scrollIntoViewIfNeeded();
    step='vertical swipe';
    const before=await page.evaluate(()=>scrollY),secondBox=await open.boundingBox();
    const x=secondBox.x+secondBox.width/2,top=secondBox.y+secondBox.height*.8;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:top}]});
    for(let i=1;i<=8;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:top-i*14}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await page.waitForFunction(y=>scrollY>y+30,before);
    if(await page.locator('[data-depth-carousel]').getAttribute('data-current-index')!=='1')throw Error('Vertical touch changed screenshot');
    return {touchSwipe:true,tapLightbox:true,verticalTouchScroll:true};
  } catch(error) {error.message+=' Stage: '+step+' '+JSON.stringify(await page.evaluate(()=>({index:document.querySelector('[data-depth-carousel]')?.dataset.currentIndex,dialog:!!document.querySelector('[role="dialog"]'),focused:document.hasFocus()})));throw error;} finally {await context.close()}
}
