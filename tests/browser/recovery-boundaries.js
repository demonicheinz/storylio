// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const context=await sessionPage.context().browser().newContext();
  const page=await context.newPage(),origin=new URL(sessionPage.url()).origin,results=[],errors=[],sentryRequests=[];
  const assert=(value,message)=>{if(!value)throw Error(message)};
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{const url=new URL(request.url());if(url.hostname.endsWith('.sentry.io')||/\/api\/\d+\/envelope\/?$/.test(url.pathname))sentryRequests.push(request.url())});
  let stage='404';
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const [width,height]of [[1440,1000],[1024,900],[768,1024],[390,844],[320,740],[844,390]]){
      await page.setViewportSize({width,height});const response=await page.goto(origin+'/missing-boundary-review');
      await page.getByRole('heading',{name:'404: Lost in orbit.',exact:true}).waitFor();
      await page.locator('[data-astronaut]').evaluate(image=>image.decode());await page.evaluate(()=>document.fonts.ready);
      const geometry=await page.locator('[data-space-state]').evaluate(el=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,main:document.querySelectorAll('main').length,astronautMotion:getComputedStyle(el.querySelector('[data-astronaut]').parentElement.parentElement).animationName,actions:[...el.querySelectorAll('a')].map(a=>({label:a.getAttribute('aria-label')||a.textContent,height:a.getBoundingClientRect().height}))}));
      assert(response.status()===404&&!geometry.overflow&&geometry.main===1,'Invalid 404: '+JSON.stringify(geometry));
      assert(geometry.astronautMotion==='none'&&geometry.actions.every(a=>a.height>=44),'Motion or target mismatch');
      const home=page.getByRole('link',{name:'Back to home',exact:true});await home.scrollIntoViewIfNeeded();await home.focus();
      assert(await home.evaluate(el=>el===document.activeElement),'Home not keyboard accessible');
      if(width===1440||width===390)await page.screenshot({path:`task/boundary-sentry/not-found-${width}.png`});
      results.push({status:response.status(),...geometry});
    }
    stage='cold detail requests';
    for(const path of ['/projects/never-published-boundary-fixture','/blog/never-published-boundary-fixture','/not-found']){
      const response=await page.request.get(origin+path);assert(response.status()===404,'Missing detail returned '+response.status()+' '+path);
      assert((await response.text()).includes('data-space-state'),'Missing detail lost shared 404 UI');
    }
    stage='no JavaScript';const native=await context.browser().newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
    try {
      const staticPage=await native.newPage();const response=await staticPage.goto(origin+'/projects/never-published-boundary-fixture');
      const home=staticPage.getByRole('link',{name:'Back to home',exact:true});await home.waitFor();
      assert(response.status()===404&&await home.isVisible(),'404 depends on animation JavaScript');
      assert(await staticPage.locator('[data-space-state]').evaluate(el=>{for(let node=el;node;node=node.parentElement)if(Number(getComputedStyle(node).opacity)===0)return false;return true}),'Route motion hides static 404');
    }finally{await native.close()}
    stage='motion';await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(origin+'/missing-boundary-review');
    assert(await page.locator('[data-astronaut]').evaluate(el=>getComputedStyle(el.parentElement.parentElement).animationDuration)==='9s','Astronaut drift missing');
    assert(errors.length===0,errors.join('\n'));
    assert(sentryRequests.length===0,'Unconfigured Sentry transmitted data');
    return {results,cold404:true,noJavaScript:true,drift:true,sentryRequests:0,errors};
  }catch(error){error.message+=' Stage: '+stage;throw error}
  finally{await context.close()}
}
