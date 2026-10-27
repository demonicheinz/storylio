// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page=await sessionPage.context().newPage();
  const origin=new URL(sessionPage.url()).origin;
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const results=[];
  let step='start';
  const carousel=()=>page.getByRole('region',{name:'Project screenshots',exact:true});
  const index=()=>page.locator('[data-depth-carousel]').getAttribute('data-current-index');
  const settled=()=>page.waitForFunction(()=>!document.documentElement.classList.contains('lenis-scrolling'));
  try {
    for(const reducedMotion of ['no-preference','reduce']) {
      await page.emulateMedia({reducedMotion});
      for(const width of [1440,1024,768,390,320]) {
        step=`${width}/${reducedMotion}: load`;
        await page.setViewportSize({width,height:1000});
        await page.goto(origin+'/projects/storylio');await carousel().waitFor();
        await page.evaluate(()=>document.fonts.ready);
        await carousel().scrollIntoViewIfNeeded();await settled();
        const geometry=await carousel().evaluate(root=>{
          const stage=root.querySelector('[data-depth-carousel]');
          const active=stage.querySelector('[data-depth="0"]');
          const s=getComputedStyle(active),matrix=new DOMMatrixReadOnly(s.transform);
          const controlSizes=[...root.querySelectorAll('button')].map(el=>({label:el.getAttribute('aria-label'),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height}));
          const image=active.querySelector('img'),imageBox=image.getBoundingClientRect(),frame=active.getBoundingClientRect(),nav=root.querySelector('button[aria-label="Next screenshot"]').parentElement;
          return {width:innerWidth,height:root.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth+1,images:root.querySelectorAll('img').length,fit:getComputedStyle(image).objectFit,imageFillsFrame:Math.abs(imageBox.width-frame.width)<1&&Math.abs(imageBox.height-frame.height)<1,radius:getComputedStyle(image).borderRadius,background:s.backgroundColor,border:s.borderWidth,controlsCentered:Math.abs((nav.getBoundingClientRect().left+nav.getBoundingClientRect().right)/2-(root.getBoundingClientRect().left+root.getBoundingClientRect().right)/2)<1,visibleCaptions:root.querySelectorAll('p:not([role="status"])').length,flat:Math.abs(matrix.m13)<.001&&Math.abs(matrix.m31)<.001&&Math.abs(matrix.m11-1)<.001,controls:controlSizes,touchAction:getComputedStyle(stage).touchAction,transition:s.transitionDuration};
        });
        assert(!geometry.overflow&&geometry.flat&&geometry.fit==='contain','Active image distorted: '+JSON.stringify(geometry));
        assert(geometry.imageFillsFrame&&geometry.controlsCentered&&geometry.visibleCaptions===0,'Image sizing or controls differ: '+JSON.stringify(geometry));
        assert(geometry.radius==='8px','Screenshot corners should be 8px');
        assert(geometry.controls.every(control=>control.w>=43.99&&control.h>=43.99),'Small control: '+JSON.stringify(geometry));
        assert(geometry.touchAction==='pan-y','Vertical touch scrolling blocked');
        if(reducedMotion==='reduce')assert(geometry.transition.split(',').every(value=>parseFloat(value)===0),'Reduced motion animates');
        step=`${width}/${reducedMotion}: next`;
        await carousel().getByRole('button',{name:'Next screenshot',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='1');
        assert(await carousel().getByRole('status').getAttribute('aria-label')==='Screenshot 2 of 3','Counter not updated');
        const next=carousel().getByRole('button',{name:'Next screenshot',exact:true});
        await next.focus();await page.keyboard.press('End');assert(await index()==='2','End key failed');
        await page.keyboard.press('Home');assert(await index()==='0','Home key failed');
        await page.keyboard.press('ArrowLeft');assert(await index()==='2','Keyboard wrap failed');
        await page.keyboard.press('ArrowRight');assert(await index()==='0','ArrowRight failed');
        // Real pointer drag must select the next frame without opening its lightbox.
        step=`${width}/${reducedMotion}: drag`;
        const open=carousel().getByRole('button',{name:'Open Storylio screenshot 1',exact:true});
        await open.scrollIntoViewIfNeeded();await settled();
        const box=await open.boundingBox();
        await page.mouse.move(box.x+box.width*.75,box.y+box.height*.5);await page.mouse.down();
        await page.mouse.move(box.x+box.width*.25,box.y+box.height*.5,{steps:8});await page.mouse.up();
        await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='1');
        assert(await page.getByRole('dialog',{name:'Lightbox',exact:true}).count()===0,'Swipe opened lightbox');
        step=`${width}/${reducedMotion}: lightbox`;
        const selected=carousel().getByRole('button',{name:'Open Storylio screenshot 2',exact:true});
        await selected.click();await page.getByRole('dialog',{name:'Lightbox',exact:true}).waitFor();
        await page.getByRole('button',{name:'Next',exact:true}).click();
        await page.waitForFunction(()=>document.querySelector('[data-depth-carousel]').dataset.currentIndex==='2');
        await page.keyboard.press('Escape');await page.getByRole('dialog',{name:'Lightbox',exact:true}).waitFor({state:'hidden'});
        const active=carousel().getByRole('button',{name:'Open Storylio screenshot 3',exact:true});
        assert(await active.evaluate(el=>el===document.activeElement),'Focus not restored to active frame');
        step=`${width}/${reducedMotion}: wheel`;
        await carousel().scrollIntoViewIfNeeded();await settled();
        const before={index:await index(),y:await page.evaluate(()=>scrollY)};
        await active.hover();await page.mouse.wheel(0,180);
        await page.waitForFunction(y=>scrollY>y+50,before.y);
        assert(await index()===before.index,'Vertical wheel changed screenshot');
        results.push({reducedMotion,...geometry,keyboard:true,drag:true,lightbox:true,verticalWheel:true});
        if(reducedMotion==='no-preference'&&(width===1440||width===390)) {
          await carousel().getByRole('button',{name:'Next screenshot',exact:true}).click();
          await page.locator('#project-screenshots').scrollIntoViewIfNeeded();await settled();
          await page.waitForTimeout(500);
          await page.locator('section[aria-labelledby="project-screenshots"]').screenshot({path:'task/project-depth-carousel/carousel-'+width+'.png'});
        }
      }
    }
    assert(!errors.length,errors.join('\n'));
    return {results,errors};
  } catch(error) {
    error.message+='\nStage: '+step+'\n'+JSON.stringify(await page.evaluate(()=>({y:scrollY,focus:document.hasFocus(),index:document.querySelector('[data-depth-carousel]')?.dataset.currentIndex,dialog:!!document.querySelector('[role="dialog"]'),classes:document.documentElement.className})));
    throw error;
  } finally {await page.close()}
}
