// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const context=await sessionPage.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(),origin=new URL(sessionPage.url()).origin;
  const assert=(condition,message)=>{if(!condition)throw Error(message)};
  let stage='open';
  try {
    await page.goto(`${origin}/gallery`);const card=page.locator('[data-gallery-photo]').first();await card.waitFor();
    await page.waitForFunction(()=>document.querySelector('[data-gallery-photo]').getBoundingClientRect().width>300);
    const count=await page.locator('[data-gallery-photo]').count();
    await card.tap();const dialog=page.getByRole('dialog',{name:'Lightbox',exact:true});await dialog.waitFor();
    await dialog.getByRole('status',{name:`Image 1 of ${count}`,exact:true}).waitFor();
    const image=page.locator('.yarl__slide_current img');await image.evaluate(el=>el.decode().catch(()=>{}));
    const cdp=await context.newCDPSession(page);
    stage='swipe';
    const touch=(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points});
    const tap=async locator=>{
      const rect=await locator.boundingBox();
      await touch('touchStart',[{x:rect.x+rect.width/2,y:rect.y+rect.height/2}]);
      await page.waitForTimeout(50);
      await touch('touchEnd',[]);
    };
    const box=await image.boundingBox(),y=box.y+box.height/2;
    await touch('touchStart',[{x:310,y}]);
    for(let i=1;i<=8;i++) {
      await touch('touchMove',[{x:310-i*28,y}]);
      await page.waitForTimeout(20);
    }
    await touch('touchEnd',[]);
    await dialog.getByRole('status',{name:`Image 2 of ${count}`,exact:true}).waitFor();
    await page.locator('.yarl__slide_current img').evaluate(el=>el.decode().catch(()=>{}));
    await page.waitForFunction(()=>document.querySelector('.yarl__carousel').getAnimations().every(animation=>animation.playState==='finished'));
    await page.waitForTimeout(300);
    stage='zoom';
    const zoomIn=dialog.getByRole('button',{name:'Zoom in',exact:true});await tap(zoomIn);
    await page.waitForFunction(()=>{const el=document.querySelector('.yarl__slide_current .yarl__slide_wrapper');return el&&parseFloat(getComputedStyle(el).transform.split('(')[1])>1.1});
    await tap(dialog.getByRole('button',{name:'Zoom out',exact:true}));
    stage='close';
    await tap(dialog.getByRole('button',{name:'Close',exact:true}));await dialog.waitFor({state:'hidden'});
    assert(await page.locator('html.lenis').count()===0,'Touch device enabled Lenis');
    // Keep vertical page panning native after the lightbox closes.
    await card.scrollIntoViewIfNeeded();const before=await page.evaluate(()=>scrollY),rect=await card.boundingBox(),x=195,top=Math.min(rect.y+rect.height*.7,700);
    stage='vertical pan';
    await touch('touchStart',[{x,y:top}]);
    for(let i=1;i<=8;i++) {
      await touch('touchMove',[{x,y:top-i*20}]);
      await page.waitForTimeout(20);
    }
    await touch('touchEnd',[]);
    await page.waitForFunction(previous=>scrollY>previous+30,before);
    assert(await dialog.count()===0,'Vertical pan opened lightbox');
    return {touchSwipe:true,zoom:true,nativePagePan:true};
  } catch(error) {
    error.message+=` Stage: ${stage} ${JSON.stringify(await page.evaluate(()=>({scrollY,classes:document.documentElement.className,transform:document.querySelector('.yarl__slide_current .yarl__slide_wrapper')?.getAttribute('style'),zoomButtons:[...document.querySelectorAll('button[aria-label^="Zoom"]')].map(el=>({label:el.getAttribute('aria-label'),disabled:el.disabled})),dialog:!!document.querySelector('[role="dialog"]')})))}`;
    throw error;
  } finally {await context.close()}
}
