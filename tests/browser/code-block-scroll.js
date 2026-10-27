// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page=await sessionPage.context().newPage();
  const origin=new URL(sessionPage.url()).origin;
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const results=[];
  try {
    await page.setViewportSize({width:1440,height:1000});
    for(const reducedMotion of ['no-preference','reduce']) {
      await page.emulateMedia({reducedMotion});
      await page.goto(origin+'/projects/storylio');
      await page.locator('pre').first().waitFor();
      const toc=page.getByRole('navigation',{name:'Project case study table of contents'});
      await toc.getByRole('button',{name:'Implementation Detail',exact:true}).click();
      if(reducedMotion==='no-preference')await page.waitForFunction(()=>document.documentElement.classList.contains('lenis'));
      const pre=page.locator('pre').first();
      // Browser-only long-line fixture; saved CMS content is never changed.
      await pre.locator('code').evaluate(el=>{el.textContent+='\n'+ 'long_example_value_'.repeat(40)});
      await pre.hover();
      await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-scrolling'));
      const start=await pre.evaluate(el=>({x:el.scrollLeft,y:scrollY,radius:getComputedStyle(el.parentElement).borderRadius,overflow:el.scrollWidth>el.clientWidth,nativeWheel:el.hasAttribute('data-lenis-prevent-wheel')}));
      assert(start.overflow,'Fixture has no horizontal overflow');
      assert(start.radius==='12px'&&start.nativeWheel,'Updated code markup is missing: '+JSON.stringify(start));
      await page.keyboard.down('Shift');
      try {await page.mouse.wheel(0,320)} finally {await page.keyboard.up('Shift')}
      await page.waitForFunction(()=>document.querySelector('pre').scrollLeft>100,undefined,{timeout:3000}).catch(async error=>{error.message+=' Shift: '+JSON.stringify(await pre.evaluate(el=>({x:el.scrollLeft,y:scrollY,focus:document.hasFocus(),box:el.getBoundingClientRect().toJSON()})));throw error});
      const shifted=await pre.evaluate(el=>({x:el.scrollLeft,y:scrollY}));
      assert(Math.abs(shifted.y-start.y)<2,'Shift + wheel scrolled the page');
      await page.mouse.wheel(240,0);
      await page.waitForFunction(x=>document.querySelector('pre').scrollLeft>x+100,shifted.x,{timeout:3000}).catch(error=>{error.message+=' Horizontal '+reducedMotion;throw error});
      const horizontal=await pre.evaluate(el=>({x:el.scrollLeft,y:scrollY}));
      assert(Math.abs(horizontal.y-start.y)<2,'Horizontal wheel scrolled the page');
      await page.mouse.wheel(0,140);
      await page.waitForFunction(y=>scrollY>y+50,horizontal.y,{timeout:3000}).catch(async error=>{error.message+=' Vertical '+reducedMotion+' '+JSON.stringify({start,shifted,horizontal,now:await pre.evaluate(el=>({x:el.scrollLeft,y:scrollY,focus:document.hasFocus(),height:el.clientHeight,scrollHeight:el.scrollHeight,styles:getComputedStyle(el).overscrollBehavior,root:getComputedStyle(document.documentElement).overflow,classes:document.documentElement.className}))});throw error});
      const vertical=await pre.evaluate(el=>({x:el.scrollLeft,y:scrollY}));
      assert(Math.abs(vertical.x-horizontal.x)<2,'Ordinary wheel moved the code horizontally');
      const shortcuts=await pre.evaluate(el=>{
        const before=el.scrollLeft;
        const zoom=new WheelEvent('wheel',{shiftKey:true,ctrlKey:true,deltaY:120,bubbles:true,cancelable:true});
        el.dispatchEvent(zoom);
        const zoomPreserved=!zoom.defaultPrevented&&el.scrollLeft===before;
        const back=new WheelEvent('wheel',{shiftKey:true,deltaY:-2,deltaMode:1,bubbles:true,cancelable:true});
        el.dispatchEvent(back);
        const lineDelta=Math.abs(before-el.scrollLeft-parseFloat(getComputedStyle(el).lineHeight)*2)<1;
        el.querySelector('code').textContent='short';el.scrollLeft=0;
        const short=new WheelEvent('wheel',{shiftKey:true,deltaY:120,bubbles:true,cancelable:true});el.dispatchEvent(short);
        return {zoomPreserved,lineDelta,shortCodeNotIntercepted:!short.defaultPrevented};
      });
      assert(Object.values(shortcuts).every(Boolean),'Shortcut edge cases failed: '+JSON.stringify(shortcuts));
      results.push({reducedMotion,radius:start.radius,shiftWheel:true,horizontalWheel:true,ordinaryWheelScrollsPage:true,...shortcuts});
    }
    return results;
  } finally {await page.close()}
}
