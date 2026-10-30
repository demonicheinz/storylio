// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const page=await sessionPage.context().newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  let stage='intro';
  try{
    await page.addInitScript(()=>{
      window.__venomDraws=0;
      const draw=WebGL2RenderingContext.prototype.drawArrays;
      WebGL2RenderingContext.prototype.drawArrays=function(...args){
        if(this.canvas.dataset.venomCanvas)window.__venomDraws++;
        return draw.apply(this,args);
      };
    });
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(origin,{waitUntil:'domcontentloaded'});
    await page.locator('[data-home-hero]').waitFor();
    const timing=await page.locator('[data-blur-word]').first().evaluate(el=>{
      const s=getComputedStyle(el);
      return {duration:s.animationDuration,delay:s.animationDelay,frames:el.getAnimations()[0]?.effect.getKeyframes()};
    });
    // Inspect the CSS definition as hydration may complete after the entrance.
    const wordTiming=await page.evaluate(()=>{
      const word=document.querySelector('[data-blur-word]');
      return {delay:word.style.getPropertyValue('--blur-delay'),count:document.querySelectorAll('[data-blur-word]').length};
    });
    assert(wordTiming.delay==='0.35s'&&wordTiming.count>1,'Word timing is not staggered');
    await page.waitForFunction(()=>document.querySelector('[data-home-hero]').dataset.introComplete==='true');
    const settled=await page.locator('[data-home-hero]').evaluate(el=>({text:el.querySelector('h1').textContent,links:el.querySelectorAll('a').length,finiteAnimations:el.getAnimations({subtree:true}).filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)&&a.playState==='running').length}));
    assert(settled.text==='I’m Heinz. I build web apps.'&&settled.links===1,'Hero content changed');
    assert(settled.finiteAnimations===0,'Intro did not finish within its bounded sequence');
    await page.locator('[data-gravity-stars] canvas').waitFor({state:'attached'});
    const stars=await page.locator('[data-gravity-stars] canvas').evaluate(el=>{
      const pixels=el.getContext('2d').getImageData(0,0,el.width,el.height).data;
      let opaque=0,max=0;
      for(let i=3;i<pixels.length;i+=4){if(pixels[i]>100)opaque++;max=Math.max(max,pixels[i]);}
      const host=el.closest('[data-gravity-stars]');
      return {opaque,max,count:el.dataset.starCount,opacity:Number(getComputedStyle(host).opacity),heroLocal:host.parentElement.hasAttribute('data-home-hero')};
    });
    assert(stars.count==='40'&&stars.opaque>10&&stars.max>160&&stars.opacity>=.8&&stars.heroLocal,'Stars are still hidden under the scrim or lack visible cores');
    await page.screenshot({path:'.playwright-cli/hero-entrance-desktop.png'});
    stage='visible pause';
    await page.waitForFunction(()=>document.querySelector('[data-venom-canvas]')?.dataset.venomState==='running');
    const canvas=await page.locator('[data-venom-canvas]').elementHandle();
    await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
    await page.waitForFunction(()=>document.querySelector('[data-venom-canvas]').dataset.venomState==='paused-visible');
    const draws=await page.evaluate(()=>window.__venomDraws);
    await page.waitForTimeout(150);
    assert(await page.evaluate(()=>window.__venomDraws)===draws,'Paused Venom still renders');
    assert(await page.locator('[data-venom-link]').getAttribute('data-venom-ready')==='true','Blur swaps Venom for the CSS button');
    assert(await page.locator('[data-venom-still]').evaluate(el=>getComputedStyle(el).opacity)==='1','Blur hides the Venom material');
    await page.screenshot({path:'.playwright-cli/hero-entrance-paused.png'});
    const resumeFrames=await page.evaluate(async()=>{
      window.dispatchEvent(new Event('focus'));
      const frames=[];
      for(let i=0;i<24;i++){
        await new Promise(requestAnimationFrame);
        const canvas=document.querySelector('[data-venom-canvas]');
        const still=document.querySelector('[data-venom-still]');
        frames.push({opacity:Number(getComputedStyle(canvas).opacity),stillOpacity:still?Number(getComputedStyle(still).opacity):0});
      }
      return frames;
    });
    assert(resumeFrames.every(frame=>frame.opacity===1||frame.stillOpacity===1),'Resume has a transparent gap between the retained frame and WebGL');
    await page.waitForFunction(()=>document.querySelector('[data-venom-canvas]').dataset.venomState==='running');
    assert(await canvas.evaluate(el=>el===document.querySelector('[data-venom-canvas]')),'Focus recreated canvas');
    await page.evaluate(()=>window.scrollTo({top:innerHeight*2,behavior:'instant'}));
    await page.waitForFunction(()=>document.querySelector('[data-venom-canvas]').dataset.venomState==='paused-hidden');
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await page.waitForFunction(()=>document.querySelector('[data-venom-canvas]').dataset.venomState==='running');
    assert(await page.locator('[data-home-hero]').getAttribute('data-intro-complete')==='true','Scroll replays intro');

    stage='mobile';
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>document.querySelector('[data-gravity-stars] canvas').dataset.starCount==='24');
    await page.screenshot({path:'.playwright-cli/hero-entrance-mobile.png'});
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>!document.querySelector('[data-venom-canvas]'));
    assert(await page.locator('[data-blur-word]').evaluateAll(words=>words.every(el=>getComputedStyle(el).animationName==='none')),'Reduced motion keeps intro');
    const cta=page.locator('[data-venom-link]');
    await cta.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>Math.abs(document.getElementById('selected-projects').getBoundingClientRect().top)<2);
    assert(errors.length===0,errors.join('\n'));
    return {timing,wordTiming,stars,resumeFrames,visiblePausedMaterial:true,pausedRenderingStopped:true,sameCanvas:true,offscreenHidden:true,noReplay:true,mobile:true,reducedMotion:true,cta:true,errors};
  }catch(error){await page.screenshot({path:'.playwright-cli/hero-entrance-failure.png'});error.message+='\nStage: '+stage;throw error}
  finally{await page.close()}
}
