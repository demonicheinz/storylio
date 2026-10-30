// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const page=await sessionPage.context().newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  const results=[];
  const stack=()=>page.locator('[data-tech-stack]');
  const windowElement=()=>page.locator('[data-tech-window]');
  const readyTimer=()=>page.waitForFunction(()=>Boolean(window.__stackTimer));
  const stoppedTimer=()=>page.waitForFunction(()=>!window.__stackTimer);
  const settled=()=>page.waitForFunction(()=>!document.querySelector('[data-tech-stack] [data-wiping]'));
  try {
    // Capture the real five-second callback without waiting for wall-clock cycles.
    await page.addInitScript(()=>{
      const schedule=window.setTimeout, cancel=window.clearTimeout;
      window.__stackTimer=null;
      window.setTimeout=function(callback,delay,...args){
        const id=schedule(callback,delay,...args);
        if(delay===5000&&typeof callback==='function')window.__stackTimer={id,tick:()=>{cancel(id);window.__stackTimer=null;callback(...args)}};
        return id;
      };
      window.clearTimeout=function(id){
        if(window.__stackTimer?.id===id)window.__stackTimer=null;
        return cancel(id);
      };
    });
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(origin);
    await page.locator('[data-home-page]').waitFor();
    assert(await page.locator('#home-title').innerText()==='I’m Heinz. I build web apps.','Old hero headline');
    assert(await page.locator('[data-venom-link]').getAttribute('href')==='#selected-projects','CTA is not the selected-projects anchor');
    assert(await page.locator('a[href="#selected-projects"]').count()===1,'Duplicate hero project link');
    assert(await page.getByText('See my projects',{exact:true}).count()===0,'Old secondary link remains');
    assert((await page.locator('[data-home-footer] h2').innerText()).replace(/\s+/g,' ')==='Got something in mind? Let’s talk.','Footer invitation differs');
    assert(await stack().locator('button').count()===0,'Stack has visible navigation controls');
    const total=Number(await stack().getAttribute('data-total'));
    assert(total>0,'Expected configured technologies for this fixture');
    for(const [width,capacity]of[[1440,6],[1024,4],[768,4],[390,3],[320,3]]){
      await page.setViewportSize({width,height:1000});
      await page.waitForFunction(cap=>document.querySelector('[data-tech-stack]')?.dataset.capacity===String(cap),capacity);
      await stack().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
      const pages=Number(await stack().getAttribute('data-pages'));
      const seen=new Set();
      const heights=[];
      for(let index=0;index<pages;index++){
        const state=await stack().evaluate(el=>{
          const items=[...el.querySelectorAll('li')].filter(item=>getComputedStyle(item).display!=='none');
          return {labels:items.map(item=>item.textContent.trim()),tops:items.map(item=>item.getBoundingClientRect().top),height:el.getBoundingClientRect().height};
        });
        state.labels.forEach(label=>seen.add(label));heights.push(state.height);
        assert(state.labels.length===Math.min(total,capacity),'Wrong visible count at '+width);
        assert(Math.max(...state.tops)-Math.min(...state.tops)<2,'Stack wraps at '+width);
        if(pages>1){
          const previous=await stack().getAttribute('data-page');
          await windowElement().focus();await page.keyboard.press('ArrowRight');
          await page.waitForFunction(old=>document.querySelector('[data-tech-stack]').dataset.page!==old,previous);
          await page.waitForTimeout(40);
        }
      }
      assert(seen.size===total,'Some configured technologies are inaccessible at '+width);
      assert(Math.max(...heights)-Math.min(...heights)<2,'Stack height shifts between groups');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');
      await stoppedTimer();
      if(width===390)await page.screenshot({path:'.playwright-cli/home-stack-390.png'});
      results.push({width,capacity,total,oneRow:true,allReachable:true});
    }
    await windowElement().evaluate(el=>el.blur());
    await page.mouse.move(1,1);
    await page.emulateMedia({reducedMotion:'no-preference'});
    await readyTimer();
    const previous=await stack().getAttribute('data-page');
    const before=await stack().locator('li').allTextContents();
    await page.evaluate(()=>window.__stackTimer.tick());
    await page.waitForFunction(old=>document.querySelector('[data-tech-stack]').dataset.page!==old,previous);
    await page.waitForFunction(()=>Boolean(document.querySelector('[data-tech-stack] [data-wiping]')));
    const wipe=await stack().evaluate(el=>[...el.querySelectorAll('li')].some(li=>li.getAnimations().some(a=>a.effect.getKeyframes().some(frame=>frame.clipPath==='inset(0px 100% 0px 0px)'||String(frame.clipPath).includes('100%')))));
    assert(wipe,'Logo change does not use the reference clip/blur wipe');
    await settled();
    assert(JSON.stringify(before)!==JSON.stringify(await stack().locator('li').allTextContents()),'Automatic wipe did not replace logos');
    await page.screenshot({path:'.playwright-cli/home-stack-wipe.png'});
    await stack().hover();await stoppedTimer();
    await page.mouse.move(1,1);await readyTimer();
    await windowElement().focus();await stoppedTimer();
    await windowElement().evaluate(el=>el.blur());await readyTimer();
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await stoppedTimer();
    await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await readyTimer();
    try{
      await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});
      await stoppedTimer();
    }finally{
      await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
    }
    await readyTimer();
    await page.evaluate(()=>window.__stackTimer.tick());
    await page.emulateMedia({reducedMotion:'reduce'});
    await stoppedTimer();await settled();
    assert(await stack().locator('li').evaluateAll(items=>items.every(el=>getComputedStyle(el).filter==='none'&&getComputedStyle(el).opacity==='1')),'Reduced motion retains wipe/blur');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await stoppedTimer();
    results.push({wipe:true,noButtons:true,hoverFocusVisibilityPause:true,reducedMotion:true});

    // On desktop all six current logos fit; the same group must still wipe repeatedly.
    await page.setViewportSize({width:1440,height:1000});
    await page.waitForFunction(()=>document.querySelector('[data-tech-stack]').dataset.capacity==='6');
    await stack().evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
    await page.mouse.move(1,1);
    await windowElement().evaluate(el=>el.blur());
    await page.emulateMedia({reducedMotion:'no-preference'});
    for(let cycle=0;cycle<3;cycle++){
      await readyTimer();
      const wave=await stack().getAttribute('data-wave');
      await page.evaluate(()=>window.__stackTimer.tick());
      await page.waitForFunction(old=>document.querySelector('[data-tech-stack]').dataset.wave!==old,wave);
      await page.waitForFunction(()=>Boolean(document.querySelector('[data-tech-stack] [data-wiping]')));
      await settled();
    }
    results.push({desktopSingleGroupRepeats:true,cycles:3});
    await page.emulateMedia({reducedMotion:'no-preference'});
    for(const [kind,limit]of[['projects',4],['writing',2.5]]){
      const card=page.locator(`[data-home-grid="${kind}"] > a`).first();
      await card.evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
      const title=card.locator('h3');
      const before=await title.boundingBox();const box=await card.boundingBox();
      await page.mouse.move(box.x+box.width*.9,box.y+box.height*.15,{steps:8});
      await card.locator('[data-tilt-active]').waitFor({state:'attached'});
      await page.waitForTimeout(450);
      const angles=await card.locator('[data-tilted-cover] > div').evaluate(el=>[...el.style.transform.matchAll(/rotate[XY]\(([-.\d]+)deg\)/g)].map(match=>Math.abs(Number(match[1]))));
      assert(angles.some(angle=>angle>.1)&&angles.every(angle=>angle<=limit+.1),'Incorrect tilt at '+kind);
      const after=await title.boundingBox();
      assert(Math.abs(before.x-after.x)<1&&Math.abs(before.y-after.y)<1,'Text moves with cover tilt');
      assert(await card.locator('button,[role="button"],a').count()===0,'Card nests an interactive control');
      await page.emulateMedia({reducedMotion:'reduce'});
      await page.waitForFunction(selector=>getComputedStyle(document.querySelector(selector+' [data-tilted-cover] > div')).transform==='none',`[data-home-grid="${kind}"] > a`);
      await page.emulateMedia({reducedMotion:'no-preference'});
      await page.mouse.move(1,1);
    }
    assert(await page.getByRole('button',{name:'Scroll to top',exact:true}).count()===0,'Home has floating STT');
    const project=page.locator('[data-home-grid="projects"] > a').first();
    const href=await project.getAttribute('href');
    await page.evaluate(()=>window.__homeInteractionMarker=true);
    await project.click();await page.waitForURL(origin+href);
    assert(await page.evaluate(()=>window.__homeInteractionMarker===true),'Project card reloads document');
    await stoppedTimer();
    results.push({coverTilt:true,textStable:true,reducedTiltDisabled:true,clientNavigation:true});
    await page.setViewportSize({width:390,height:844});
    await page.goto(origin+'/projects');
    await page.evaluate(()=>window.scrollTo({top:600,behavior:'instant'}));
    const floatingTop=page.getByRole('button',{name:'Scroll to top',exact:true});
    await floatingTop.waitFor();await floatingTop.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>scrollY<1);
    results.push({otherPagesRetainFloatingTop:true});

    const context=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
    try{
      const touch=await context.newPage();touch.on('pageerror',error=>errors.push(error.message));
      await touch.goto(origin);await touch.locator('[data-tech-stack][data-capacity="3"]').waitFor();
      await touch.locator('[data-tech-window]').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
      const box=await touch.locator('[data-tech-window]').boundingBox();
      const client=await context.newCDPSession(touch);
      const x=box.x+box.width*.8,y=box.y+box.height/2;
      const previous=await touch.locator('[data-tech-stack]').getAttribute('data-page');
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let step=1;step<=5;step++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-step*24,y}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await touch.waitForFunction(old=>document.querySelector('[data-tech-stack]').dataset.page!==old,previous);
      const scroll=await touch.evaluate(()=>scrollY);
      await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
      for(let step=1;step<=5;step++)await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*24}]});
      await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await touch.waitForFunction(old=>scrollY>old+20,scroll);
      await client.detach();
    }finally{await context.close()}
    results.push({touchSwipe:true,verticalScroll:true});
    assert(errors.length===0,errors.join('\n'));
    return {results,errors};
  }catch(error){await page.screenshot({path:'.playwright-cli/home-interactions-failure.png'});throw error}
  finally{await page.close()}
}
