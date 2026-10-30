// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const page=await sessionPage.context().newPage(),origin=new URL(sessionPage.url()).origin;
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const results=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/api/auth/**',route=>route.fulfill({status:400,contentType:'application/json',body:'{"code":"FIXTURE"}'}));
  const palette=()=>page.evaluate(()=>{const style=getComputedStyle(document.documentElement);return Object.fromEntries(['--background','--surface','--surface-2','--surface-3','--surface-4','--card','--sidebar','--border'].map(token=>[token,style.getPropertyValue(token).trim()]))});
  let stage='responsive';
  try {
    for(const [width,height]of [[1440,1000],[1024,900],[768,1024],[390,844],[320,740],[844,390]]){
    await page.setViewportSize({width,height});await page.goto(origin+'/sign-in');
    await page.getByRole('heading',{name:'Sign in to Storylio',exact:true}).waitFor();
    await page.locator('[data-auth-earth]').evaluate(image=>image.decode());await page.evaluate(()=>document.fonts.ready);
    await page.getByRole('button',{name:'Sign in',exact:true}).scrollIntoViewIfNeeded();
    const geometry=await page.evaluate(()=>{
      const background=document.querySelector('[data-auth-background]'),earth=document.querySelector('[data-auth-earth]'),stars=document.querySelector('[data-auth-stars] canvas'),form=document.querySelector('form'),button=document.querySelector('button[type="submit"]');
      const center=button.getBoundingClientRect();return {width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,imageWidth:earth.naturalWidth,imageLoaded:earth.complete,stars:!!stars&&stars.width>0,formWidth:form.getBoundingClientRect().width,backgroundPointer:getComputedStyle(background).pointerEvents,buttonOnTop:document.elementFromPoint(center.left+center.width/2,center.top+center.height/2)?.closest('button')===button,bg:getComputedStyle(document.documentElement).getPropertyValue('--background').trim()};
    });
    assert(!geometry.overflow&&geometry.imageLoaded&&geometry.stars&&geometry.formWidth<=401&&geometry.backgroundPointer==='none'&&geometry.buttonOnTop,'Invalid auth scene '+JSON.stringify(geometry));
    if(width===1440||width===390)await page.screenshot({path:`task/auth-sky/signin-${width}.png`});
    results.push(geometry);
  }
  stage='motion lifecycle';await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(origin+'/sign-in');
  await page.waitForFunction(()=>document.querySelector('[data-auth-stars] canvas')?.dataset.starRunning==='true');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await page.waitForFunction(()=>document.querySelector('[data-auth-stars] canvas')?.dataset.starRunning==='false');
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(()=>document.querySelector('[data-auth-stars] canvas')?.dataset.starRunning==='true');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>document.querySelector('[data-auth-stars] canvas')?.dataset.starRunning==='false');
  stage='global palette';const authTokens=await palette();
  for(const path of ['/about','/projects','/blog','/gallery','/']){
    await page.goto(origin+path);await page.locator('main').waitFor();
    assert(await page.locator('[data-auth-background]').count()===0,'Auth decoration leaked to '+path);
    const tokens=await palette();assert(JSON.stringify(tokens)===JSON.stringify(authTokens),'Global palette differs '+path);
    const chrome=await page.locator('[data-public-chrome]').evaluate(el=>{const style=getComputedStyle(el);return {background:style.getPropertyValue('--background').trim(),surface:style.getPropertyValue('--surface').trim()}});
    assert(chrome.background===authTokens['--background']&&chrome.surface===authTokens['--surface'],'Public override remains');
  }
  // A disposable shell verifies dashboard token consumers without a real login.
  await page.goto(origin+'/sign-in');
  const dashboard=await page.evaluate(()=>{
    const node=document.createElement('div');node.dataset.dashboardPaletteFixture='';node.innerHTML='<aside style="background:var(--sidebar)"></aside><section style="background:var(--card)"></section>';document.body.append(node);
    const values=[...node.children].map(el=>getComputedStyle(el).backgroundColor),expected=getComputedStyle(document.querySelector('#email')).backgroundColor;node.remove();return {values,expected};
  });
  assert(dashboard.values.every(value=>value===dashboard.expected),'Card/sidebar drift '+JSON.stringify(dashboard));
  stage='light fallback';await page.evaluate(()=>document.documentElement.classList.remove('dark'));
  const light=await page.evaluate(()=>({opacity:getComputedStyle(document.querySelector('[data-auth-background]')).opacity,input:getComputedStyle(document.querySelector('#email')).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth}));
  assert(light.opacity==='0.2'&&!light.overflow,'Light fallback invalid');
  assert(errors.length===0,errors.join('\n'));
  return {results,blurFocus:true,reducedMotion:true,authOnly:true,palette:authTokens,dashboardConsumers:dashboard,errors};
  }catch(error){error.message+=' Stage: '+stage;throw error}
  finally{await page.close()}
}
