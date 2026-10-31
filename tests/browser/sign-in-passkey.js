// biome-ignore-all format: Playwright CLI evaluates this file as an expression.
async sessionPage=>{
  const context=await sessionPage.context().browser().newContext();
  const page=await context.newPage(),origin=new URL(sessionPage.url()).origin;
  let held=null,hold=false;
  const assert=(value,message)=>{if(!value)throw Error(message)};
  await page.addInitScript(()=>{
    window.passkeyReview={calls:[],aborted:0};
    PublicKeyCredential.isConditionalMediationAvailable=async()=>true;
    navigator.credentials.get=options=>{
      window.passkeyReview.calls.push(options.mediation||'explicit');
      if(options.mediation==='conditional')return new Promise((_resolve,reject)=>{
        options.signal.addEventListener('abort',()=>{window.passkeyReview.aborted++;reject(new DOMException('Aborted','AbortError'))},{once:true});
      });
      return Promise.reject(new DOMException('Cancelled','NotAllowedError'));
    };
  });
  const challenge={challenge:'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',rpId:new URL(origin).hostname,allowCredentials:[],userVerification:'preferred',timeout:60000};
  const fulfillChallenge=route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(challenge)});
  await page.route('**/api/auth/**',async route=>{
    if(new URL(route.request().url()).pathname.endsWith('/generate-authenticate-options')){
      if(hold){held=route;return}
      return fulfillChallenge(route);
    }
  return route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({code:'INVALID_EMAIL_OR_PASSWORD',message:'Fixture failure'})});
  });
  try {
    await page.goto(`${origin}/sign-in`);await page.waitForFunction(()=>window.passkeyReview.calls.includes('conditional'));
    const submit=page.getByRole('button',{name:'Sign in',exact:true});
    assert(await submit.isEnabled(),'Conditional prompt blocked form');
    await page.getByLabel('Email',{exact:true}).fill('fixture@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await submit.click();
    await page.getByRole('alert').filter({hasText:'Email or password is incorrect.'}).waitFor();
    assert(await page.evaluate(()=>window.passkeyReview.aborted)>0,'Password did not cancel autofill');
    await page.getByRole('button',{name:'Sign in with passkey',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Passkey sign-in was cancelled.'}).waitFor();
    assert(await page.evaluate(()=>window.passkeyReview.calls.includes('explicit')),'Explicit prompt never started');
    hold=true;await page.goto(`${origin}/sign-in`);
    await page.waitForRequest(request=>request.url().includes('/generate-authenticate-options')).catch(()=>{});
    await page.getByLabel('Email',{exact:true}).fill('fixture@example.test');await page.getByLabel('Password',{exact:true}).fill('fixture-password');await submit.click();
    await page.getByRole('alert').filter({hasText:'Email or password is incorrect.'}).waitFor();
    assert(held!==null,'Delayed challenge not captured');
    await fulfillChallenge(held).catch(()=>{});held=null;
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    assert(await page.evaluate(()=>window.passkeyReview.calls.length)===0,'Late conditional challenge started a ceremony');
    hold=false;await page.goto(`${origin}/sign-in`);await page.waitForFunction(()=>window.passkeyReview.calls.includes('conditional'));
    await page.getByRole('link',{name:'Back to home',exact:true}).click();await page.waitForURL(url=>url.pathname==='/');
    assert(await page.evaluate(()=>window.passkeyReview.aborted)>0,'Leaving sign-in did not cancel conditional UI');
    return {conditionalNonBlocking:true,explicitCancelsConditional:true,lateChallengeIgnored:true,unmountCancels:true};
  }finally{if(held)await held.abort().catch(()=>{});await context.close()}
}
