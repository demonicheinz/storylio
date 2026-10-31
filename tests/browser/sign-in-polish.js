// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const context=await sessionPage.context().browser().newContext();
  const page=await context.newPage(),origin=new URL(sessionPage.url()).origin;
  const errors=[],results=[],requests=[];
  page.on('pageerror',error=>errors.push(error.message));
  let mode='credentials';
  await page.addInitScript(()=>{
    if(window.PublicKeyCredential)PublicKeyCredential.isConditionalMediationAvailable=async()=>false;
    if(navigator.credentials)navigator.credentials.get=async()=>{throw new DOMException('User cancelled','NotAllowedError')};
  });
 // All authentication calls stay local to the fixture, including challenges.
  await page.route('**/api/auth/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    requests.push({path,body:route.request().postDataJSON()});
    if(path.endsWith('/generate-authenticate-options'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({challenge:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',rpId:new URL(origin).hostname,allowCredentials:[],userVerification:'preferred',timeout:60000})});
    if(mode==='offline'&&path.endsWith('/sign-in/email'))return route.abort('failed');
    // A successful provider response without automatic navigation preserves the
    // exact locked UI state that a real OAuth departure stores in bfcache.
    if(mode==='social-success'&&path.endsWith('/sign-in/social'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({url:`${origin}/oauth-fixture`,redirect:false})});
    const status=path.endsWith('/sign-in/email')?(mode==='throttle'?429:mode==='server'?500:401):400;
    return route.fulfill({status,contentType:'application/json',body:JSON.stringify({code:status===401?'INVALID_EMAIL_OR_PASSWORD':'FIXTURE_ERROR',message:'Fixture response'})});
  });
  const assert=(value,message)=>{if(!value)throw Error(message)};
  const submit=()=>page.getByRole('button',{name:'Sign in',exact:true});
  let stage='layout';
  try {
    for(const [width,height]of [[1440,1000],[1024,900],[768,1024],[390,844],[320,740],[844,390],[390,420]]){
      stage=`layout ${width}x${height}`;
      await page.setViewportSize({width,height});await page.goto(`${origin}/sign-in`);
      await page.getByRole('heading',{name:'Sign in to Storylio',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
      const geometry=await page.evaluate(()=>({width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,top:document.querySelector('main a').getBoundingClientRect().top,main:document.querySelectorAll('main').length,formWidth:document.querySelector('form').getBoundingClientRect().width,controls:[...document.querySelectorAll('input,button:not([data-nextjs-dialog-close])')].filter(el=>el.closest('main')).map(el=>({height:el.getBoundingClientRect().height,label:el.getAttribute('aria-label')||el.textContent})),native:!document.documentElement.classList.contains('lenis')}));
      assert(!geometry.overflow&&geometry.top>=0&&geometry.main===1&&geometry.formWidth<=401&&geometry.native,`Layout invalid ${JSON.stringify(geometry)}`);
      assert(geometry.controls.every(item=>item.height>=44),`Small controls ${JSON.stringify(geometry)}`);
      assert(await page.getByLabel('Password',{exact:true}).getAttribute('type')==='password','Password absent or unmasked');
      assert(await page.getByLabel('Password',{exact:true}).getAttribute('autocomplete')==='current-password','Password manager hint missing');
      assert((await page.locator('meta[name="robots"]').getAttribute('content')).includes('noindex'),'Sign-in indexable');
      if(width===1440||width===390&&height===844)await page.screenshot({path:`task/signin-polish/signin-${width}.png`});
      await page.getByRole('link',{name:'Back to home',exact:true}).scrollIntoViewIfNeeded();
      const back=await page.getByRole('link',{name:'Back to home',exact:true}).boundingBox();
      assert(back.y>=0&&back.y+back.height<=height+1,'Back link unreachable');
      results.push(geometry);
    }
    stage='validation';await page.setViewportSize({width:390,height:844});await page.goto(`${origin}/sign-in?callbackUrl=%2Fdashboard%2Fsettings%3Ftab%3Dsecurity`);
    await submit().click();await page.getByText('Enter a valid email address.',{exact:true}).waitFor();
    await page.getByText('Enter your password.',{exact:true}).waitFor();
    assert(await page.getByLabel('Email',{exact:true}).getAttribute('aria-invalid')==='true','Field error not exposed');
    await page.getByLabel('Email',{exact:true}).fill('fixture@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');
    await page.getByRole('button',{name:'Show password',exact:true}).click();
    assert(await page.getByLabel('Password',{exact:true}).getAttribute('type')==='text','Reveal failed');
    await page.getByRole('button',{name:'Hide password',exact:true}).click();
    for(const [nextMode,message]of [['credentials','Email or password is incorrect.'],['throttle','Too many attempts. Please wait a minute and try again.'],['server','Unable to sign in. Please try again.']]){
      mode=nextMode;stage=mode;await submit().click();await page.getByRole('alert').filter({hasText:message}).waitFor();assert(await submit().isEnabled(),'Password form stayed locked');
    }
    assert(requests.filter(r=>r.path.endsWith('/sign-in/email')).every(r=>r.body.callbackURL==='/dashboard/settings?tab=security'),'Callback not preserved');
    mode='offline';await submit().click();await page.getByRole('alert').filter({hasText:/Unable to connect|Unable to sign in/}).waitFor();assert(await submit().isEnabled(),'Offline form stayed locked');
    stage='social failure';const github=page.getByRole('button',{name:'Continue with GitHub',exact:true});
    if(await github.count()){
      await github.click();await page.getByRole('alert').filter({hasText:'Unable to sign in with GitHub.'}).waitFor();assert(await github.isEnabled()&&await submit().isEnabled(),'OAuth failure locks form');
    }
    stage='cancelled passkey';await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();
    await page.getByRole('alert').filter({hasText:/Passkey sign-in was cancelled/}).waitFor();assert(await submit().isEnabled(),'Passkey cancellation locks form');
    stage='unsafe callback';mode='credentials';await page.goto(`${origin}/sign-in?callbackUrl=javascript%3Aalert(1)`);
    await page.getByLabel('Email',{exact:true}).fill('fixture@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await submit().click();
    await page.getByRole('alert').filter({hasText:'Email or password is incorrect.'}).waitFor();
    assert(requests.filter(r=>r.path.endsWith('/sign-in/email')).at(-1).body.callbackURL==='/dashboard','Unsafe callback escaped');
    stage='bfcache restore';let bfcacheTested=false;
    if(await github.count()){
      mode='social-success';await github.click();
      await page.getByRole('button',{name:'Redirecting…',exact:true}).waitFor();
      assert(await submit().isDisabled(),'Successful provider request did not retain pending state');
      await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:false})));
      assert(await submit().isDisabled(),'Ordinary pageshow interrupted pending authentication');
      await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
      await page.waitForFunction(()=>!document.querySelector('button[type="submit"]').disabled);
      assert(await github.isEnabled()&&await page.getByLabel('Email',{exact:true}).isEnabled()&&await page.getByLabel('Password',{exact:true}).isEnabled(),'Persisted restore left controls disabled');
      mode='credentials';await github.click();
      await page.getByRole('alert').filter({hasText:'Unable to sign in with GitHub.'}).waitFor();
      assert(await submit().isEnabled(),'Restored lock still blocked a new attempt');
      bfcacheTested=true;
    }
    assert(errors.length===0,errors.join('\n'));
    return {results,validation:true,errorRecovery:true,githubTested:await github.count()>0,passkeyCancelled:true,callbackSafe:true,bfcacheTested,errors};
  }catch(error){error.message+=` Stage: ${stage}`;throw error}
  finally{await context.close()}
}
