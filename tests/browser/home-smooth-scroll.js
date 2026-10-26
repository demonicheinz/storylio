// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const page=await sessionPage.context().newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(condition,message)=>{if(!condition)throw new Error(message)};
  const active=()=>page.waitForFunction(()=>document.documentElement.classList.contains('lenis'));
  const atTop=()=>page.waitForFunction(()=>scrollY<2);
  let stage='startup';
  try{
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(origin);
    await active();
    await page.waitForFunction(()=>document.querySelector('[data-home-hero]').dataset.introComplete==='true');
    assert(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='auto','Native smoothing competes with Lenis');

    stage='wheel';
    await page.mouse.move(100,800);
    await page.mouse.wheel(0,600);
    await page.waitForFunction(()=>scrollY>0);
    const samples=await page.evaluate(async()=>{
      const values=[];
      for(let i=0;i<12;i++){await new Promise(requestAnimationFrame);values.push(scrollY)}
      return values;
    });
    assert(new Set(samples).size>2,'Wheel does not interpolate over frames');
    await page.waitForFunction(()=>Math.abs(scrollY-600)<2);

    stage='anchor';
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await atTop();
    const cta=page.locator('[data-venom-link]');
    await cta.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>Math.abs(document.getElementById('selected-projects').getBoundingClientRect().top)<2);
    assert(new URL(page.url()).hash==='#selected-projects','Anchor history missing');
    assert(await page.evaluate(()=>document.activeElement.id)==='selected-projects','Anchor focus missing');

    stage='footer';
    await page.locator('[data-home-footer-wrapper]').evaluate(el=>el.scrollIntoView({block:'end',behavior:'instant'}));
    const back=page.getByRole('link',{name:'Back to top',exact:true});
    await back.focus();
    assert(await back.evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}),'Footer focus is clipped');
    await page.keyboard.press('Enter');
    await atTop();
    assert(await page.evaluate(()=>document.activeElement.id)==='home-title','Back-to-top focus missing');

    stage='native nested scrolling';
    const nested=await page.evaluate(()=>{
      const box=document.createElement('div');box.dataset.lenisPrevent='';box.id='lenis-native-fixture';
      box.style.cssText='position:fixed;left:20px;top:100px;width:200px;height:160px;overflow:auto;z-index:999';
      const content=document.createElement('div');content.style.height='1000px';box.append(content);document.body.append(box);
      return true;
    });
    await page.mouse.move(80,180);await page.mouse.wheel(0,250);
    await page.waitForFunction(()=>document.getElementById('lenis-native-fixture').scrollTop>0);
    assert(await page.evaluate(()=>scrollY)<2,'Nested scrolling moved the page');
    await page.locator('#lenis-native-fixture').evaluate(el=>el.remove());

    stage='focus interruption';
    await page.mouse.move(100,800);await page.mouse.wheel(0,700);
    await page.waitForFunction(()=>scrollY>0);
    const paused=await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));return scrollY});
    await page.waitForTimeout(200);
    assert(Math.abs(await page.evaluate(()=>scrollY)-paused)<2,'Scroll keeps drifting while unfocused');
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(150);
    assert(Math.abs(await page.evaluate(()=>scrollY)-paused)<2,'Focus resumes stale scroll inertia');

    stage='route cleanup and history';
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Projects',exact:true}).click();
    await page.waitForURL(origin+'/projects');
    await active();
    assert(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='auto','Public route lost Lenis');
    await page.goBack();await active();
    await page.waitForFunction(()=>document.querySelector('[data-home-page]'));

    stage='live reduced motion';
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>!document.documentElement.classList.contains('lenis'));
    assert(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)==='auto','Reduced motion has native smoothing');
    await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
    await cta.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>Math.abs(document.getElementById('selected-projects').getBoundingClientRect().top)<2);
    await page.emulateMedia({reducedMotion:'no-preference'});await active();

    stage='fresh touch and reduced motion';
    const browser=page.context().browser();
    for(const options of [
      {viewport:{width:390,height:844},isMobile:true,hasTouch:true},
      {viewport:{width:1440,height:1000},reducedMotion:'reduce'},
    ]){
      const context=await browser.newContext(options);
      try{
        const native=await context.newPage();native.on('pageerror',error=>errors.push(error.message));
        await native.goto(origin);await native.locator('[data-home-page]').waitFor();
        await native.waitForTimeout(500);
        assert(await native.locator('html.lenis').count()===0,'Touch or reduced motion enabled Lenis');
        const link=native.locator('[data-venom-link]');await link.click();
        await native.waitForFunction(()=>Math.abs(document.getElementById('selected-projects').getBoundingClientRect().top)<2);
      }finally{await context.close()}
    }
    assert(errors.length===0,errors.join('\n'));
    return {passed:true,samples,nested,anchor:true,footer:true,focusPause:true,routeCleanup:true,history:true,reducedMotion:true,touch:true,errors};
  }catch(error){error.message+='\nStage: '+stage;throw error}
  finally{await page.close()}
}
