// biome-ignore format: Playwright CLI requires a function expression without a trailing semicolon.
async (page) => {
  const origin = new URL(page.url()).origin;
  const exceptions = [];
  const prefetchWarnings = [];
  const navigations = [];
  const onError = error => exceptions.push(error.message);
  const onConsole = message => {
    const text = message.text();
    if (/Next\.js encountered (?:runtime|uncached|dynamic|URL) data|instant-link-prefetch-partial|instant-shell-url-data|blocking-prerender/i.test(text)) prefetchWarnings.push(text);
  };
  const onRequest = request => {
    if(request.isNavigationRequest() && request.resourceType() === 'document') navigations.push(request.url());
  };
  page.on('pageerror', onError);
  page.on('console', onConsole);
  page.on('request', onRequest);
  const nav = (target = page) => target.getByRole('navigation', {name:'Main navigation',exact:true});
  const select = async (name, path, target = page) => {
    await target.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    await nav(target).getByRole('link',{name,exact:true}).click();
    await target.waitForURL(url=>url.pathname === path);
    await target.waitForFunction(href => document.querySelector('nav[aria-label="Main navigation"] a[aria-current="page"]')?.getAttribute('href') === href, path);
    await target.locator('[aria-label="Loading page"]').waitFor({state:'hidden'});
  };
  const state = async (target = page) => nav(target).evaluate(el => {
    const links=[...el.querySelectorAll('a')];
    const rect=el.getBoundingClientRect();
    return {active:links.filter(a=>a.getAttribute('aria-current')==='page').map(a=>a.getAttribute('href')),links:links.map(a=>({label:a.getAttribute('aria-label'),width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height})),width:rect.width,left:rect.left,right:rect.right,viewport:innerWidth,canvas:getComputedStyle(el.querySelector('canvas')).display,fallback:getComputedStyle(el.querySelector('canvas + span')).display,pill:getComputedStyle(el).getPropertyValue('--gn-pill').trim(),overlay:getComputedStyle(el.querySelector('ul[aria-hidden]')).clipPath};
  });
  const results=[];
  try {
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(origin);
    await nav().waitFor({state:'visible'});
    await page.evaluate(()=>window.__gooeyClientNavigation = true);
    const documentsBefore = navigations.length;
    for(const [name,path] of [['About','/about'],['Projects','/projects'],['Blog','/blog'],['Gallery','/gallery'],['Home','/']]) {
      await select(name,path);
      const snapshot=await state();
      if(snapshot.active.length!==1||snapshot.active[0]!==path)throw new Error(`Wrong active route: ${JSON.stringify(snapshot)}`);
      results.push({path,active:snapshot.active});
    }
    if(!await page.evaluate(()=>window.__gooeyClientNavigation))throw new Error('Navigation reloaded the document');
    if(navigations.length!==documentsBefore)throw new Error('Navbar issued document navigation');
    await page.goBack();
    await page.waitForURL(url=>url.pathname==='/gallery');
    await page.waitForFunction(()=>document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')==='/gallery');
    await page.goForward();
    await page.waitForURL(url=>url.pathname==='/');
    await page.waitForFunction(()=>document.querySelector('nav a[aria-current="page"]')?.getAttribute('href')==='/');

    await page.goto(`${origin}/projects/storylio`);
    await nav().getByRole('link',{name:'Projects',exact:true}).waitFor();
    if((await state()).active[0]!=='/projects')throw new Error('Project detail did not select Projects');
    await page.reload();
    await nav().waitFor();
    if((await state()).active[0]!=='/projects')throw new Error('Refresh lost active route');

    await page.goto(origin);
    await nav().waitFor();
    await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
    for(const [label,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,720]]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(()=>{
        const el=document.querySelector('nav[aria-label="Main navigation"]');
        const active=el.querySelector('a[aria-current="page"]');
        const overlay=el.querySelector('ul[aria-hidden]');
        return active&&getComputedStyle(overlay).visibility==='visible';
      });
      const snapshot=await state();
      const content = await nav().evaluate(el => [...el.querySelectorAll('a')].map(a => ({
        labelVisible: a.lastElementChild.getBoundingClientRect().width > 0,
        iconVisible: a.querySelector('svg').getBoundingClientRect().width > 0,
      })));
      if(content.some(item => !item.labelVisible || item.iconVisible !== (width >= 640))) throw new Error('Wrong mobile/desktop navigation content');
      if(snapshot.left<0||snapshot.right>width||snapshot.links.some(a=>a.width<44||a.height<44))throw new Error(`Invalid targets at ${width}: ${JSON.stringify(snapshot)}`);
      if(snapshot.links.length!==5||snapshot.links.some(a=>!a.label))throw new Error('Missing link name');
      await page.screenshot({path:`.tmp/gooey-navigation/${label}.png`});
      results.push({label,...snapshot});
    }

    await page.setViewportSize({width:1440,height:1000});
    await page.evaluate(()=>document.documentElement.classList.remove('dark'));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav')).getPropertyValue('--gn-pill').trim()==='#000b27');
    results.push({theme:'light',...await state()});
    await page.screenshot({path:'.tmp/gooey-navigation/light.png'});
    await page.evaluate(()=>document.documentElement.classList.add('dark'));
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav')).getPropertyValue('--gn-pill').trim()==='#f2fbfe');

    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav canvas')).display==='none');
    await select('About','/about');
    const reduced=await state();
    if(reduced.fallback!=='block')throw new Error('Reduced motion did not use a static pill');
    results.push({mode:'reduced-motion',...reduced});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav canvas')).display==='block');

    await page.goto(origin);
    await nav().waitFor();
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.mouse.move(900,700);
    await page.mouse.wheel(0,1400);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav').parentElement).opacity==='0');
    await page.mouse.wheel(0,-150);
    await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav').parentElement).opacity==='1');
    await page.keyboard.press('Tab');
    const focused=await page.evaluate(()=>!!document.querySelector('nav :focus-visible'));
    if(!focused){await nav().getByRole('link',{name:'Home',exact:true}).focus();}
    if(!await nav().getByRole('link',{name:'Home',exact:true}).evaluate(el=>getComputedStyle(el).outlineStyle!=='none')){
      // The first Tab may have focused another navbar link.
      const outline=await page.evaluate(()=>{const el=document.querySelector('nav :focus-visible');return el&&getComputedStyle(el).outlineStyle!=='none'});
      if(!outline)throw new Error('Keyboard focus is not visible');
    }

    const contextLossSupported=await page.evaluate(()=>{
      const canvas=document.querySelector('nav canvas');
      const gl=canvas.getContext('webgl2');
      window.__gooeyLostContext=gl?.getExtension('WEBGL_lose_context');
      if(!window.__gooeyLostContext)return false;
      window.__gooeyLostContext.loseContext();
      return true;
    });
    if(contextLossSupported){
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav canvas + span')).display==='block');
      await page.evaluate(()=>window.__gooeyLostContext.restoreContext());
      await page.waitForFunction(()=>getComputedStyle(document.querySelector('nav canvas')).display==='block');
      results.push({mode:'context-loss-and-restoration',passed:true});
    }

    const noGl=await page.context().newPage();
    noGl.on('pageerror',onError);
    noGl.on('console',onConsole);
    try {
      await noGl.addInitScript(()=>{
        const original=HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext=function(type,...args){
          if(type==='webgl2')return null;
          return original.call(this,type,...args);
        };
      });
      await noGl.goto(origin);
      await nav(noGl).waitFor();
      await noGl.waitForFunction(()=>getComputedStyle(document.querySelector('nav canvas + span')).display==='block');
      await noGl.evaluate(()=>window.__gooeyClientNavigation=true);
      await select('Projects','/projects',noGl);
      const snapshot=await state(noGl);
      if(snapshot.active[0]!=='/projects'||snapshot.fallback!=='block'||snapshot.canvas!=='none')throw new Error('No-WebGL navigation lost the static pill');
      if(!await noGl.evaluate(()=>window.__gooeyClientNavigation))throw new Error('No-WebGL navigation reloaded the document');
      results.push({mode:'no-webgl',...snapshot});
    } finally {
      noGl.off('pageerror',onError);
      noGl.off('console',onConsole);
      await noGl.close();
    }
    if(exceptions.length||prefetchWarnings.length)throw new Error(JSON.stringify({exceptions,prefetchWarnings}));
    return {results,clientNavigation:true,keyboardFocus:true,scrollVisibility:true,exceptions,prefetchWarnings};
  } finally {
    page.off('pageerror',onError);
    page.off('console',onConsole);
    page.off('request',onRequest);
    await page.emulateMedia({reducedMotion:'no-preference'});
  }
}
