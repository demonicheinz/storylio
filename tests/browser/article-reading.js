// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const page=await sessionPage.context().newPage(),origin=new URL(sessionPage.url()).origin;
  const assert=(value,message)=>{if(!value)throw Error(message)};const results=[];
  try {
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const width of [1440,1024,768,390,320]) {
      await page.setViewportSize({width,height:1000});await page.goto(origin+'/blog/building-storylio-with-server-first-pages');
      await page.getByRole('region',{name:'Article content',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
      const data=await page.evaluate(()=>{
        const body=document.querySelector('.storylio-article-content'),p=body.querySelector('p'),header=document.querySelector('article header'),meta=header.parentElement.querySelector('time').closest('[class*="meta"]'),cover=header.parentElement.querySelector('img');
        const box=el=>el?.getBoundingClientRect();return {width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,bodyFont:getComputedStyle(p).fontSize,textWidth:box(p).width,coverTop:box(cover)?.top,coverBottom:box(cover)?.bottom,metaTop:box(meta)?.top,copy:box(body.querySelector('[data-heading-link]'))?.height};
      });
      assert(!data.overflow&&data.textWidth<=641,'Article reading measure: '+JSON.stringify(data));
      assert(data.bodyFont===(width<768?'16px':'18px')&&data.copy>=43.99,'Type or copy target changed');
      if(width<768)assert(data.coverBottom<=data.metaTop,'Mobile metadata precedes cover');
      const toggle=page.getByRole('button',{name:'On this page',exact:true});
      const toc=page.getByRole('navigation',{name:'Article table of contents',exact:true});
      if(width<1200) {await toggle.click();await toc.waitFor();}
      const last=toc.getByRole('button').last();await last.click();
      await page.waitForFunction(()=>document.activeElement?.id===decodeURIComponent(location.hash.slice(1))&&Math.abs(document.activeElement.getBoundingClientRect().top-112)<3);
      const row=await toc.getByRole('button').first().evaluate(button=>{const center=el=>{const b=el.getBoundingClientRect();return b.top+b.height/2};return {text:getComputedStyle(button).textAlign,label:center(button.children[1])-center(button),marker:center(button.children[0])-center(button),gap:getComputedStyle(button.closest('ol')).rowGap}});
      assert(row.text==='left'&&Math.abs(row.label)<1&&Math.abs(row.marker)<1&&row.gap==='4px','TOC alignment differs');
      if(width===1440||width===390) {await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'task/writing-notes/article-'+width+'.png'});}
      results.push(data);
    }
    const missing=await page.request.get(origin+'/blog/nonexistent-article-reading-fixture');assert(missing.status()===404,'Missing article lost HTTP 404');
    return {results,anchors:true,toc:true,http404:true};
  } finally {await page.close()}
}
