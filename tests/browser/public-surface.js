// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const url=new URL(sessionPage.url());
  const page=await sessionPage.context().newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  const sizes=[];
  try{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,768,390,320]){
      await page.setViewportSize({width,height:1000});
      await page.goto(url.href);
      await page.locator('h1').first().waitFor();
      await page.locator('[data-public-footer]').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert(await page.locator('h1').evaluate(el=>{
        for(let node=el;node;node=node.parentElement)if(Number(getComputedStyle(node).opacity)===0)return false;
        return true;
      }),'Heading is hidden by a reveal under reduced motion');
      const state=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,footer:document.querySelectorAll('footer').length,text:document.querySelector('h1')?.textContent}));
      assert(state.scrollWidth<=width+1,'Overflow: '+JSON.stringify(state));
      assert(state.h1===1&&state.footer===1,'Duplicate heading or footer');
      sizes.push(state);
      if(width===1440||width===390){
        await page.screenshot({path:'.playwright-cli/public-'+url.pathname.replaceAll('/','-')+'-'+width+'.png'});
      }
    }
    await page.locator('[data-public-footer-wrapper]').evaluate(el=>el.scrollIntoView({block:'end',behavior:'instant'}));
    const top=page.getByRole('link',{name:'Back to top',exact:true});
    await top.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>scrollY<2);
    assert(await page.evaluate(()=>document.activeElement.tagName)==='H1','Footer does not focus page heading');
    assert(errors.length===0,errors.join('\n'));
    return {path:url.pathname,sizes,footerKeyboard:true,errors};
  }finally{await page.close()}
}
