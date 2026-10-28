// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const page=await sessionPage.context().newPage();
  const origin=new URL(sessionPage.url()).origin;
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const results=[];
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const [width,height] of [[1440,1000],[1024,900],[768,1024],[390,844],[320,740],[844,390]]) {
      await page.setViewportSize({width,height});
      await page.goto(origin+'/projects/storylio');
      await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);
      const geometry=await page.evaluate(()=>{
        const main=document.querySelector('main[data-public-page="project-detail"]');
        const cover=main.querySelector('img[alt="Storylio"]').parentElement.getBoundingClientRect();
        const facts=main.querySelector('dl').getBoundingClientRect();
        const prose=main.querySelector('[data-has-toc] > div');
        const p=prose.querySelector('p');const copy=prose.querySelector('[data-heading-link]').getBoundingClientRect();
        const heading=document.getElementById('implementation-detail');
        const span=heading.querySelector('span');const node=span.firstChild;
        const range=document.createRange();range.setStart(node,0);range.setEnd(node,'Implementation'.length);
        const layout=main.querySelector('[data-has-toc]'),toc=layout.querySelector(':scope > aside'),firstHeading=layout.querySelector(':scope > div > h2');
        return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,coverTop:cover.top,coverBottom:cover.bottom,factsTop:facts.top,paragraphWidth:p.getBoundingClientRect().width,paragraphFont:parseFloat(getComputedStyle(p).fontSize),copy:[copy.width,copy.height],headingWordLines:range.getClientRects().length,tocItemGap:parseFloat(getComputedStyle(toc.querySelector('ol')).rowGap),tocHeadingGap:firstHeading.getBoundingClientRect().top-toc.getBoundingClientRect().bottom};
      });
      assert(!geometry.overflow,'Horizontal overflow: '+width);
      assert(geometry.tocItemGap===4,'TOC items are too far apart: '+width);
      if(width<1200)assert(Math.abs(geometry.tocHeadingGap-32)<1,'TOC touches the next heading: '+JSON.stringify(geometry));
      assert(geometry.copy.every(value=>value>=43.99),'Copy target below 44px: '+width);
      if(width<768) {
        assert(geometry.coverTop<600&&geometry.factsTop>=geometry.coverBottom,'Mobile cover does not precede facts: '+JSON.stringify(geometry));
        assert(geometry.headingWordLines===1,'Implementation word still breaks on mobile: '+width);
      } else assert(geometry.paragraphWidth<=641,'Reading measure exceeds 640px: '+JSON.stringify(geometry));
      const toggle=page.getByRole('button',{name:'On this page',exact:true});
      const toc=page.getByRole('navigation',{name:'Project case study table of contents'});
      if(width<1200) {
        assert(await toggle.isVisible(),'Missing mobile/tablet TOC: '+width);
        assert(!await toc.isVisible(),'TOC initially expanded');
        await toggle.focus();await page.keyboard.press('Enter');await toc.waitFor();
        await toc.getByRole('button',{name:'Overview',exact:true}).focus();await page.keyboard.press('Escape');
        assert(!await toc.isVisible()&&await toggle.evaluate(el=>el===document.activeElement),'Escape did not close and restore disclosure focus');
        await toggle.click();
      } else assert(!await toggle.isVisible()&&await toc.isVisible(),'Desktop TOC changed');
      const row=await toc.getByRole('button').first().evaluate(button=>{
        const center=el=>{const box=el.getBoundingClientRect();return box.top+box.height/2};
        return {label:center(button.children[1])-center(button),marker:center(button.children[0])-center(button),textAlign:getComputedStyle(button).textAlign};
      });
      assert(Math.abs(row.label)<1&&Math.abs(row.marker)<1&&row.textAlign==='left','TOC row is not vertically centered: '+JSON.stringify(row));
      await toc.getByRole('button',{name:'Outcome',exact:true}).click();
      const anchor=await page.evaluate(()=>({hash:location.hash,focused:document.activeElement?.id,top:document.getElementById('outcome').getBoundingClientRect().top}));
      assert(anchor.hash==='#outcome'&&anchor.focused==='outcome'&&Math.abs(anchor.top-112)<3,'Incorrect anchor: '+JSON.stringify(anchor));
      if(width===1440||width===390) {
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        await page.screenshot({path:'task/project-detail-polish/desktop-mobile-'+width+'.png'});
      }
      results.push({...geometry,toc:true,anchor:true});
    }
    await page.setViewportSize({width:320,height:740});
    const screenshot=page.getByRole('button',{name:'Open Storylio screenshot 1',exact:true});
    await screenshot.focus();await page.keyboard.press('Enter');
    await page.getByRole('button',{name:'Close',exact:true}).waitFor();
    const lightbox=await page.locator('.yarl__container').evaluate(el=>({background:getComputedStyle(el).backgroundColor,overflow:getComputedStyle(document.body).overflow}));
    assert(lightbox.overflow==='hidden'&&!/rgba\([^)]*,\s*0\)/.test(lightbox.background),'Lightbox scroll/backdrop invalid');
    await page.waitForFunction(()=>{const image=document.querySelector('.yarl__slide_current img');return image?.complete&&image.naturalWidth>0});
    await page.screenshot({path:'task/project-detail-polish/lightbox-320.png'});
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'Close',exact:true}).waitFor({state:'hidden'});
    assert(await screenshot.evaluate(el=>el===document.activeElement),'Lightbox focus not restored');
    await page.setViewportSize({width:1440,height:1000});
    const navigation=page.getByRole('navigation',{name:'Project navigation'});
    const navSize=await navigation.boundingBox();const linkSize=await navigation.locator('a').boundingBox();
    assert(linkSize.width>=navSize.width-1,'Single next project leaves empty column');
    const normalMotion=[];
    await page.emulateMedia({reducedMotion:'no-preference'});
    for(const width of [1440,390]) {
      await page.setViewportSize({width,height:900});await page.goto(origin+'/projects/storylio');await page.locator('h1').waitFor();
      await page.evaluate(()=>document.fonts.ready);
      await page.waitForFunction(()=>document.hasFocus()&&document.documentElement.classList.contains('lenis'));
      const toggle=page.getByRole('button',{name:'On this page',exact:true});if(await toggle.isVisible())await toggle.click();
      const outcome=page.getByRole('navigation',{name:'Project case study table of contents'}).getByRole('button',{name:'Outcome',exact:true});
      await outcome.scrollIntoViewIfNeeded();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await outcome.click();
      await page.waitForFunction(()=>Math.abs(document.getElementById('outcome').getBoundingClientRect().top-112)<3);
      await page.waitForFunction(()=>document.querySelector('nav[aria-label="Project case study table of contents"] [aria-current]')?.textContent.trim()==='Outcome');
      normalMotion.push({width,anchor:true,activeSection:true});
    }
    assert(!errors.length,errors.join('\n'));
    return {results,normalMotion,lightbox,focusRestored:true,singleNeighborFullWidth:true,errors};
  } finally {await page.close()}
}
