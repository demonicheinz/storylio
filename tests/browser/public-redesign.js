// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage => {
  const origin=new URL(sessionPage.url()).origin;
  const page=await sessionPage.context().newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const assert=(value,message)=>{if(!value)throw new Error(message)};
  const results=[];
  let stage='collections';
  try{
    await page.emulateMedia({reducedMotion:'reduce'});
    for(const [path,grid]of[['/projects','[data-project-grid]'],['/blog','[data-post-grid]'],['/gallery',null],['/about',null]]){
      await page.setViewportSize({width:1440,height:1000});
      await page.goto(origin+path);
      await page.locator('h1').waitFor();await page.locator('[data-public-footer]').waitFor();
      assert(await page.locator('footer').count()===1,'Duplicate footer on '+path);
      assert(await page.locator('main').count()===1,'Public route needs one main landmark: '+path);
      assert(await page.locator('html.lenis').count()===0,'Reduced motion enabled Lenis on '+path);
      assert(await page.getByRole('button',{name:'Scroll to top',exact:true}).count()===0,'Duplicate top control');
      if(grid&&await page.locator(grid).count())assert(await page.locator(grid).evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length)===3,'Desktop archive does not have three columns');
      results.push({path,sharedFooter:true,nativeScroll:true});
    }
    stage='project detail';
    await page.goto(origin+'/projects/storylio');await page.locator('h1').waitFor();
    const toc=page.getByRole('navigation',{name:'Project case study table of contents'});
    if(await toc.count()){
      await toc.getByRole('button').first().click();
      await page.waitForFunction(()=>location.hash.length>1);
      assert(await page.evaluate(()=>document.getElementById(decodeURIComponent(location.hash.slice(1))).getBoundingClientRect().top>=0),'TOC target is above the viewport');
    }
    const shot=page.getByRole('button',{name:/^Open /}).first();
    let projectLightbox=false;
    if(await shot.count()){
      await shot.click();await page.getByRole('button',{name:'Close',exact:true}).waitFor();
      await page.keyboard.press('Escape');await page.getByRole('button',{name:'Close',exact:true}).waitFor({state:'hidden'});projectLightbox=true;
    }
    results.push({projectDetail:true,toc:await toc.count()>0,projectLightbox});

    stage='article';
    await page.goto(origin+'/blog');
    const href=await page.getByRole('link',{name:'Read article',exact:true}).first().getAttribute('href');
    await page.goto(origin+href);await page.locator('h1').waitFor();
    assert(await page.getByRole('region',{name:'Article content'}).innerText(),'Article body is empty');
    assert(await page.getByRole('button',{name:'Copy link',exact:true}).count()===1,'Article share action missing');
    results.push({article:href,body:true,share:true});

    stage='gallery lightbox';
    await page.goto(origin+'/gallery?keep=redesign');
    const filter=page.getByRole('navigation',{name:'Filter gallery by category'});
    const category=filter.getByRole('button').nth(1);const name=await category.innerText();await category.click();
    await page.waitForURL(url=>url.searchParams.get('category')===name);
    assert(new URL(page.url()).searchParams.get('keep')==='redesign','Gallery lost unrelated query');
    const photo=page.locator('[data-gallery-photo]').first();await photo.click();
    await page.getByRole('button',{name:'Close',exact:true}).waitFor();
    await page.keyboard.press('Escape');await page.getByRole('button',{name:'Close',exact:true}).waitFor({state:'hidden'});
    results.push({galleryFilter:true,galleryLightbox:true});

    stage='empty filters';
    for(const [path,query]of[['/projects','tech'],['/blog','tag'],['/gallery','category']]){
      await page.goto(origin+path+'?'+query+'=redesign-missing-filter');
      await page.getByRole('heading',{level:2,name:/No projects|No posts|No frames/}).waitFor();
      assert(await page.locator('h1').count()===1,'Empty filter lost the page heading');
    }
    stage='cold missing HTTP status';
    const missing=[];
    for(const path of ['/projects/redesign-missing-'+Date.now(),'/blog/redesign-missing-'+Date.now(),'/redesign-missing-'+Date.now()]){
      const response=await page.request.get(origin+path);
      missing.push({path,status:response.status()});assert(response.status()===404,'Missing route did not return HTTP 404: '+JSON.stringify(missing));
    }
    assert(errors.length===0,errors.join('\n'));
    return {passed:true,results,emptyFilters:true,missing,errors};
  }catch(error){error.message+='\nStage: '+stage;throw error}
  finally{await page.close()}
}
