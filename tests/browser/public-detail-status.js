// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin=new URL(page.url()).origin;
  const results=[];
  for(const group of ['blog','projects']) {
    const missing=`/${group}/missing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    for(const headers of [{}, {rsc:'1', 'next-router-prefetch':'1'}]) {
      const response=await page.request.get(`${origin}${missing}`,{headers});
      const body=await response.text();
      if(response.status()!==404)throw new Error(`${missing}: expected 404, got ${response.status()}`);
      if(response.headers()['x-robots-tag']!=='noindex, nofollow')throw new Error('Missing noindex header');
      if(!response.headers()['cache-control']?.includes('no-store'))throw new Error('Missing content response can be cached');
      if(headers.rsc && !response.headers()['content-type']?.includes('text/x-component'))throw new Error('RSC rewrite returned HTML');
      if(!headers.rsc && !body.includes('This page drifted out of view.'))throw new Error('Missing branded 404 HTML');
      results.push({path:missing,mode:headers.rsc?'rsc-prefetch':'html',status:response.status()});
    }
    const head=await page.request.head(`${origin}${missing}`);
    if(head.status()!==404)throw new Error('HEAD lost 404');
    const response=await page.goto(`${origin}${missing}`);
    if(response.status()!==404)throw new Error('Browser lost HTTP 404');
    await page.getByRole('heading',{name:'This page drifted out of view.'}).waitFor();
    if(new URL(page.url()).pathname!==missing)throw new Error('404 changed the requested URL');
    await page.getByRole('link',{name:'Back to home',exact:true}).click();
    await page.waitForURL(`${origin}/`);

    await page.goto(`${origin}/${group}`);
    await page.locator('[aria-label="Loading page"]').waitFor({state:'hidden'});
    const published=await page.locator(`a[href^="/${group}/"]`).evaluateAll(links=>[...new Set(links.map(link=>link.getAttribute('href')))]);
    if(published.length) {
      const valid=await page.request.get(new URL(published[0],origin).href);
      if(valid.status()!==200)throw new Error(`Published content returned ${valid.status()}`);
      results.push({path:published[0],mode:'published',status:valid.status()});
    } else {
      results.push({group,mode:'published',skipped:'No published links in this environment'});
    }
    await page.waitForFunction(()=>!!window.next?.router);
    await page.evaluate(path=>window.next.router.push(path),missing);
    await page.waitForURL(url=>url.pathname===missing);
    await page.getByRole('heading',{name:'This page drifted out of view.'}).waitFor();
    results.push({group,mode:'client-navigation',notFound:true});
  }
  return results;
}
