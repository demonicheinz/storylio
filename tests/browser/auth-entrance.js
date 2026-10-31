// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const context=await sessionPage.context().browser().newContext();
  const page=await context.newPage(),origin=new URL(sessionPage.url()).origin,results=[];
  const assert=(value,message)=>{if(!value)throw Error(message)};
  await page.route('**/api/auth/**',route=>route.fulfill({status:400,contentType:'application/json',body:'{"code":"FIXTURE"}'}));
  await page.addInitScript(()=>{
    window.entranceSamples=[];
    const start=performance.now();
    const sample=()=>{
    const host=document.querySelector('[data-auth-intro]'),form=document.querySelector('[data-auth-form]'),earth=document.querySelector('[data-auth-earth]'),stars=document.querySelector('[data-auth-stars]'),nav=document.querySelector('nav[aria-label="Main navigation"]'),hero=document.querySelector('[data-home-hero]');
    if(host||nav){
      const style=el=>el?{animation:getComputedStyle(el).animationName,duration:getComputedStyle(el).animationDuration,delay:getComputedStyle(el).animationDelay,opacity:Number(getComputedStyle(el).opacity),transform:getComputedStyle(el).transform}:null;
      window.entranceSamples.push({intro:host?.dataset.authIntro,form:style(form),earth:style(earth),stars:style(stars),starField:style(stars?.querySelector('[data-gravity-stars]')),nav:style(nav),hero:hero?.dataset.introComplete});
    }
    if(performance.now()-start<2200)requestAnimationFrame(sample);
    };requestAnimationFrame(sample);
  });
  let stage='auth';
  try {
    for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(`${origin}/sign-in`);await page.locator('[data-auth-form]').waitFor();
    await page.waitForFunction(()=>document.querySelector('[data-auth-intro]')?.dataset.authIntro==='complete');
    const samples=await page.evaluate(()=>window.entranceSamples);
    assert(samples.some(frame=>frame.earth?.animation!=='none'&&frame.earth?.duration==='0.7s'),'Earth entrance absent');
    const skyFrames=samples.filter(frame=>frame.earth?.duration==='0.7s'&&frame.starField);
    assert(skyFrames.length>0&&skyFrames.every(frame=>frame.starField.animation===frame.earth.animation&&frame.starField.duration===frame.earth.duration&&frame.starField.delay==='0s'&&frame.stars.opacity===0.6),'Stars do not enter together with Earth');
    assert(samples.some(frame=>frame.form?.duration==='0.3s'),'Grouped form entrance absent');
    const end=await page.locator('[data-auth-form]').evaluate(el=>({opacity:getComputedStyle(el).opacity,transform:getComputedStyle(el).transform,animation:getComputedStyle(el).animationName}));
    assert(end.opacity==='1'&&end.transform==='none'&&end.animation==='none','Form did not settle');
    await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));window.dispatchEvent(new Event('focus'))});
    assert(await page.locator('[data-auth-intro]').getAttribute('data-auth-intro')==='complete','Focus replayed entrance');
    await page.getByLabel('Email',{exact:true}).fill('fixture@example.test');
    assert(await page.getByLabel('Password',{exact:true}).isEnabled(),'Entrance blocked password');
    await page.getByRole('button',{name:'Show password',exact:true}).click();
    await page.screenshot({path:`task/auth-entrance/signin-${width}.png`});
    results.push({width,earth:true,stars:true,groupedForm:true,noReplay:true});
    }
    stage='interaction';await page.goto(`${origin}/sign-in`);await page.getByLabel('Email',{exact:true}).focus();
    await page.waitForFunction(()=>document.querySelector('[data-auth-intro]')?.dataset.authIntro==='complete');
    assert(await page.locator('[data-auth-form]').evaluate(el=>getComputedStyle(el).animationName)==='none','Focus did not finish animation');
    stage='reduced motion';await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${origin}/sign-in`);await page.locator('[data-auth-form]').waitFor();
    assert(await page.locator('[data-auth-form], [data-auth-earth], [data-auth-stars] [data-gravity-stars]').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).animationName==='none')),'Reduced motion retained entrance');
    stage='navbar';await page.emulateMedia({reducedMotion:'no-preference'});await page.goto(`${origin}/`);
    await page.getByRole('navigation',{name:'Main navigation',exact:true}).waitFor();
    await page.waitForFunction(()=>window.entranceSamples.some(frame=>frame.nav&&frame.hero==='false'));
    const navFrames=await page.evaluate(()=>window.entranceSamples.filter(frame=>frame.nav&&frame.hero==='false'));
    assert(navFrames.every(frame=>frame.nav.opacity===1&&frame.nav.animation==='none'),`Hero conceals navbar: ${JSON.stringify(navFrames)}`);
    await page.getByRole('navigation',{name:'Main navigation',exact:true}).getByRole('link',{name:'About',exact:true}).focus();await page.keyboard.press('Enter');
    await page.waitForURL(url=>url.pathname==='/about');
    return {results,focusCompletes:true,reducedMotion:true,homeNavIndependent:true,navFrames:navFrames.length};
  }catch(error){error.message+=` Stage: ${stage}`;throw error}
  finally{await context.close()}
}
