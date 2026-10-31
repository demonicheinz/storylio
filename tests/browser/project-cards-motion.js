// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const page=await sessionPage.context().newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  try{
    await page.setViewportSize({width:1440,height:1000});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(`${origin}/projects`);await page.locator('[data-project-card]').first().waitFor();await page.evaluate(()=>document.fonts.ready);
    // Measure tilt after the route/reveal entrance has reached its final position.
    await page.waitForTimeout(700);
    const card=page.locator('[data-project-card]').first();const title=card.locator('h2');
    const before=await title.boundingBox();const box=await card.boundingBox();
    await page.mouse.move(box.x+box.width*.85,box.y+box.height*.15,{steps:8});
    await card.locator('[data-tilt-active]').waitFor({state:'attached'});await page.waitForTimeout(400);
    const tilt=await card.locator('[data-tilted-cover] > div').evaluate(el=>el.style.transform);
    assert(/rotate[XY]\(/.test(tilt)&&!tilt.includes('rotateX(0deg) rotateY(0deg)'),'Cover tilt did not run');
    const after=await title.boundingBox();assert(Math.abs(before.x-after.x)<1&&Math.abs(before.y-after.y)<1,'Text moves with cover');
    const flow=card.locator('[data-flow-button]');
    const size=await flow.boundingBox();assert(size.height>=44,'Flow CTA too small');
    assert(await flow.evaluate(el=>getComputedStyle(el).borderRadius)==='8px','Flow CTA is pill-shaped');
    await flow.hover();await page.waitForTimeout(500);
    const hovered=await flow.evaluate(el=>({radius:getComputedStyle(el).borderRadius,color:getComputedStyle(el).color,arrow:getComputedStyle(el.querySelector('svg')).opacity}));
    assert(hovered.radius==='8px'&&hovered.arrow==='1','Flow hover animation did not complete');
    const hoverSize=await flow.boundingBox();assert(Math.abs(hoverSize.width-size.width)<1,'Flow hover shifts layout');
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-tilted-cover] > div')).transform==='none');
    assert(await flow.evaluate(el=>getComputedStyle(el.firstElementChild).transitionDuration)==='0s','Reduced motion animates Flow sweep');
    await page.mouse.move(1,1);await flow.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
    assert(await flow.evaluate(el=>el.matches(':focus-visible')),'No visible keyboard focus');
    await page.screenshot({path:'.playwright-cli/project-cards-uniform-desktop.png'});
    await page.setViewportSize({width:390,height:844});await page.goto(`${origin}/projects`);
    await page.locator('[data-project-card]').first().waitFor();await page.screenshot({path:'.playwright-cli/project-cards-uniform-mobile.png'});
    assert(await page.getByRole('navigation',{name:'Project pages',exact:true}).count()===0,'Pagination should hide for three projects');
    await page.goto(`${origin}/projects?page=999&keep=page-test`);await page.locator('[data-project-card]').first().waitFor();
    assert(await page.locator('[data-project-card]').count()===3,'Out of range page did not clamp to available results');
    await page.getByRole('button',{name:'Filter stack',exact:true}).click();await page.getByRole('combobox',{name:'Search technologies'}).fill('Next.js');
    await page.getByRole('option',{name:'Next.js',exact:true}).click();await page.waitForURL(url=>url.searchParams.has('tech')&&!url.searchParams.has('page'));
    assert(new URL(page.url()).searchParams.get('keep')==='page-test','Filtering removed unrelated query');
    assert(!errors.length,errors.join('\n'));
    return{tilt:true,textStable:true,flowHover:true,fixedRadius:true,reducedMotion:true,keyboard:true,smallCollectionPaginationHidden:true,pageClamp:true,filterResetsPage:true,errors};
  }finally{await page.close()}
}
